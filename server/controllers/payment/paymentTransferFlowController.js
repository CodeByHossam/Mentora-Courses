// Direct transfer submission and approval flow. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const User = require("../../models/User");
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const AdminSettings = require("../../models/AdminSettings");
const { sanitizeHtml, sanitizeText, sanitizeObjectId, sanitizeNumber } = require("../../utils/sanitizer");
const { autoEnrollStudent, processInstructorCommission, finalizeEnrollmentAndBills } = require("./paymentHelpers");
const { uploadToS3, deleteFromS3 } = require("../../utils/aws");

// @desc    Handle direct transfer payment
// @route   POST /api/payments/direct-transfer
// @access  Private
const handleDirectTransfer = asyncHandler(async (req, res) => {
  // Sanitize inputs
  const paymentId = sanitizeObjectId(req.body.paymentId);
  const transferDetails = {
    bankName: sanitizeText(req.body.transferDetails?.bankName, 100),
    accountNumber: sanitizeText(req.body.transferDetails?.accountNumber, 30),
    transferAmount: sanitizeNumber(req.body.transferDetails?.transferAmount, {
      min: 0.01,
      max: 999999.99,
    }),
    transferDate: new Date(req.body.transferDetails?.transferDate),
    referenceNumber: sanitizeText(
      req.body.transferDetails?.referenceNumber,
      50
    ),
  };
  const receiptFile = req.file;

  if (!paymentId || !transferDetails || !receiptFile) {
    res.status(400);
    throw new Error(
      "Payment ID, transfer details, and receipt file are required"
    );
  }

  try {
    // Find payment record
    const payment = await Payment.findById(paymentId)
      .populate("course", "title")
      .populate("userId", "name email");

    if (!payment) {
      res.status(404);
      throw new Error("Payment record not found");
    }

    if (payment.userId._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("Unauthorized access to payment");
    }

    // Upload receipt to S3
    const uploadResult = await uploadToS3(receiptFile, "payment-receipts");

    // Update payment with transfer details
    payment.directTransferDetails = {
      bankName: transferDetails.bankName,
      accountNumber: transferDetails.accountNumber,
      transferAmount: parseFloat(transferDetails.transferAmount),
      transferDate: new Date(transferDetails.transferDate),
      referenceNumber: transferDetails.referenceNumber,
    };
    payment.receiptUrl = uploadResult.Location;
    payment.receiptS3Key = uploadResult.Key;
    payment.status = "submitted"; // Changed from pending to submitted for admin review

    await payment.save();

    // Check admin settings for auto-approval
    const settings = await AdminSettings.getSettings();

    if (!settings.paymentSettings.requireAdminApprovalForDirectTransfer) {
      // Auto-approve and enroll
      payment.status = "paid";
      payment.paidAt = new Date();

      // Ensure finalAmount is set (for backward compatibility)
      if (!payment.finalAmount && payment.amount) {
        payment.finalAmount = payment.amount;
      }

      await payment.save();

      // Update user bill
      const user = await User.findById(payment.userId); // FIXED: Use userId
      const bill = user.bills.find((b) =>
        b.description.includes(payment.course.title)
      );
      if (bill) {
        bill.status = "paid";
        bill.paidAt = new Date();
        bill.paymentId = payment._id;
        await user.save();
      }

      // Auto-enroll
      await autoEnrollStudent(payment.userId, payment.course._id, payment._id); // FIXED: Use userId

      res.status(200).json({
        success: true,
        message:
          "Direct transfer payment processed and student enrolled successfully",
        data: payment,
      });
    } else {
      // Create enrollment request for admin approval
      const existingRequest = await EnrollmentRequest.findOne({
        student: payment.userId, // FIXED: Use userId from payment
        course: payment.course._id,
        status: "pending",
      });

      if (!existingRequest) {
        await EnrollmentRequest.create({
          student: payment.userId, // FIXED: Use userId from payment
          course: payment.course._id,
          paymentMethod: "direct_transfer",
          transferredAmount: payment.amount,
          paymentId: payment._id,
        });
      }

      res.status(200).json({
        success: true,
        message: "Direct transfer payment submitted for admin approval",
        data: payment,
      });
    }
  } catch (error) {
    logger.error("Direct transfer error:", error);
    res.status(500);
    throw new Error("Failed to process direct transfer payment");
  }
});

// @desc    Admin approve direct transfer payment
// @route   POST /api/payments/:id/approve
// @access  Private/Admin

// @desc    Admin approve direct transfer payment
// @route   POST /api/payments/:id/approve
// @access  Private/Admin
const approveDirectTransferPayment = asyncHandler(async (req, res) => {
  // Sanitize inputs
  const id = sanitizeObjectId(req.params.id);
  const { action, adminNotes } = req.body;

  // Support both old and new API formats
  const approved = action === "approve" || Boolean(req.body.approved);
  const adminNote = sanitizeText(adminNotes || req.body.adminNote, 500);

  logger.info("≡ƒöì Course payment approval request:", {
    paymentId: id,
    action,
    approved,
    adminId: req.user.id,
    adminRole: req.user.role,
  });

  const payment = await Payment.findById(id)
    .populate("course", "title")
    .populate("userId", "name email");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  if (payment.method !== "direct_transfer") {
    res.status(400);
    throw new Error("This endpoint is only for direct transfer payments");
  }

  try {
    if (approved) {
      // Approve payment
      payment.status = "paid";
      payment.paidAt = new Date();
      payment.admin = req.user._id;

      // Ensure finalAmount is set (for backward compatibility)
      if (!payment.finalAmount && payment.amount) {
        payment.finalAmount = payment.amount;
      }

      logger.info("≡ƒÆ│ Saving payment with status:", payment.status);
      await payment.save();
      logger.info("Γ£à Payment saved successfully");

      // Update user bill
      const user = await User.findById(payment.userId._id);
      const bill = user.bills.find((b) =>
        b.description.includes(payment.course.title)
      );
      if (bill) {
        bill.status = "paid";
        bill.paidAt = new Date();
        bill.paymentId = payment._id;
        await user.save();
      }

      // Auto-enroll student
      const enrollmentResult = await autoEnrollStudent(
        payment.userId, // FIXED: Use userId
        payment.course._id,
        payment._id
      );

      // Update any related enrollment request
      const enrollmentRequest = await EnrollmentRequest.findOne({
        student: payment.userId, // FIXED: Use userId from payment
        course: payment.course._id,
        status: "pending",
      });

      if (enrollmentRequest) {
        enrollmentRequest.status = "approved";
        if (adminNote) {
          enrollmentRequest.addAdminNote(adminNote, req.user._id);
        }
        await enrollmentRequest.save();
      }

      // Authoritative finalization path
      try {
        await payment.completePayment(req.user._id);
      } catch (error) {
        logger.error("Γ¥î completePayment error:", error);
      }

      res.status(200).json({
        success: true,
        message: "Payment approved and student enrolled successfully",
        data: { payment, enrollment: enrollmentResult },
      });
    } else {
      // Reject payment
      payment.status = "failed";
      payment.failureReason = adminNote || "Payment rejected by admin";
      payment.admin = req.user._id;

      // Ensure finalAmount is set (for backward compatibility)
      if (!payment.finalAmount && payment.amount) {
        payment.finalAmount = payment.amount;
      }

      await payment.save();

      // Update related enrollment request
      const enrollmentRequest = await EnrollmentRequest.findOne({
        student: payment.userId, // FIXED: Use userId from payment
        course: payment.course._id,
        status: "pending",
      });

      if (enrollmentRequest) {
        enrollmentRequest.status = "rejected";
        if (adminNote) {
          enrollmentRequest.addAdminNote(adminNote, req.user._id);
        }
        await enrollmentRequest.save();
      }

      res.status(200).json({
        success: true,
        message: "Payment rejected",
        data: payment,
      });
    }
  } catch (error) {
    logger.error("Γ¥î Payment approval error:", error);
    logger.error("Γ¥î Error stack:", error.stack);
    logger.error("Γ¥î Error message:", error.message);
    res.status(500).json({
      success: false,
      message: "Payment approval failed",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// @desc    Confirm PayPal payment (idempotent, robust)
// @route   POST /api/payments/paypal/confirm
// @access  Private

module.exports = {
  handleDirectTransfer,
  approveDirectTransferPayment
};
