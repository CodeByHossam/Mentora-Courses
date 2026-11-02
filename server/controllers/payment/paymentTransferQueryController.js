// Direct transfer queries and verification. Split from paymentController.js; function bodies unchanged.

const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const { sanitizeHtml, sanitizeText, sanitizeObjectId, sanitizeNumber } = require("../../utils/sanitizer");

// @desc    Get pending direct transfer payments (Admin)
// @route   GET /api/payments/admin/pending-transfers
// @access  Private/Admin
const getPendingDirectTransfers = asyncHandler(async (req, res) => {
  const pendingTransfers = await Payment.find({
    method: "direct_transfer",
    status: "pending",
  })
    .populate("userId", "name email")
    .populate("course", "title price")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Pending direct transfers retrieved successfully",
    data: pendingTransfers,
  });
});

// @desc    Get pending direct transfers for instructor's courses
// @route   GET /api/payments/instructor/pending-transfers
// @access  Private/Instructor

// @desc    Get pending direct transfers for instructor's courses
// @route   GET /api/payments/instructor/pending-transfers
// @access  Private/Instructor
const getInstructorPendingTransfers = asyncHandler(async (req, res) => {
  // Find payments that are direct_transfer and submitted/pending for courses owned by this instructor
  const transfers = await Payment.find({
    method: "direct_transfer",
    status: { $in: ["submitted", "pending"] },
  })
    .populate("course", "title instructor")
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  const filtered = transfers.filter(
    (p) =>
      p.course && p.course.instructor?.toString() === req.user._id.toString()
  );

  res.status(200).json({
    success: true,
    message: "Instructor pending transfers",
    data: filtered,
  });
});

// @desc    Instructor approve direct transfer payment
// @route   POST /api/payments/:id/instructor-approve
// @access  Private/Instructor

// Submit direct transfer payment
const submitDirectTransfer = asyncHandler(async (req, res) => {
  const paymentId = req.body.paymentId;
  const { transferAmount, transferDate, referenceNumber } = req.body;

  // Sanitize inputs
  const sanitizedTransferAmount = parseFloat(transferAmount);
  const sanitizedReferenceNumber = sanitizeText(referenceNumber, 100);

  // Validate required fields
  if (!sanitizedTransferAmount || !transferDate || !sanitizedReferenceNumber) {
    res.status(400);
    throw new Error("All transfer details are required");
  }

  if (sanitizedTransferAmount <= 0) {
    res.status(400);
    throw new Error("Transfer amount must be greater than 0");
  }

  // Find the payment
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  // Check if user owns this payment
  const paymentOwnerId = payment.userId ? payment.userId.toString() : (payment.student ? payment.student.toString() : null);
  if (paymentOwnerId !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this payment");
  }

  // Check if payment is in pending state
  if (payment.status !== "pending") {
    res.status(400);
    throw new Error("Payment is not in pending state");
  }

  // Handle file upload if present
  let receiptUrl = null;
  if (req.file) {
    // Store file path for now - in production this would be uploaded to S3
    receiptUrl = `/uploads/receipts/${req.file.filename}`;
  }

  // Update payment with transfer details
  payment.directTransferDetails = {
    transferAmount: sanitizedTransferAmount,
    transferDate: new Date(transferDate),
    referenceNumber: sanitizedReferenceNumber,
    receiptUrl,
    submittedAt: new Date(),
  };
  payment.status = "submitted"; // Changed from pending to submitted for admin review

  await payment.save();

  res.json({
    success: true,
    message:
      "Transfer details submitted successfully. Payment is under review.",
    payment: {
      id: payment._id,
      status: payment.status,
      directTransferDetails: payment.directTransferDetails,
    },
  });
});

// @desc    Verify payment status
// @route   GET /api/payments/:id/verify
// @access  Private

// @desc    Verify payment status
// @route   GET /api/payments/:id/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await Payment.findById(id)
    .populate("student", "name email")
    .populate("course", "title price");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  // Check if user owns this payment or is admin
  const ownerId = payment.userId ? payment.userId.toString() : (payment.student ? payment.student.toString() : null);
  if (
    ownerId !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to view this payment");
  }

  res.json({
    success: true,
    message: "Payment status retrieved successfully",
    payment: {
      id: payment._id,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      course: payment.course,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
    },
  });
});

// @desc    Approve direct transfer payment (Admin)
// @route   POST /api/payments/:id/approve
// @access  Private/Admin

module.exports = {
  getPendingDirectTransfers,
  getInstructorPendingTransfers,
  submitDirectTransfer,
  verifyPayment
};
