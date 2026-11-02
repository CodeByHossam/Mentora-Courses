// Direct transfer admin approval and rejection. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const User = require("../../models/User");
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const { notifyPaymentReceived, notifyPaymentApproved } = require("../../utils/notificationUtils");
const { sanitizeHtml, sanitizeText, sanitizeObjectId, sanitizeNumber } = require("../../utils/sanitizer");
const { createBillingTransactionForCoursePayment, addCreditsToUser, checkAndUpdateAccountStatus, createCreditPaymentMiddleware } = require("../../utils/billingUtils");
const { autoEnrollStudent, processInstructorCommission, finalizeEnrollmentAndBills } = require("./paymentHelpers");

// @desc    Instructor approve direct transfer payment
// @route   POST /api/payments/:id/instructor-approve
// @access  Private/Instructor
const instructorApproveDirectTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const note = sanitizeText(req.body.note, 500);

  const payment = await Payment.findById(id)
    .populate("course", "title instructor")
    .populate("student", "name email");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  if (payment.method !== "direct_transfer") {
    res.status(400);
    throw new Error("Only direct transfer payments can be approved here");
  }

  // Ensure this instructor owns the course
  if (
    !payment.course ||
    payment.course.instructor?.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("You are not authorized to approve this payment");
  }

  // Update status to paid and enroll
  payment.status = "paid";
  payment.paidAt = new Date();
  payment.admin = req.user._id; // Track who approved (instructor)
  if (note) payment.approvalNote = note;

  // Ensure finalAmount is set (for backward compatibility)
  if (!payment.finalAmount && payment.amount) {
    payment.finalAmount = payment.amount;
  }

  await payment.save();

  // Update user bill
  const user = await User.findById(payment.userId); // FIXED: Use userId
  const bill = user?.bills.find((b) =>
    b.description.includes(payment.course.title)
  );
  if (bill) {
    bill.status = "paid";
    bill.paidAt = new Date();
    bill.paymentId = payment._id;
    await user.save();
  }

  // Enroll student
  await autoEnrollStudent(payment.userId, payment.course._id, payment._id); // FIXED: Use userId

  // Auto-approve related enrollment request
  try {
    const enrollmentRequest = await EnrollmentRequest.findOne({
      student: payment.userId, // FIXED: Use userId from payment
      course: payment.course._id,
      status: "pending",
    });

    if (enrollmentRequest) {
      enrollmentRequest.status = "approved";
      enrollmentRequest.approvedBy = {
        user: req.user._id,
        role: req.user.role,
        approvedAt: new Date(),
      };
      await enrollmentRequest.save();
      logger.info(
        `Auto-approved related enrollment request: ${enrollmentRequest._id}`
      );
    }
  } catch (enrollmentError) {
    logger.error("Error auto-approving enrollment request:", enrollmentError);
    // Don't fail the payment approval if enrollment request update fails
  }

  // Create billing transaction for instructor commission tracking
  try {
    await createBillingTransactionForCoursePayment({
      studentId: payment.userId._id,
      courseId: payment.course._id,
      instructorId: payment.course.instructor,
      amount: payment.amount,
      paymentId: payment._id,
      method: "direct_transfer",
    });
    logger.info(
      `Billing transaction created for instructor-approved payment: ${payment._id}`
    );
  } catch (billingError) {
    logger.error(
      "Error creating billing transaction for instructor approval:",
      billingError
    );
    // Don't fail the approval if billing fails, but log it
  }

  // ≡ƒôº SIMPLE NOTIFICATION: Notify student about payment approval
  try {
    if (payment.userId && payment.course) {
      await notifyPaymentApproved(
        req.user._id, // instructor ID
        payment.userId._id, // student ID
        payment.course.title,
        payment.amount
      );
    }
  } catch (notificationError) {
    logger.error(
      "Error creating payment approval notification:",
      notificationError
    );
    // Don't fail the approval if notification fails
  }

  res.status(200).json({
    success: true,
    message:
      "Payment approved by instructor, student enrolled, and billing recorded",
    data: payment,
  });
});

// Submit direct transfer payment

// @desc    Approve direct transfer payment (Admin)
// @route   POST /api/payments/:id/approve
// @access  Private/Admin
const approveDirectTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id);
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  if (payment.status !== "submitted") {
    res.status(400);
    throw new Error("Payment is not in submitted state");
  }

  // Update payment status
  payment.status = "paid";
  payment.paidAt = new Date();
  payment.admin = req.user._id;

  // Ensure finalAmount is set (for backward compatibility)
  if (!payment.finalAmount && payment.amount) {
    payment.finalAmount = payment.amount;
  }

  await payment.save();

  res.json({
    success: true,
    message: "Direct transfer payment approved successfully",
    payment: {
      id: payment._id,
      status: payment.status,
      paidAt: payment.paidAt,
    },
  });
});

// @desc    Reject direct transfer payment (Admin)
// @route   POST /api/payments/:id/reject
// @access  Private/Admin

// @desc    Reject direct transfer payment (Admin)
// @route   POST /api/payments/:id/reject
// @access  Private/Admin
const rejectDirectTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const payment = await Payment.findById(id);
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  if (payment.status !== "submitted") {
    res.status(400);
    throw new Error("Payment is not in submitted state");
  }

  // Update payment status
  payment.status = "rejected";
  payment.rejectionReason = reason || "No reason provided";
  payment.admin = req.user._id;

  // Ensure finalAmount is set (for backward compatibility)
  if (!payment.finalAmount && payment.amount) {
    payment.finalAmount = payment.amount;
  }

  await payment.save();

  res.json({
    success: true,
    message: "Direct transfer payment rejected",
    payment: {
      id: payment._id,
      status: payment.status,
      rejectionReason: payment.rejectionReason,
    },
  });
});

// @desc    Initiate credit addition payment
// @route   POST /api/payments/credits/initiate
// @access  Private

module.exports = {
  instructorApproveDirectTransfer,
  approveDirectTransfer,
  rejectDirectTransfer
};
