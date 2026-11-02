// Payment record CRUD. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const Course = require("../../models/Course");
const User = require("../../models/User");
const AdminSettings = require("../../models/AdminSettings");
const { notifyPaymentReceived, notifyPaymentApproved } = require("../../utils/notificationUtils");
const { sanitizeHtml, sanitizeText, sanitizeObjectId, sanitizeNumber } = require("../../utils/sanitizer");

/**
 * CREATE PAYMENT RECORD
 *
 * Creates a new payment record in the system with proper validation
 * and initial status. This is typically called when initiating a payment.
 *
 * @route   POST /api/payments
 * @access  Admin/Instructor
 * @param   {Object} req.body - Payment details
 * @param   {ObjectId} req.body.userId - Student making payment
 * @param   {ObjectId} req.body.course - Course being purchased
 * @param   {Number} req.body.finalAmount - Final payment amount
 * @param   {String} req.body.method - Payment method (stripe/paypal/direct_transfer)
 * @returns {Object} Created payment record
 */
const createPayment = asyncHandler(async (req, res) => {
  const {
    userId,
    course,
    enrollmentRequest,
    finalAmount,
    method,
    type = "course_payment",
  } = req.body;

  // ≡ƒöì VALIDATION: Ensure required fields are present
  if (!userId || !course || !finalAmount) {
    res.status(400);
    throw new Error("Student ID, course, and amount are required");
  }

  // ≡ƒÆ░ CALCULATE FEES: Get admin settings for fee calculation
  const adminSettings = await AdminSettings.getSettings();
  const adminPercentage =
    adminSettings.paymentSettings?.globalDeductionPercentage || 10;
  const adminFeeFixed = adminSettings.paymentSettings?.studentAdminFee || 2;

  // ≡ƒôê CREATE PAYMENT: Initialize payment record
  const payment = await Payment.create({
    userId: sanitizeObjectId(userId),
    course: sanitizeObjectId(course),
    enrollmentRequest: enrollmentRequest
      ? sanitizeObjectId(enrollmentRequest)
      : null,
    type,
    finalAmount: sanitizeNumber(finalAmount),
    method: sanitizeText(method),
    adminPercentage,
    adminFeeFixed,
    status: "pending",
    paymentSource:
      method === "direct_transfer" ? "direct_transfer" : "electronic",
    metadata: {
      createdBy: req.user?._id,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip,
    },
  });

  // ≡ƒôê CALCULATE SHARES: Determine admin and instructor amounts
  payment.calculateShares();
  await payment.save();

  // ≡ƒöù UPDATE RELATIONSHIPS - Add payment to user and course
  if (course) {
    await Course.findByIdAndUpdate(course, {
      $addToSet: { payments: payment._id },
    });
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: { payments: payment._id },
  });

  logger.info("≡ƒÄå Payment created successfully:", {
    paymentId: payment._id,
    amount: payment.finalAmount,
    method: payment.method,
    adminFee: payment.adminFee,
    instructorAmount: payment.instructorAmount,
  });

  // ≡ƒôº SIMPLE NOTIFICATION: Notify instructor about new payment
  try {
    const populatedPayment = await Payment.findById(payment._id)
      .populate("userId", "name email")
      .populate("course", "title instructor");

    if (
      populatedPayment &&
      populatedPayment.course &&
      populatedPayment.userId
    ) {
      await notifyPaymentReceived(
        populatedPayment.userId._id,
        populatedPayment.course.instructor,
        populatedPayment.course.title,
        populatedPayment.userId.name,
        populatedPayment.finalAmount,
        populatedPayment.method
      );
    }
  } catch (notificationError) {
    logger.error("Error creating payment notification:", notificationError);
    // Don't fail the payment creation if notification fails
  }

  res.status(201).json({
    success: true,
    message: "Payment record created successfully",
    data: {
      paymentId: payment._id,
      amount: payment.finalAmount,
      adminFee: payment.adminFee,
      instructorAmount: payment.instructorAmount,
      status: payment.status,
      method: payment.method,
    },
  });
});

// =============================================================================
// LEGACY FUNCTIONS - MAINTAINED FOR BACKWARD COMPATIBILITY
// These functions will be gradually replaced by the new payment system
// =============================================================================

// (Optional) @desc Get payments for a specific student
// GET /api/payments/student/:id

// (Optional) @desc Get payments for a specific student
// GET /api/payments/student/:id
const getStudentPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ userId: req.params.id }).populate(
    "course",
    "title"
  );

  res.status(200).json({
    success: true,
    message: "Student payments",
    data: payments,
  });
});

// @desc    Delete a payment (refund/cancel)
// @route   DELETE /api/payments/:id
// @access  Admin

// @desc    Delete a payment (refund/cancel)
// @route   DELETE /api/payments/:id
// @access  Admin
const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  await payment.remove();

  res.status(200).json({
    success: true,
    message: "Payment cancelled/refunded",
    data: null,
  });
});

// @desc    Update payment (edit amount, method, etc.)
// @route   PUT /api/payments/:id
// @access  Admin

// @desc    Update payment (edit amount, method, etc.)
// @route   PUT /api/payments/:id
// @access  Admin
const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  const { amount, method, status } = req.body;

  if (amount !== undefined) payment.amount = amount;
  if (method) payment.method = method;
  if (status) payment.status = status;

  const updatedPayment = await payment.save();

  res.status(200).json({
    success: true,
    message: "Payment updated",
    data: updatedPayment,
  });
});

// @desc    Get comprehensive payment reports
// @route   GET /api/payments/reports
// @access  Admin

module.exports = {
  createPayment,
  getStudentPayments,
  deletePayment,
  updatePayment
};
