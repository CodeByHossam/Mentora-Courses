// User payment and bill queries. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const User = require("../../models/User");

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private/Admin
const getAllPayments = asyncHandler(async (req, res) => {
  const { status, method, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (method) filter.method = method;

  const payments = await Payment.find(filter)
    .populate("userId", "name email")
    .populate("course", "title price")
    .populate("recipientId", "name email")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Payment.countDocuments(filter);

  res.status(200).json({
    success: true,
    message: "Payments retrieved successfully",
    data: {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// @desc    Get user's payments
// @route   GET /api/payments/my-payments
// @access  Private

// @desc    Get user's payments
// @route   GET /api/payments/my-payments
// @access  Private
const getUserPayments = asyncHandler(async (req, res) => {
  logger.info("≡ƒöì getUserPayments called for user:", req.user._id);

  const payments = await Payment.find({ userId: req.user._id })
    .populate({
      path: "course",
      select: "title price instructor",
      populate: {
        path: "instructor",
        select: "name email",
      },
    })
    .sort({ createdAt: -1 });

  logger.info("≡ƒôè Found payments:", payments.length);

  // Debug: Log payment details to see what fields are available
  payments.forEach((payment) => {
    logger.info("≡ƒÆ│ Payment debug:", {
      id: payment._id,
      method: payment.method,
      status: payment.status,
      transfer: payment.transfer,
      receiptS3Key: payment.receiptS3Key,
      receiptUrl: payment.receiptUrl,
    });
  });

  res.status(200).json({
    success: true,
    message: "User payments retrieved successfully",
    data: payments,
  });
});

// @desc    Get user's bills
// @route   GET /api/payments/my-bills
// @access  Private

// @desc    Get user's bills
// @route   GET /api/payments/my-bills
// @access  Private
const getUserBills = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("bills.paymentId", "method status course")
    .populate({
      path: "bills.paymentId",
      populate: {
        path: "course",
        select: "title",
      },
    });

  res.status(200).json({
    success: true,
    message: "User bills retrieved successfully",
    data: user.bills.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ),
  });
});

// @desc    Get user's payments and bills combined
// @route   GET /api/payments/user/bills
// @access  Private

// @desc    Get user's payments and bills combined
// @route   GET /api/payments/user/bills
// @access  Private
const getUserPaymentsAndBills = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ userId: req.user._id })
    .populate("course", "title price")
    .sort({ createdAt: -1 });

  const user = await User.findById(req.user._id)
    .populate("bills.paymentId", "method status course")
    .populate({
      path: "bills.paymentId",
      populate: {
        path: "course",
        select: "title",
      },
    });

  res.status(200).json({
    success: true,
    message: "User payments and bills retrieved successfully",
    data: {
      payments,
      bills: user.bills.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    },
  });
});

// @desc    Get pending direct transfer payments (Admin)
// @route   GET /api/payments/admin/pending-transfers
// @access  Private/Admin

// @desc    Check payment status
// @route   POST /api/payments/:id/check-status
// @access  Private
const checkPaymentStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find the payment
    const payment = await Payment.findById(id).populate(
      "course",
      "title price"
    );

    if (!payment) {
      res.status(404);
      throw new Error("Payment not found");
    }

    // Check if user has access to this payment
    if (
      payment.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Access denied");
    }

    // Return payment status information
    res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
        finalAmount: payment.finalAmount,
        course: payment.course,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        paypalOrderId: payment.paypalOrderId,
        proofOfPayment: payment.proofOfPayment,
        adminNotes: payment.adminNotes,
      },
    });
  } catch (error) {
    logger.error("Check payment status error:", error);
    res.status(500);
    throw new Error("Failed to check payment status");
  }
});

// @desc    Check Stripe payment status directly and process if successful
// @route   POST /api/payments/:id/check-stripe-status
// @access  Private (User must own the payment or be admin)

module.exports = {
  getAllPayments,
  getUserPayments,
  getUserBills,
  getUserPaymentsAndBills,
  checkPaymentStatus
};
