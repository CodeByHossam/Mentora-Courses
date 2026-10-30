const logger = require('../../utils/logger');
/**
 * PAYMENT CONTROLLER - COMPREHENSIVE PAYMENT PROCESSING SYSTEM
 *
 * =============================================================================
 * CONTROLLER RESPONSIBILITIES:
 * =============================================================================
 *
 * 💳 PAYMENT PROCESSING:
 *   - Stripe integration with secure payment intents
 *   - PayPal checkout and webhook handling
 *   - Direct transfer validation and approval
 *   - Multi-gateway payment support
 *
 * 📈 FINANCIAL CALCULATIONS:
 *   - Admin fee calculations (percentage + fixed)
 *   - Instructor commission calculations
 *   - Real-time profit margin analysis
 *   - Currency conversion and formatting
 *
 * 🔄 WORKFLOW MANAGEMENT:
 *   - Payment status tracking (pending → processing → completed)
 *   - Approval workflows for direct transfers
 *   - Automatic enrollment upon payment success
 *   - Billing system integration
 *
 * 📊 REPORTING & ANALYTICS:
 *   - Comprehensive payment reports
 *   - Monthly revenue analytics
 *   - Payment method performance
 *   - Course sales statistics
 *
 * 🔐 SECURITY & COMPLIANCE:
 *   - Input sanitization and validation
 *   - Rate limiting on payment endpoints
 *   - Secure webhook signature verification
 *   - PCI DSS compliance through payment gateways
 *
 * =============================================================================
 * PAYMENT FLOW ARCHITECTURE:
 * =============================================================================
 *
 * 1. INITIATE PAYMENT:
 *    - Create Payment record with pending status
 *    - Calculate admin fees and instructor amounts
 *    - Generate payment intent (Stripe) or order (PayPal)
 *
 * 2. PROCESS PAYMENT:
 *    - Handle gateway responses and webhooks
 *    - Validate payment completion
 *    - Update payment status
 *
 * 3. COMPLETE TRANSACTION:
 *    - Call payment.completePayment() method
 *    - Create billing transactions
 *    - Update specialized billing accounts
 *    - Trigger enrollment and notifications
 *
 * =============================================================================
 * @author Mentora Development Team
 * @version 2.0.0 - Enhanced with specialized billing system
 * @lastUpdated 2024
 * =============================================================================
 */

const asyncHandler = require("express-async-handler");

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    stripe = null;
  }
}

const Payment = require("../../models/Payment");
const Course = require("../../models/Course");
const { getMethod } = require("../../services/paymentMethods");

const User = require("../../models/User");
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const AdminSettings = require("../../models/AdminSettings");
const { processCoursePurchase } = require("../../utils/specializedBillingUtils");

// Import simple notification utility
const {
  notifyPaymentReceived,
  notifyPaymentApproved,
} = require("../../utils/notificationUtils");

/**
 * Process instructor commission for completed payments
 * This ensures instructor billing accounts are properly credited
 */
const processInstructorCommission = async (payment) => {
  try {
    if (!payment.course || !payment.userId) {
      logger.info(
        "Skipping commission processing - missing course or user data"
      );
      return;
    }

    // Get course details to find instructor
    const course = await Course.findById(payment.course).populate("instructor");
    if (!course || !course.instructor) {
      logger.info(
        "Skipping commission processing - course or instructor not found"
      );
      return;
    }

    // Process the course purchase in billing system
    await processCoursePurchase({
      studentId: payment.userId,
      instructorId: course.instructor._id,
      courseId: course._id,
      paymentId: payment._id,
      finalAmount: payment.finalAmount || payment.amount || 0,
      adminFee: payment.adminFeeFixed || 0,
      adminPercentage: payment.adminPercentage || 10,
      paymentMethod: payment.method || "unknown",
    });

    logger.info(
      `✅ Instructor commission processed for payment ${payment._id}`
    );
  } catch (error) {
    logger.error("Error processing instructor commission:", error);
    // Don't throw error to avoid breaking payment flow
  }
};
const {
  sanitizeHtml,
  sanitizeText,
  sanitizeObjectId,
  sanitizeNumber,
} = require("../../utils/sanitizer");
const {
  createBillingTransactionForCoursePayment,
  addCreditsToUser,
  checkAndUpdateAccountStatus,
  createCreditPaymentMiddleware,
} = require("../../utils/billingUtils");

// PayPal integration removed; direct transfer only. PayPal environment/client no longer initialized.

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

  // 🔍 VALIDATION: Ensure required fields are present
  if (!userId || !course || !finalAmount) {
    res.status(400);
    throw new Error("Student ID, course, and amount are required");
  }

  // 💰 CALCULATE FEES: Get admin settings for fee calculation
  const adminSettings = await AdminSettings.getSettings();
  const adminPercentage =
    adminSettings.paymentSettings?.globalDeductionPercentage || 10;
  const adminFeeFixed = adminSettings.paymentSettings?.studentAdminFee || 2;

  // 📈 CREATE PAYMENT: Initialize payment record
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

  // 📈 CALCULATE SHARES: Determine admin and instructor amounts
  payment.calculateShares();
  await payment.save();

  // 🔗 UPDATE RELATIONSHIPS - Add payment to user and course
  if (course) {
    await Course.findByIdAndUpdate(course, {
      $addToSet: { payments: payment._id },
    });
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: { payments: payment._id },
  });

  logger.info("🎆 Payment created successfully:", {
    paymentId: payment._id,
    amount: payment.finalAmount,
    method: payment.method,
    adminFee: payment.adminFee,
    instructorAmount: payment.instructorAmount,
  });

  // 📧 SIMPLE NOTIFICATION: Notify instructor about new payment
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
  processInstructorCommission,
  createPayment,
  getStudentPayments,
  deletePayment,
  updatePayment,
  createCreditPaymentMiddleware,
  ...require('../paymentReportController'),
  ...require('./paymentBillingController'),
};
