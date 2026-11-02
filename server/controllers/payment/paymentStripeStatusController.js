// Stripe payment status checks. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const AdminSettings = require("../../models/AdminSettings");
const { createBillingTransactionForCoursePayment, addCreditsToUser, checkAndUpdateAccountStatus, createCreditPaymentMiddleware } = require("../../utils/billingUtils");

// @desc    Check Stripe payment status directly and process if successful
// @route   POST /api/payments/:id/check-stripe-status
// @access  Private (User must own the payment or be admin)
const checkStripePaymentStatus = asyncHandler(async (req, res) => {
  logger.info("≡ƒöì Manual Stripe payment status check requested");
  logger.info("≡ƒåö Payment ID:", req.params.id);
  logger.info("≡ƒæñ User:", req.user._id, req.user.role);

  try {
    // Find the payment
    const payment = await Payment.findById(req.params.id)
      .populate("userId", "name email role enrolledCourses")
      .populate("course", "title instructor enrolledStudents");

    if (!payment) {
      logger.error("Γ¥î Payment not found:", req.params.id);
      res.status(404);
      throw new Error("Payment not found");
    }

    // Check authorization
    if (
      payment.userId._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      logger.error("Γ¥î Access denied for payment:", req.params.id);
      res.status(403);
      throw new Error("Access denied");
    }

    logger.info("≡ƒÆ╛ Payment found:", {
      id: payment._id,
      status: payment.status,
      method: payment.method,
      stripePaymentIntentId: payment.stripePaymentIntentId,
    });

    // Only process Stripe payments
    if (payment.method !== "stripe") {
      logger.error("Γ¥î Not a Stripe payment:", payment.method);
      res.status(400);
      throw new Error("This endpoint only handles Stripe payments");
    }

    // Check if payment is already processed
    if (payment.status === "paid") {
      logger.info("Γ£à Payment already processed");
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
      logger.error("Γ¥î No Stripe payment intent ID found");
      res.status(400);
      throw new Error("No Stripe payment intent ID found");
    }

    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error("Γ¥î Stripe not configured");
      res.status(503);
      throw new Error("Stripe service not configured");
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    // Query Stripe directly for payment status
    logger.info(
      "≡ƒöì Querying Stripe for payment intent:",
      payment.stripePaymentIntentId
    );
    const paymentIntent = await stripe.paymentIntents.retrieve(
      payment.stripePaymentIntentId
    );

    logger.info("≡ƒôè Stripe payment intent status:", paymentIntent.status);
    logger.info("≡ƒÆ░ Stripe payment intent amount:", paymentIntent.amount);

    if (paymentIntent.status === "succeeded") {
      logger.info("Γ£à Payment succeeded in Stripe, processing...");

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
      logger.info("Γ£à Payment status updated to paid");

      // Auto-enroll student
      logger.info("≡ƒÄô Starting auto-enrollment");
      const course = payment.course;
      const student = payment.userId;

      if (course && student) {
        // Check if student is already enrolled
        const alreadyEnrolled = course.enrolledStudents.includes(student._id);

        if (!alreadyEnrolled) {
          logger.info("Γ₧ò Enrolling student in course");
          course.enrolledStudents.push(student._id);
          await course.save();

          // Add course to student's enrolled courses
          if (!student.enrolledCourses.includes(course._id)) {
            student.enrolledCourses.push(course._id);
            await student.save();
          }
          logger.info("Γ£à Student enrolled successfully");
        } else {
          logger.info("ΓÜá∩╕Å Student already enrolled");
        }

        // Create billing transaction
        logger.info("≡ƒÆ░ Creating billing transaction");
        try {
          const {
            createBillingTransactionForCoursePayment,
          } = require("../../utils/billingUtils");

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

          logger.info("Γ£à Billing transaction created successfully");
        } catch (billingError) {
          logger.error("Γ¥î Error creating billing transaction:", billingError);
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
      logger.info("ΓÜá∩╕Å Payment still pending in Stripe");
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
      logger.info("Γ¥î Payment was canceled in Stripe");
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
      logger.info("Γ¥ô Unknown payment status:", paymentIntent.status);
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
    logger.error("Γ¥î Error checking Stripe payment status:", error);
    res.status(500);
    throw new Error("Failed to check payment status: " + error.message);
  }
});

// @desc    Get recent pending Stripe payments for debugging
// @route   GET /api/payments/debug/pending-stripe
// @access  Private (Admin only)

// @desc    Get recent pending Stripe payments for debugging
// @route   GET /api/payments/debug/pending-stripe
// @access  Private (Admin only)
const getPendingStripePayments = asyncHandler(async (req, res) => {
  logger.info("≡ƒöì Getting pending Stripe payments for debugging");

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

    logger.info(`≡ƒôè Found ${pendingPayments.length} pending Stripe payments`);

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
    logger.error("Γ¥î Error getting pending Stripe payments:", error);
    res.status(500);
    throw new Error("Failed to get pending payments: " + error.message);
  }
});

// @desc    Get payment receipt (only for direct transfer payments - Admin/Instructor only)
// @route   GET /api/payments/:id/receipt
// @access  Private (Admin or Instructor only - Students can only view, not download)

module.exports = {
  checkStripePaymentStatus,
  getPendingStripePayments
};
