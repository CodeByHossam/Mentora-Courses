const logger = require('../utils/logger');
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


const Payment = require("../models/Payment");
const Course = require("../models/Course");
const { getMethod } = require("../services/paymentMethods");

const User = require("../models/User");
const EnrollmentRequest = require("../models/EnrollmentRequest");
const AdminSettings = require("../models/AdminSettings");
const { processCoursePurchase } = require("../utils/specializedBillingUtils");

// Import simple notification utility
const {
  notifyPaymentReceived,
  notifyPaymentApproved,
} = require("../utils/notificationUtils");

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
} = require("../utils/sanitizer");
const {
  createBillingTransactionForCoursePayment,
  addCreditsToUser,
  checkAndUpdateAccountStatus,
  createCreditPaymentMiddleware,
} = require("../utils/billingUtils");

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
const getPaymentReports = asyncHandler(async (req, res) => {
  try {
    logger.info(
      "🔍 getPaymentReports called by user:",
      req.user.id,
      req.user.role
    );

    // Get admin settings for profit calculations
    let adminSettings;
    try {
      adminSettings = await AdminSettings.getSettings();
      logger.info(
        "✅ Admin settings loaded:",
        adminSettings ? "success" : "null"
      );
    } catch (settingsError) {
      logger.error("❌ Failed to load admin settings:", settingsError);
      // Use default settings if admin settings fail
      adminSettings = {
        paymentSettings: {
          globalDeductionPercentage: 10,
          instructorAnnualFee: 100,
          studentAdminFee: 5,
          currency: "USD",
        },
      };
    }

    const globalDeductionPercentage =
      adminSettings.paymentSettings?.globalDeductionPercentage || 0;
    logger.info(
      "🔍 Using globalDeductionPercentage:",
      globalDeductionPercentage
    );

    // Comprehensive payment data with populated fields
    let payments = [];
    try {
      payments = await Payment.find()
        .populate("userId", "name email role") // FIXED: Use userId instead of student
        .populate("course", "title price instructor")
        .populate("recipientId", "name email") // FIXED: Use recipientId instead of admin
        .sort({ createdAt: -1 });
      logger.info("✅ Payments loaded:", payments.length, "records");

      // Log any payments with missing data
      const paymentsWithMissingData = payments.filter(
        (p) => !p.course || !p.userId
      );
      if (paymentsWithMissingData.length > 0) {
        logger.info(
          "⚠️ Found payments with missing course/userId data:",
          paymentsWithMissingData.length
        );
        paymentsWithMissingData.forEach((p) => {
          logger.info(
            `Payment ${p._id}: course=${!!p.course}, userId=${!!p.userId}`
          );
        });
      }
    } catch (paymentError) {
      logger.error("❌ Failed to load payments:", paymentError);
      payments = []; // Use empty array if payments fail to load
    }

    // Calculate totals and analytics
    const totalPayments = payments.length;
    const paidPayments = payments.filter((p) => p.status === "paid");
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    // Recalculate admin profit using current settings
    const totalAdminProfit = paidPayments.reduce((sum, p) => {
      const currentAdminFee = (p.amount * globalDeductionPercentage) / 100;
      return sum + currentAdminFee;
    }, 0);

    // Recalculate instructor earnings using current settings
    const totalInstructorEarnings = paidPayments.reduce((sum, p) => {
      const currentAdminFee = (p.amount * globalDeductionPercentage) / 100;
      const currentInstructorAmount = p.amount - currentAdminFee;
      return sum + currentInstructorAmount;
    }, 0);

    // Payment method breakdown
    const paymentMethodStats = payments.reduce((acc, payment) => {
      const method = payment.method || "unknown";
      if (!acc[method]) {
        acc[method] = { count: 0, revenue: 0 };
      }
      acc[method].count++;
      if (payment.status === "paid") {
        acc[method].revenue += payment.amount;
      }
      return acc;
    }, {});

    // Monthly revenue data (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthPayments = paidPayments.filter(
        (p) => p.paidAt >= monthStart && p.paidAt <= monthEnd
      );

      const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const monthProfit = monthPayments.reduce((sum, p) => {
        const currentAdminFee = (p.amount * globalDeductionPercentage) / 100;
        return sum + currentAdminFee;
      }, 0);

      monthlyData.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue: monthRevenue,
        profit: monthProfit,
        count: monthPayments.length,
      });
    }

    // Course performance data
    const coursePerformance = {};
    paidPayments.forEach((payment) => {
      // Skip payments without valid course data
      if (!payment.course || !payment.course._id) {
        logger.info(
          "⚠️ Skipping payment with missing course data:",
          payment._id
        );
        return;
      }

      const courseId = payment.course._id.toString();
      if (!coursePerformance[courseId]) {
        coursePerformance[courseId] = {
          courseTitle: payment.course.title || "Unknown Course",
          instructor: payment.course.instructor?.name || "Unknown",
          totalRevenue: 0,
          totalProfit: 0,
          enrollmentCount: 0,
          averagePrice: 0,
        };
      }
      coursePerformance[courseId].totalRevenue += payment.amount;
      const currentAdminFee =
        (payment.amount * globalDeductionPercentage) / 100;
      coursePerformance[courseId].totalProfit += currentAdminFee;
      coursePerformance[courseId].enrollmentCount++;
    });

    // Calculate averages for course performance
    Object.values(coursePerformance).forEach((course) => {
      course.averagePrice =
        course.enrollmentCount > 0
          ? course.totalRevenue / course.enrollmentCount
          : 0;
    });

    // User fee analytics (annual fees)
    let userFeeData = [];
    try {
      userFeeData = await User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
            totalAnnualFees: {
              $sum: {
                $cond: [
                  { $eq: ["$role", "instructor"] },
                  adminSettings.paymentSettings?.instructorAnnualFee || 0,
                  adminSettings.paymentSettings?.studentAdminFee || 0,
                ],
              },
            },
          },
        },
      ]);
      logger.info(
        "✅ User fee data loaded:",
        userFeeData.length,
        "role groups"
      );
    } catch (userError) {
      logger.error("❌ Failed to load user fee data:", userError);
      userFeeData = []; // Use empty array if user data fails to load
    }

    // Status breakdown
    const statusBreakdown = payments.reduce((acc, payment) => {
      const status = payment.status;
      if (!acc[status]) {
        acc[status] = { count: 0, amount: 0 };
      }
      acc[status].count++;
      acc[status].amount += payment.amount;
      return acc;
    }, {});

    logger.info("✅ Payment reports generated successfully");

    res.json({
      success: true,
      data: {
        overview: {
          totalPayments,
          totalRevenue,
          totalAdminProfit,
          totalInstructorEarnings,
          averagePayment: totalPayments > 0 ? totalRevenue / totalPayments : 0,
          profitMargin:
            totalRevenue > 0 ? (totalAdminProfit / totalRevenue) * 100 : 0,
        },
        payments: payments.map((payment) => {
          // Recalculate fees using current admin settings
          const currentAdminFee =
            (payment.amount * globalDeductionPercentage) / 100;
          const currentInstructorAmount = payment.amount - currentAdminFee;

          return {
            _id: payment._id,
            student: payment.userId || null, // FIXED: Use userId field but keep student key for frontend compatibility
            course: payment.course || null,
            amount: payment.amount || 0,
            originalAmount: payment.originalAmount || payment.amount || 0,
            adminFee: currentAdminFee, // Use recalculated value
            adminPercentage: globalDeductionPercentage, // Use current percentage
            instructorAmount: currentInstructorAmount, // Use recalculated value
            method: payment.method || "unknown",
            status: payment.status || "unknown",
            paidAt: payment.paidAt || null,
            createdAt: payment.createdAt || null,
            admin: payment.admin || null,
            transferDetails: payment.transferDetails || null,
            receiptUrl: payment.receiptUrl || null,
          };
        }),
        analytics: {
          paymentMethodStats,
          monthlyData,
          coursePerformance: Object.values(coursePerformance).sort(
            (a, b) => b.totalRevenue - a.totalRevenue
          ),
          statusBreakdown,
          userFeeData,
        },
        settings: {
          globalDeductionPercentage,
          instructorAnnualFee:
            adminSettings.paymentSettings.instructorAnnualFee,
          studentAdminFee: adminSettings.paymentSettings.studentAdminFee,
          currency: adminSettings.paymentSettings.currency,
        },
      },
    });
  } catch (error) {
    logger.error("❌ Payment reports error:", error);
    logger.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: `Failed to generate reports: ${error.message}`,
      error:
        process.env.NODE_ENV === "development"
          ? error.stack
          : "Internal server error",
      errorCode: "REPORTS_GENERATION_ERROR",
    });
  }
});

// @desc    Get payment stats
// @route   GET /api/payments/stats
// @access  Admin
const getPaymentStats = asyncHandler(async (req, res) => {
  const totalRevenueAgg = await Payment.aggregate([
    { $match: { status: "paid" } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const topCourses = await Payment.aggregate([
    { $match: { status: "paid" } },
    {
      $group: {
        _id: "$course",
        revenue: { $sum: "$amount" },
        totalPayments: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  res.status(200).json({
    success: true,
    message: "Payment stats",
    data: {
      totalRevenue: totalRevenueAgg[0]?.totalRevenue || 0,
      totalPayments: totalRevenueAgg[0]?.count || 0,
      topCourses,
    },
  });
});

// Import additional utilities for new payment system
const { uploadToS3, deleteFromS3 } = require("../utils/aws");

/**
 * Calculate payment breakdown including admin fees
 */
const calculatePaymentBreakdown = async (originalAmount) => {
  const settings = await AdminSettings.getSettings();
  const { studentAdminFee, globalDeductionPercentage } =
    settings.paymentSettings;

  const adminFee = studentAdminFee || 0;
  const percentageDeduction =
    (originalAmount * (globalDeductionPercentage || 0)) / 100;
  const totalAdminDeduction = adminFee + percentageDeduction;
  const instructorAmount = Math.max(0, originalAmount - totalAdminDeduction);

  return {
    originalAmount,
    adminFee,
    adminPercentage: globalDeductionPercentage || 0,
    instructorAmount,
    totalAdminDeduction,
  };
};

/**
 * @desc    Get payment breakdown for a course
 * @route   GET /api/payments/breakdown/:courseId
 * @access  Private
 */
const getPaymentBreakdown = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Calculate breakdown
    const breakdown = await calculatePaymentBreakdown(course.price);

    res.status(200).json({
      success: true,
      message: "Payment breakdown calculated successfully",
      data: {
        course: {
          id: course._id,
          title: course.title,
          price: course.price,
        },
        breakdown,
      },
    });
  } catch (error) {
    logger.error("Error calculating payment breakdown:", error);
    res.status(500).json({
      success: false,
      message: "Error calculating payment breakdown",
      error: error.message,
    });
  }
});

/**
 * Auto-enroll student after successful payment
 */
const autoEnrollStudent = async (studentId, courseId, paymentId) => {
  try {
    // Check if already enrolled
    const course = await Course.findById(courseId);
    if (course.enrolledStudents.includes(studentId)) {
      return { success: true, message: "Already enrolled" };
    }

    // Add to course
    course.enrolledStudents.push(studentId);
    course.students += 1;
    await course.save();

    // Add to user
    const user = await User.findById(studentId);
    user.enrolledCourses.push(courseId);
    await user.save();

    return { success: true, message: "Auto-enrolled successfully" };
  } catch (error) {
    logger.error("Auto-enrollment error:", error);
    return { success: false, message: "Auto-enrollment failed" };
  }
};

// @desc    Initiate payment for a course
// @route   POST /api/payments/initiate
// @access  Private
const initiatePayment = asyncHandler(async (req, res) => {
  // Sanitize inputs
  const courseId = sanitizeObjectId(req.body.courseId);
  const method = sanitizeText(req.body.method || "direct_transfer", 20);

  if (!courseId) {
    res.status(400);
    throw new Error("Course ID is required");
  }

  // Get course details from database (never trust client)
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  // Calculate amount server-side (never trust client)
  const amount = course.isFree ? 0 : course.finalPrice;

  if (amount <= 0 && !course.isFree) {
    res.status(400);
    throw new Error("Invalid course price");
  }

  // Get admin settings for fee calculation
  let adminSettings;
  try {
    adminSettings = await AdminSettings.getSettings();
  } catch (settingsError) {
    logger.error("Failed to get admin settings:", settingsError);
    // Use default values if admin settings fail
    adminSettings = {
      paymentSettings: {
        studentAdminFee: 0,
        globalDeductionPercentage: 0,
        currency: "usd",
      },
    };
  }

  const adminFee = adminSettings.paymentSettings?.studentAdminFee || 0;
  const adminPercentage =
    adminSettings.paymentSettings?.globalDeductionPercentage || 0;

  const totalAmount = amount + adminFee;
  const adminFeeTotal = adminFee + (amount * adminPercentage) / 100;
  const instructorAmount = amount - (amount * adminPercentage) / 100;

  // Guard: card/PayPal/gift-card course payments are no longer available
  const unavailableMethods = new Set(["stripe", "paypal", "card", "gift_card"]);
  if (unavailableMethods.has(method)) {
    const msg =
      method === "gift_card"
        ? "Gift card payment is not available. Please contact your instructor."
        : "Card/PayPal payment is not available. Please contact your instructor.";
    res.status(410);
    throw new Error(msg);
  }


  try {
    // Create payment record first
    const payment = await Payment.create({
      userId: req.user._id, // FIXED: Use userId instead of student
      course: courseId,
      amount: totalAmount,
      finalAmount: totalAmount, // FIXED: Add required finalAmount field
      originalAmount: amount,
      adminFee: adminFeeTotal,
      adminPercentage,
      instructorAmount,
      method: method || "direct_transfer",
      status: "pending",
    });

    if (method === "direct" || method === "direct_transfer") {
      // For direct transfer, the student pays the Admin (unified flow)
      const adminUser = await User.findOne({ role: "admin" });
      if (!adminUser) {
        res.status(404);
        throw new Error("Admin user not found");
      }

      // Return admin bank details for transfer
      res.status(200).json({
        success: true,
        message: "Direct transfer payment initiated (pay to Admin)",
        data: {
          paymentId: payment._id,
          amount: totalAmount,
          bankDetails: {
            bankName:
              adminUser.paymentDetails?.bankDetails?.bankName ||
              "Bank Name Not Provided",
            accountNumber:
              adminUser.paymentDetails?.bankDetails?.accountNumber ||
              "Account Number Not Provided",
            accountHolder: adminUser.name || "Platform Admin",
            swift:
              adminUser.paymentDetails?.bankDetails?.swift ||
              "SWIFT Code Not Provided",
            iban:
              adminUser.paymentDetails?.bankDetails?.iban ||
              "IBAN Not Provided",
          },
          adminDetails: {
            name: adminUser.name,
            email: adminUser.email,
          },
        },
      });
    } else {
      res.status(400);
      throw new Error("Invalid payment method");
    }
  } catch (error) {
    logger.error("Payment initiation error:", error);
    res.status(500);
    throw new Error("Failed to initiate payment");
  }
});

// @desc    Confirm Stripe payment
// @route   POST /api/payments/stripe/confirm
// @access  Private
const confirmStripePayment = asyncHandler(async (req, res) => {
  // Sanitize input
  const paymentIntentId = sanitizeText(req.body.paymentIntentId, 100);

  if (!paymentIntentId) {
    res.status(400);
    throw new Error("Payment Intent ID is required");
  }

  try {
    if (!stripe) {
      res.status(503);
      throw new Error("Stripe payment service is not configured");
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Find payment record
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
    })
      .populate("course", "title")
      .populate("userId", "name email");

    if (!payment) {
      res.status(404);
      throw new Error("Payment record not found");
    }

    if (paymentIntent.status === "succeeded") {
      // Update payment status and gateway response
      payment.status = "paid";
      payment.paidAt = new Date();
      payment.paymentGatewayResponse = { stripePaymentIntent: paymentIntent };
      await payment.save();

      // Authoritative finalization path
      await payment.completePayment();

      // Update user bill (legacy support)
      const user = await User.findById(payment.userId._id);
      if (payment.course) {
        const bill = user.bills.find((b) =>
          b.description.includes(payment.course.title)
        );
        if (bill) {
          bill.status = "paid";
          bill.paidAt = new Date();
          bill.paymentId = payment._id;
          await user.save();
        }
      }

      // Auto-enroll student if this is a course payment
      let enrollmentResult = null;
      if (payment.course) {
        enrollmentResult = await autoEnrollStudent(
          payment.userId._id,
          payment.course._id,
          payment._id
        );
      }

      res.status(200).json({
        success: true,
        message: payment.course
          ? "Payment confirmed and student enrolled successfully"
          : "Credit payment confirmed successfully",
        data: {
          payment,
          enrollment: enrollmentResult,
          billing: { finalizedBy: "completePayment" },
        },
      });
    } else {
      // Payment failed
      payment.status = "failed";
      payment.failureReason = `Stripe payment status: ${paymentIntent.status}`;
      await payment.save();

      res.status(400).json({
        success: false,
        message: "Payment was not successful",
        data: { status: paymentIntent.status },
      });
    }
  } catch (error) {
    logger.error("Stripe confirmation error:", error);
    res.status(500);
    throw new Error("Failed to confirm Stripe payment");
  }
});

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
const approveDirectTransferPayment = asyncHandler(async (req, res) => {
  // Sanitize inputs
  const id = sanitizeObjectId(req.params.id);
  const { action, adminNotes } = req.body;

  // Support both old and new API formats
  const approved = action === "approve" || Boolean(req.body.approved);
  const adminNote = sanitizeText(adminNotes || req.body.adminNote, 500);

  logger.info("🔍 Course payment approval request:", {
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

      logger.info("💳 Saving payment with status:", payment.status);
      await payment.save();
      logger.info("✅ Payment saved successfully");

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
        logger.error("❌ completePayment error:", error);
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
    logger.error("❌ Payment approval error:", error);
    logger.error("❌ Error stack:", error.stack);
    logger.error("❌ Error message:", error.message);
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
const confirmPayPalPayment = asyncHandler(async (req, res) => {
  // Inputs: prefer orderId; paymentId optional for backward compatibility
  const orderId = sanitizeText(req.body.orderId, 50);
  const paymentIdOptional = req.body.paymentId
    ? sanitizeObjectId(req.body.paymentId)
    : null;

  if (!orderId) {
    res.status(400);
    throw new Error("Order ID is required");
  }

  // Load PayPal order state first
  let order;
  try {
    const getReq = new paypal.orders.OrdersGetRequest(orderId);
    order = await paypalClient.execute(getReq);
  } catch (err) {
    logger.error("PayPal OrdersGetRequest failed:", err?.result || err);
    res.status(404);
    throw new Error("PayPal order not found");
  }

  const orderStatus = order?.result?.status;
  const purchaseUnit = order?.result?.purchase_units?.[0];
  const existingCaptureId = purchaseUnit?.payments?.captures?.[0]?.id;

  // Find our payment document by paypalOrderId (preferred) or provided paymentId
  let payment = null;
  if (paymentIdOptional) {
    payment = await Payment.findById(paymentIdOptional)
      .populate("userId", "name email")
      .populate("course", "title price");
  }
  if (!payment) {
    payment = await Payment.findOne({ paypalOrderId: orderId })
      .populate("userId", "name email")
      .populate("course", "title price");
  }
  if (!payment) {
    res.status(404);
    throw new Error("Local payment record not found");
  }
  if (payment.userId._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Unauthorized to confirm this payment");
  }

  // Idempotent: if already paid, return success
  if (payment.status === "paid") {
    return res.status(200).json({
      success: true,
      message: "PayPal payment already confirmed",
      data: { payment, enrolled: true },
    });
  }

  // If order already COMPLETED, skip capture and finalize locally
  if (orderStatus === "COMPLETED") {
    payment.status = "paid";
    payment.paidAt = new Date();
    if (existingCaptureId) payment.paypalPaymentId = existingCaptureId;
    payment.paymentGatewayResponse = order.result;
    await payment.save();

    // Authoritative finalization
    await payment.completePayment();

    // Auto-enroll after completion
    let enrollmentResult = null;
    if (payment.course) {
      enrollmentResult = await autoEnrollStudent(
        payment.userId._id || payment.userId,
        payment.course._id || payment.course,
        payment._id
      );
    }

    return res.status(200).json({
      success: true,
      message: "PayPal order already completed; confirmed locally",
      data: { payment, finalizedBy: "completePayment", enrollment: enrollmentResult },
    });
  }

  // Only APPROVED orders can be captured
  if (orderStatus !== "APPROVED") {
    res.status(409);
    throw new Error(`Order is not in APPROVED state (current: ${orderStatus})`);
  }

  // Capture now
  try {
    const capReq = new paypal.orders.OrdersCaptureRequest(orderId);
    capReq.requestBody({});
    const capture = await paypalClient.execute(capReq);

    const capStatus = capture?.result?.status;
    const captureId =
      capture?.result?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const payerId = capture?.result?.payer?.payer_id;

    if (capStatus === "COMPLETED") {
      // Update local payment
      payment.status = "paid";
      payment.paidAt = new Date();
      if (captureId) payment.paypalPaymentId = captureId;
      if (payerId) payment.paypalPayerId = payerId;
      payment.paymentGatewayResponse = capture.result;
      await payment.save();

      // Authoritative finalization
      await payment.completePayment();

      // Auto-enroll after completion
      let enrollmentResult = null;
      if (payment.course) {
        enrollmentResult = await autoEnrollStudent(
          payment.userId._id || payment.userId,
          payment.course._id || payment.course,
          payment._id
        );
      }

      return res.status(200).json({
        success: true,
        message: "PayPal payment confirmed successfully",
        data: { payment, finalizedBy: "completePayment", enrollment: enrollmentResult },
      });
    }

    // Pending states (e.g., PENDING, PENDING_REVIEW)
    if (
      capStatus === "PENDING" ||
      capStatus === "PENDING_REVIEW" ||
      capStatus === "PAYER_ACTION_REQUIRED"
    ) {
      payment.status = "pending";
      payment.failureReason = undefined;
      payment.paymentGatewayResponse = capture.result;
      await payment.save();
      return res.status(202).json({
        success: true,
        message: `PayPal capture pending (${capStatus}). We will finalize once PayPal completes the review.`,
        data: { payment, pending: true },
      });
    }

    // Any other status treated as failure
    payment.status = "failed";
    payment.failureReason = `PayPal capture failed: ${capStatus}`;
    payment.paymentGatewayResponse = capture.result;
    await payment.save();
    return res.status(400).json({
      success: false,
      message: `PayPal capture failed with status: ${capStatus}`,
      data: { status: capStatus },
    });
  } catch (err) {
    // Deduplicate captures: if order is now COMPLETED, treat as success
    if (err?.statusCode === 422) {
      try {
        const getReq2 = new paypal.orders.OrdersGetRequest(orderId);
        const order2 = await paypalClient.execute(getReq2);
        if (order2?.result?.status === "COMPLETED") {
          const captureId2 =
            order2?.result?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
          payment.status = "paid";
          payment.paidAt = new Date();
          if (captureId2) payment.paypalPaymentId = captureId2;
          payment.paymentGatewayResponse = order2.result;
          await payment.save();
          await payment.completePayment();
          // Auto-enroll after completion
          let enrollmentResult = null;
          if (payment.course) {
            enrollmentResult = await autoEnrollStudent(
              payment.userId._id || payment.userId,
              payment.course._id || payment.course,
              payment._id
            );
          }
          return res.status(200).json({
            success: true,
            message: "PayPal order already captured; confirmed locally",
            data: { payment, finalizedBy: "completePayment", enrollment: enrollmentResult },
          });
        }
      } catch (_) {}
    }
    logger.error("PayPal capture error:", err?.result || err);
    res.status(500);
    throw new Error("Failed to confirm PayPal payment");
  }
});

/**
 * Finalize enrollment and update user bills idempotently
 */
const finalizeEnrollmentAndBills = async (payment) => {
  // Auto-enroll student in course if this is a course payment
  if (payment.course) {
    const course = await Course.findById(payment.course._id || payment.course);
    if (course && !course.enrolledStudents.includes(payment.userId)) {
      course.enrolledStudents.push(payment.userId); // FIXED: Use userId
      await course.save();
    }

    // Create enrollment request with automatic approval for card/PayPal payments
    const existingEnrollmentRequest = await EnrollmentRequest.findOne({
      student: payment.userId, // FIXED: Use userId from payment
      course: payment.course._id || payment.course,
    });

    if (!existingEnrollmentRequest) {
      await EnrollmentRequest.create({
        student: payment.userId, // FIXED: Use userId from payment
        course: payment.course._id || payment.course,
        status: "approved",
        paymentMethod:
          payment.method === "stripe"
            ? "stripe"
            : payment.method === "paypal"
            ? "paypal"
            : "direct_transfer",
        approvedBy: {
          role: "automatic",
          approvedAt: new Date(),
        },
      });
    } else if (existingEnrollmentRequest.status === "pending") {
      // Update existing pending request to approved with automatic approval
      existingEnrollmentRequest.status = "approved";
      existingEnrollmentRequest.paymentMethod =
        payment.method === "stripe"
          ? "stripe"
          : payment.method === "paypal"
          ? "paypal"
          : "direct_transfer";
      existingEnrollmentRequest.approvedBy = {
        role: "automatic",
        approvedAt: new Date(),
      };
      await existingEnrollmentRequest.save();
    }

    // Create billing transaction for course payment (match direct transaction logic)
    try {
      if (course.instructor) {
        // Get admin settings for profit calculation
        let adminSettings = await AdminSettings.findOne();
        if (!adminSettings) {
          // Create default settings if none exist
          adminSettings = await AdminSettings.create({
            paymentSettings: {
              globalDeductionPercentage: 10, // 10% default
              studentAdminFee: 2, // $2 default admin fee
            },
          });
        }

        const originalAmount =
          payment.finalAmount || payment.originalAmount || payment.amount;
        const finalAmount = originalAmount;
        const adminFee = adminSettings.paymentSettings.studentAdminFee || 2;
        const adminPercentage =
          adminSettings.paymentSettings.globalDeductionPercentage || 10;
        const totalAdminProfit =
          adminFee + (originalAmount * adminPercentage) / 100;
        const instructorAmount = originalAmount - totalAdminProfit;

        await createBillingTransactionForCoursePayment({
          studentId: payment.userId._id || payment.userId,
          courseId: payment.course._id || payment.course,
          instructorId: course.instructor,
          originalAmount: originalAmount,
          finalAmount: finalAmount,
          adminFee: adminFee,
          adminPercentage: adminPercentage,
          instructorAmount: instructorAmount,
          paymentId: payment._id,
          method: payment.method,
        });
        logger.info(
          `✅ Billing transaction created for ${payment.method} payment: ${payment._id}`
        );
        logger.info(
          `💰 Payment breakdown: Total: $${originalAmount}, Admin: $${totalAdminProfit.toFixed(
            2
          )}, Instructor: $${instructorAmount.toFixed(2)}`
        );
      }
    } catch (billingError) {
      logger.error("❌ Error creating billing transaction:", billingError);
      // Don't fail the enrollment if billing fails, but log it
    }

    // Update user's bills: mark existing bill (if any) as paid; avoid duplicates
    const user = await User.findById(payment.userId._id || payment.userId);
    if (user) {
      const existingBill = user.bills.find(
        (b) => b.paymentId && b.paymentId.toString() === payment._id.toString()
      );

      if (existingBill) {
        existingBill.status = "paid";
        existingBill.paidAt = payment.paidAt || new Date();
      } else {
        user.bills.push({
          description: `Course enrollment: ${course?.title || ""}`,
          amount: payment.amount,
          status: "paid",
          paidAt: payment.paidAt || new Date(),
          paymentMethod: payment.method,
          paymentId: payment._id,
          courseId: course._id,
          instructorId: course.instructor,
          billType: "course_payment",
        });
      }
      await user.save();
    }
  } else if (payment.type === "credit_addition") {
    // Handle credit addition payments
    await addCreditsToUser(
      payment.userId,
      payment.amount,
      payment._id,
      payment.method
    );
  }
};

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
const getUserPayments = asyncHandler(async (req, res) => {
  logger.info("🔍 getUserPayments called for user:", req.user._id);

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

  logger.info("📊 Found payments:", payments.length);

  // Debug: Log payment details to see what fields are available
  payments.forEach((payment) => {
    logger.info("💳 Payment debug:", {
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

  // 📧 SIMPLE NOTIFICATION: Notify student about payment approval
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
const initiateCreditPayment = asyncHandler(async (req, res) => {
  // Sanitize inputs
  const amount = sanitizeNumber(req.body.amount, { min: 1, max: 10000 });
  const method = sanitizeText(req.body.method || "direct_transfer", 20);

  if (!amount) {
    res.status(400);
    throw new Error("Valid amount is required");
  }

  // Get admin settings for fee calculation
  let adminSettings;
  try {
    adminSettings = await AdminSettings.getSettings();
  } catch (settingsError) {
    logger.error("Failed to get admin settings:", settingsError);
    adminSettings = {
      paymentSettings: {
        currency: "usd",
      },
    };
  }

  // Guard: card/PayPal credit payments are no longer available
  const unavailableCreditMethods = new Set(["stripe", "paypal", "card", "gift_card"]);
  if (unavailableCreditMethods.has(method)) {
    res.status(410);
    throw new Error("Card/PayPal payment is not available. Please contact your instructor.");
  }


  try {
    // Create payment record for credit addition
    const payment = await Payment.create({
      userId: req.user._id, // FIXED: Use userId instead of student
      course: null, // No course for credit payments
      amount: amount,
      finalAmount: amount, // FIXED: Add required finalAmount field
      originalAmount: amount,
      adminFee: 0, // No admin fee for credit additions
      adminPercentage: 0,
      instructorAmount: 0,
      method: method || "direct_transfer",
      status: "pending",
      type: "credit_addition",
    });

    if (method === "direct" || method === "direct_transfer") {
      // For direct transfer credit addition
      res.status(200).json({
        success: true,
        message: "Direct transfer credit payment initiated",
        data: {
          paymentId: payment._id,
          amount: amount,
          bankDetails: {
            bankName: "Mentora Bank",
            accountNumber: "1234567890",
            accountHolder: "Mentora Education Platform",
            swift: "LTRKUS33",
            iban: "US12LTRK1234567890123456",
          },
          instructions: [
            "Transfer the exact amount to the bank account above",
            "Include your name and email in the transfer reference",
            "Upload the transfer receipt for verification",
            "Credits will be added after admin approval",
          ],
        },
      });
    } else {
      res.status(400);
      throw new Error("Invalid payment method");
    }
  } catch (error) {
    logger.error("Credit payment initiation error:", error);
    res.status(500);
    throw new Error("Failed to initiate credit payment");
  }
});

// @desc    Get user billing summary
// @route   GET /api/payments/billing-summary
// @access  Private
const getUserBillingSummary = asyncHandler(async (req, res) => {
  try {
    const { getUserBillingSummary } = require("../utils/billingUtils");
    const billingSummary = await getUserBillingSummary(req.user._id);

    res.status(200).json({
      success: true,
      message: "Billing summary retrieved successfully",
      data: billingSummary,
    });
  } catch (error) {
    logger.error("Error getting billing summary:", error);
    res.status(500);
    throw new Error("Failed to get billing summary");
  }
});

// @desc    Process annual fees (Admin only)
// @route   POST /api/payments/process-annual-fees
// @access  Private/Admin
const processAnnualFeesEndpoint = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      res.status(403);
      throw new Error("Access denied. Admin only.");
    }

    const { processAnnualFees } = require("../utils/billingUtils");
    const results = await processAnnualFees();

    res.status(200).json({
      success: true,
      message: "Annual fees processed successfully",
      data: {
        processed: results.length,
        results: results,
      },
    });
  } catch (error) {
    logger.error("Error processing annual fees:", error);
    res.status(500);
    throw new Error("Failed to process annual fees");
  }
});

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
const checkStripePaymentStatus = asyncHandler(async (req, res) => {
  logger.info("🔍 Manual Stripe payment status check requested");
  logger.info("🆔 Payment ID:", req.params.id);
  logger.info("👤 User:", req.user._id, req.user.role);

  try {
    // Find the payment
    const payment = await Payment.findById(req.params.id)
      .populate("userId", "name email role enrolledCourses")
      .populate("course", "title instructor enrolledStudents");

    if (!payment) {
      logger.error("❌ Payment not found:", req.params.id);
      res.status(404);
      throw new Error("Payment not found");
    }

    // Check authorization
    if (
      payment.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      logger.error("❌ Access denied for payment:", req.params.id);
      res.status(403);
      throw new Error("Access denied");
    }

    logger.info("💾 Payment found:", {
      id: payment._id,
      status: payment.status,
      method: payment.method,
      stripePaymentIntentId: payment.stripePaymentIntentId,
    });

    // Only process Stripe payments
    if (payment.method !== "stripe") {
      logger.error("❌ Not a Stripe payment:", payment.method);
      res.status(400);
      throw new Error("This endpoint only handles Stripe payments");
    }

    // Check if payment is already processed
    if (payment.status === "paid") {
      logger.info("✅ Payment already processed");
      return res.status(200).json({
        success: true,
        message: "Payment already processed",
        data: {
          paymentId: payment._id,
          status: payment.status,
          paidAt: payment.paidAt,
        },
      });
    }

    // Check if we have a Stripe payment intent ID
    if (!payment.stripePaymentIntentId) {
      logger.error("❌ No Stripe payment intent ID found");
      res.status(400);
      throw new Error("No Stripe payment intent ID found");
    }

    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error("❌ Stripe not configured");
      res.status(503);
      throw new Error("Stripe service not configured");
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    // Query Stripe directly for payment status
    logger.info(
      "🔍 Querying Stripe for payment intent:",
      payment.stripePaymentIntentId
    );
    const paymentIntent = await stripe.paymentIntents.retrieve(
      payment.stripePaymentIntentId
    );

    logger.info("📊 Stripe payment intent status:", paymentIntent.status);
    logger.info("💰 Stripe payment intent amount:", paymentIntent.amount);

    if (paymentIntent.status === "succeeded") {
      logger.info("✅ Payment succeeded in Stripe, processing...");

      // Update payment status
      payment.status = "paid";
      payment.paidAt = new Date();
      payment.paymentGatewayResponse = {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method,
        status: paymentIntent.status,
      };

      await payment.save();
      logger.info("✅ Payment status updated to paid");

      // Auto-enroll student
      logger.info("🎓 Starting auto-enrollment");
      const course = payment.course;
      const student = payment.userId;

      if (course && student) {
        // Check if student is already enrolled
        const alreadyEnrolled = course.enrolledStudents.includes(student._id);

        if (!alreadyEnrolled) {
          logger.info("➕ Enrolling student in course");
          course.enrolledStudents.push(student._id);
          await course.save();

          // Add course to student's enrolled courses
          if (!student.enrolledCourses.includes(course._id)) {
            student.enrolledCourses.push(course._id);
            await student.save();
          }
          logger.info("✅ Student enrolled successfully");
        } else {
          logger.info("⚠️ Student already enrolled");
        }

        // Create billing transaction
        logger.info("💰 Creating billing transaction");
        try {
          const {
            createBillingTransactionForCoursePayment,
          } = require("../utils/billingUtils");

          // Get admin settings for fee calculation
          let adminSettings = await AdminSettings.findOne();
          if (!adminSettings) {
            adminSettings = await AdminSettings.create({
              paymentSettings: {
                globalDeductionPercentage: 10,
                studentAdminFee: 2,
              },
            });
          }

          const originalAmount = payment.finalAmount || payment.amount;
          const adminFee = adminSettings.paymentSettings.studentAdminFee || 2;
          const adminPercentage =
            adminSettings.paymentSettings.globalDeductionPercentage || 10;
          const totalAdminProfit =
            adminFee + (originalAmount * adminPercentage) / 100;
          const instructorAmount = originalAmount - totalAdminProfit;

          await createBillingTransactionForCoursePayment({
            studentId: student._id,
            courseId: course._id,
            instructorId: course.instructor,
            originalAmount: originalAmount,
            finalAmount: originalAmount,
            adminFee: adminFee,
            adminPercentage: adminPercentage,
            instructorAmount: instructorAmount,
            paymentId: payment._id,
            method: "stripe",
          });

          logger.info("✅ Billing transaction created successfully");
        } catch (billingError) {
          logger.error("❌ Error creating billing transaction:", billingError);
          // Don't fail the whole process if billing fails
        }
      }

      res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: {
          paymentId: payment._id,
          status: payment.status,
          paidAt: payment.paidAt,
          enrolled: true,
        },
      });
    } else if (
      paymentIntent.status === "requires_payment_method" ||
      paymentIntent.status === "requires_confirmation"
    ) {
      logger.info("⚠️ Payment still pending in Stripe");
      res.status(200).json({
        success: true,
        message: "Payment still pending",
        data: {
          paymentId: payment._id,
          status: "pending",
          stripeStatus: paymentIntent.status,
        },
      });
    } else if (paymentIntent.status === "canceled") {
      logger.info("❌ Payment was canceled in Stripe");
      payment.status = "failed";
      payment.failureReason = "Payment was canceled";
      await payment.save();

      res.status(200).json({
        success: true,
        message: "Payment was canceled",
        data: {
          paymentId: payment._id,
          status: "failed",
          reason: "Payment was canceled",
        },
      });
    } else {
      logger.info("❓ Unknown payment status:", paymentIntent.status);
      res.status(200).json({
        success: true,
        message: "Payment status unknown",
        data: {
          paymentId: payment._id,
          status: payment.status,
          stripeStatus: paymentIntent.status,
        },
      });
    }
  } catch (error) {
    logger.error("❌ Error checking Stripe payment status:", error);
    res.status(500);
    throw new Error("Failed to check payment status: " + error.message);
  }
});

// @desc    Get recent pending Stripe payments for debugging
// @route   GET /api/payments/debug/pending-stripe
// @access  Private (Admin only)
const getPendingStripePayments = asyncHandler(async (req, res) => {
  logger.info("🔍 Getting pending Stripe payments for debugging");

  try {
    // Find recent pending Stripe payments
    const pendingPayments = await Payment.find({
      method: "stripe",
      status: "pending",
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
    })
      .populate("userId", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .limit(10);

    logger.info(`📊 Found ${pendingPayments.length} pending Stripe payments`);

    const paymentData = pendingPayments.map((payment) => ({
      id: payment._id,
      amount: payment.amount,
      finalAmount: payment.finalAmount,
      status: payment.status,
      method: payment.method,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      stripeSessionId: payment.stripeSessionId,
      student: payment.userId ? payment.userId.name : "Unknown",
      studentEmail: payment.userId ? payment.userId.email : "Unknown",
      course: payment.course ? payment.course.title : "Unknown",
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: pendingPayments.length,
      data: paymentData,
    });
  } catch (error) {
    logger.error("❌ Error getting pending Stripe payments:", error);
    res.status(500);
    throw new Error("Failed to get pending payments: " + error.message);
  }
});

// @desc    Get payment receipt (only for direct transfer payments - Admin/Instructor only)
// @route   GET /api/payments/:id/receipt
// @access  Private (Admin or Instructor only - Students can only view, not download)
const getPaymentReceipt = asyncHandler(async (req, res) => {
  logger.info("📄 Payment receipt requested for:", req.params.id);

  try {
    // Find the payment
    const payment = await Payment.findById(req.params.id)
      .populate("userId", "name email")
      .populate("course", "title instructor");

    if (!payment) {
      logger.error("❌ Payment not found:", req.params.id);
      res.status(404);
      throw new Error("Payment not found");
    }

    // Restrict download access - only admins and instructors can download receipts
    // Students can view payment details but cannot download receipts
    if (req.user.role === "student") {
      logger.error("❌ Students cannot download receipts:", req.params.id);
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
          "❌ Instructor can only access receipts for their own courses:",
          req.params.id
        );
        res.status(403);
        throw new Error(
          "Access denied. You can only access receipts for payments related to your courses."
        );
      }
    } else {
      logger.error("❌ Access denied for payment receipt:", req.params.id);
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
    logger.info("🔍 Payment receipt fields debug:", {
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
    const { getSignedUrl } = require("../utils/aws");

    let signedUrl;
    if (receiptS3Key) {
      // Generate signed URL for S3 file
      signedUrl = await getSignedUrl(receiptS3Key, 3600); // 1 hour expiry
    } else if (receiptUrl) {
      // Use existing receipt URL
      signedUrl = receiptUrl;
    }

    logger.info("✅ Receipt URL generated for payment:", payment._id);

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
    logger.error("❌ Error generating payment receipt:", error);
    res.status(500);
    throw new Error("Failed to generate receipt: " + error.message);
  }
});

// @desc    Process admin fee payment from instructor
// @route   POST /api/payments/admin-fee-payment
// @access  Private/Instructor
const processAdminFeePayment = asyncHandler(async (req, res) => {
  try {
    const { amount, method, description, receiptFile } = req.body;
    const instructorId = req.user._id;

    logger.info("🔄 Processing admin fee payment:", {
      instructorId,
      amount,
      method,
      description,
    });

    // Validate instructor
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== "instructor") {
      res.status(403);
      throw new Error("Access denied. Instructor role required.");
    }

    // Get admin settings for fee validation
    const adminSettings = await AdminSettings.getSettings();
    const minAmount = 1; // Minimum $1
    const maxAmount = 10000; // Maximum $10,000

    if (amount < minAmount || amount > maxAmount) {
      res.status(400);
      throw new Error(`Amount must be between $${minAmount} and $${maxAmount}`);
    }

    // Create payment record
    const payment = await Payment.create({
      userId: instructorId,
      amount: parseFloat(amount),
      finalAmount: parseFloat(amount),
      method: method,
      status: method === "direct_transfer" ? "pending_verification" : "pending",
      description: description || `Admin fee payment of $${amount}`,
      paymentType: "admin_fee_payment",
      metadata: {
        paymentType: "admin_fee_payment",
        instructorId: instructorId,
        originalAmount: parseFloat(amount),
        receiptUploaded: !!receiptFile,
      },
    });

    // Handle different payment methods
    let responseData = {
      success: true,
      payment,
      message: "Admin fee payment initiated successfully",
    };

    switch (method) {
      case "stripe":
        // Create Stripe payment intent
        if (!stripe) {
          res.status(500);
          throw new Error("Stripe is not configured");
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          currency: "usd",
          metadata: {
            paymentId: payment._id.toString(),
            paymentType: "admin_fee_payment",
            instructorId: instructorId.toString(),
          },
          description: `Admin fee payment - ${instructor.name}`,
        });

        responseData.clientSecret = paymentIntent.client_secret;
        responseData.paymentIntentId = paymentIntent.id;
        break;

      case "paypal":
        // PayPal will be handled by frontend redirect
        responseData.redirectUrl = `/api/payments/paypal/create-order`;
        break;

      case "direct_transfer":
        // Direct transfer requires receipt upload and admin verification
        payment.status = "pending_verification";
        payment.metadata.requiresReceipt = true;
        await payment.save();

        responseData.message =
          "Direct transfer payment created. Please upload receipt for verification.";
        responseData.requiresReceipt = true;
        break;

      default:
        res.status(400);
        throw new Error("Invalid payment method");
    }

    logger.info("✅ Admin fee payment created:", payment._id);

    res.status(201).json(responseData);
  } catch (error) {
    logger.error("❌ Error processing admin fee payment:", error);
    res.status(500);
    throw new Error("Failed to process admin fee payment: " + error.message);
  }
});

// @desc    Upload receipt for admin fee payment
// @route   POST /api/payments/admin-fee-payment/:paymentId/receipt
// @access  Private/Instructor
const uploadAdminFeeReceipt = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;
    const instructorId = req.user._id;

    // Find payment
    const payment = await Payment.findOne({
      _id: paymentId,
      userId: instructorId,
      paymentType: "admin_fee_payment",
    });

    if (!payment) {
      res.status(404);
      throw new Error("Admin fee payment not found");
    }

    if (payment.status !== "pending_verification") {
      res.status(400);
      throw new Error("Payment is not pending verification");
    }

    // Handle file upload (receipt)
    if (!req.file) {
      res.status(400);
      throw new Error("Receipt file is required");
    }

    // Store receipt information
    payment.receiptUrl = req.file.path || req.file.filename;
    payment.metadata = {
      ...payment.metadata,
      receiptUploaded: true,
      receiptOriginalName: req.file.originalname,
      receiptSize: req.file.size,
      uploadedAt: new Date(),
    };

    payment.status = "pending_admin_approval";
    await payment.save();

    logger.info("✅ Receipt uploaded for admin fee payment:", paymentId);

    res.status(200).json({
      success: true,
      message:
        "Receipt uploaded successfully. Payment is now pending admin approval.",
      payment,
    });
  } catch (error) {
    logger.error("❌ Error uploading admin fee receipt:", error);
    res.status(500);
    throw new Error("Failed to upload receipt: " + error.message);
  }
});

module.exports = {
  createPayment,
  getStudentPayments,
  deletePayment,
  updatePayment,
  getPaymentStats,
  getPaymentReports,
  getPaymentBreakdown,
  initiatePayment,
  verifyPayment,
  confirmStripePayment,
  confirmPayPalPayment,
  handleDirectTransfer,
  approveDirectTransferPayment,
  getAllPayments,
  getUserPayments,
  getUserBills,
  getUserPaymentsAndBills,
  getPendingDirectTransfers,
  approveDirectTransfer,
  rejectDirectTransfer,
  submitDirectTransfer,
  getInstructorPendingTransfers,
  instructorApproveDirectTransfer,
  initiateCreditPayment,
  getUserBillingSummary,
  processAnnualFeesEndpoint,
  checkPaymentStatus,
  createCreditPaymentMiddleware,
  checkStripePaymentStatus,
  getPendingStripePayments,
  getPaymentReceipt,
  processAdminFeePayment,
  uploadAdminFeeReceipt,
};
