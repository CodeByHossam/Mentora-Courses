// Payment receipt retrieval. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const Course = require("../../models/Course");

// @desc    Get payment receipt (only for direct transfer payments - Admin/Instructor only)
// @route   GET /api/payments/:id/receipt
// @access  Private (Admin or Instructor only - Students can only view, not download)
const getPaymentReceipt = asyncHandler(async (req, res) => {
  logger.info("≡ƒôä Payment receipt requested for:", req.params.id);

  try {
    // Find the payment
    const payment = await Payment.findById(req.params.id)
      .populate("userId", "name email")
      .populate("course", "title instructor");

    if (!payment) {
      logger.error("Γ¥î Payment not found:", req.params.id);
      res.status(404);
      throw new Error("Payment not found");
    }

    // Restrict download access - only admins and instructors can download receipts
    // Students can view payment details but cannot download receipts
    if (req.user.role === "student") {
      logger.error("Γ¥î Students cannot download receipts:", req.params.id);
      res.status(403);
      throw new Error(
        "Receipt download is not available for students. You can view payment details in your payment history."
      );
    }

    // For admin and instructor, check if they have access to this payment
    if (req.user.role === "admin") {
      // Admin can access any payment receipt
    } else if (req.user.role === "instructor") {
      // Instructor can access receipts for payments related to their courses
      const course = await Course.findById(payment.course);
      if (course && course.instructor.toString() !== req.user._id.toString()) {
        logger.error(
          "Γ¥î Instructor can only access receipts for their own courses:",
          req.params.id
        );
        res.status(403);
        throw new Error(
          "Access denied. You can only access receipts for payments related to your courses."
        );
      }
    } else {
      logger.error("Γ¥î Access denied for payment receipt:", req.params.id);
      res.status(403);
      throw new Error("Access denied");
    }

    // Only allow receipt download for direct transfer payments
    if (
      payment.method !== "direct_transfer" &&
      payment.method !== "bank_transfer"
    ) {
      res.status(400);
      throw new Error(
        "Receipts are only available for direct transfer payments"
      );
    }

    // Check if payment has receipt file (check both nested and direct fields)
    const receiptS3Key = payment.transfer?.s3Key || payment.receiptS3Key;
    const receiptUrl = payment.transfer?.receiptUrl || payment.receiptUrl;

    // Debug: Log all possible receipt-related fields
    logger.info("≡ƒöì Payment receipt fields debug:", {
      paymentId: payment._id,
      method: payment.method,
      status: payment.status,
      transfer: payment.transfer,
      receiptS3Key: payment.receiptS3Key,
      receiptUrl: payment.receiptUrl,
      directTransferDetails: payment.directTransferDetails,
      // Check all possible field variations
      allFields: Object.keys(payment.toObject ? payment.toObject() : payment),
    });

    if (!receiptS3Key && !receiptUrl) {
      res.status(404);
      throw new Error("No receipt file found for this payment");
    }

    // Use existing AWS middleware to get signed URL
    const { getSignedUrl } = require("../../utils/aws");

    let signedUrl;
    if (receiptS3Key) {
      // Generate signed URL for S3 file
      signedUrl = await getSignedUrl(receiptS3Key, 3600); // 1 hour expiry
    } else if (receiptUrl) {
      // Use existing receipt URL
      signedUrl = receiptUrl;
    }

    logger.info("Γ£à Receipt URL generated for payment:", payment._id);

    res.status(200).json({
      success: true,
      message: "Receipt URL generated successfully",
      data: {
        receiptUrl: signedUrl,
        fileName: `receipt-${payment._id
          .toString()
          .slice(-8)
          .toUpperCase()}.pdf`,
        expiresIn: "1 hour",
        paymentId: payment._id,
        method: payment.method,
      },
    });
  } catch (error) {
    logger.error("Γ¥î Error generating payment receipt:", error);
    res.status(500);
    throw new Error("Failed to generate receipt: " + error.message);
  }
});

// @desc    Process admin fee payment from instructor
// @route   POST /api/payments/admin-fee-payment
// @access  Private/Instructor

module.exports = {
  getPaymentReceipt
};
