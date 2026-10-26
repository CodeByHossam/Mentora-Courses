const logger = require('../utils/logger');
/**
 * Webhook Controller
 *
 * Handles secure webhook processing for payment gateways.
 * This controller is separate from the main payment controller to ensure
 * proper security handling and raw body processing for signature verification.
 *
 * @author Mentora Team
 * @version 1.0.0
 */

// Initialize Stripe only if API key is available
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
}

const paypal = require("@paypal/checkout-server-sdk");
const Payment = require("../models/Payment");
const Course = require("../models/Course");
const User = require("../models/User");
const { sanitizeText, sanitizeObjectId } = require("../utils/sanitizer");

// Import billing utilities for commission tracking
const {
  createBillingTransactionForCoursePayment,
} = require("../utils/billingUtils");

// PayPal Environment Setup
const paypalEnvironment =
  process.env.PAYPAL_ENVIRONMENT === "live"
    ? new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      )
    : new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
      );

const paypalClient = new paypal.core.PayPalHttpClient(paypalEnvironment);
const asyncHandler = require("express-async-handler");

/**
 * Validate if IP address is from Stripe's webhook endpoints
 * In production, you should maintain an updated list of Stripe's IP ranges
 */
const isValidStripeIP = (ip) => {
  // For development, allow localhost and private IPs
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  // Stripe's webhook IP ranges (update these regularly)
  const stripeIPRanges = [
    "3.18.12.63",
    "3.130.192.231",
    "13.235.14.237",
    "13.235.122.149",
    "18.211.135.69",
    "35.154.171.200",
    "52.15.183.38",
    "54.187.174.169",
    "54.187.205.235",
    "54.187.216.72",
  ];

  return stripeIPRanges.includes(ip);
};

/**
 * Validate PayPal webhook signature (basic implementation)
 */
const validatePayPalWebhook = (headers, body) => {
  // In production, implement proper PayPal webhook signature verification
  // This is a simplified version for demonstration
  const paypalSignature = headers["paypal-transmission-sig"];
  const paypalCertId = headers["paypal-cert-id"];
  const paypalTransmissionId = headers["paypal-transmission-id"];
  const paypalTransmissionTime = headers["paypal-transmission-time"];

  return !!(
    paypalSignature &&
    paypalCertId &&
    paypalTransmissionId &&
    paypalTransmissionTime
  );
};

// @desc    Handle Stripe webhooks
// @route   POST /api/webhooks/stripe
// @access  Public (but verified via signature)
const handleStripeWebhook = asyncHandler(async (req, res) => {
  logger.info("🔔 Stripe webhook received!");
  logger.info("📋 Headers:", JSON.stringify(req.headers, null, 2));
  logger.info("📦 Body length:", req.body ? req.body.length : "No body");
  logger.info("🌐 Original URL:", req.originalUrl);

  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Enhanced security validation
  if (!endpointSecret) {
    logger.error("❌ Stripe webhook secret not configured");
    logger.error(
      "❌ STRIPE_WEBHOOK_SECRET env var:",
      process.env.STRIPE_WEBHOOK_SECRET ? "SET" : "NOT SET"
    );
    return res.status(400).send("Webhook secret not configured");
  }

  if (!sig) {
    logger.error("❌ Missing Stripe signature header");
    logger.error("❌ Available headers:", Object.keys(req.headers));
    return res.status(400).send("Missing signature header");
  }

  logger.info("✅ Webhook secret configured");
  logger.info("✅ Signature header present:", sig.substring(0, 20) + "...");
  logger.info(
    "🔑 Expected webhook secret (first 20 chars):",
    endpointSecret.substring(0, 20) + "..."
  );

  // Rate limiting check for webhooks (basic IP-based)
  const clientIP = req.ip || req.connection.remoteAddress;
  logger.info("🌐 Webhook request from IP:", clientIP);

  // Skip IP validation in development
  if (process.env.NODE_ENV === "production" && !isValidStripeIP(clientIP)) {
    logger.error("Webhook request from invalid IP:", clientIP);
    return res.status(403).send("Forbidden");
  }

  let event;

  try {
    if (!stripe) {
      logger.error("Stripe webhook received but Stripe is not configured");
      return res.status(503).send("Stripe service not configured");
    }

    // Verify webhook signature using raw body
    logger.info("🔐 Attempting signature verification...");
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    logger.info("✅ Signature verification successful");
  } catch (err) {
    logger.error("❌ Webhook signature verification failed:", err.message);
    logger.error("❌ Error details:", err);

    // In development, try to parse the body anyway for debugging
    if (process.env.NODE_ENV !== "production") {
      logger.info(
        "🔧 Development mode: Attempting to parse body without signature verification"
      );
      try {
        event = JSON.parse(req.body.toString());
        logger.info("✅ Body parsed successfully in development mode");
      } catch (parseErr) {
        logger.error(
          "❌ Failed to parse body even without signature verification:",
          parseErr.message
        );
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  try {
    logger.info("🎯 Processing Stripe event:", event.type);
    logger.info("📊 Event data:", JSON.stringify(event.data.object, null, 2));

    switch (event.type) {
      case "checkout.session.completed":
        logger.info("✅ Processing checkout.session.completed");
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "invoice.payment_succeeded":
        // Handle subscription payments if needed in the future
        break;

      default:
      // Unhandled event type - no action needed
    }

    logger.info("✅ Webhook processing completed successfully");
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error("❌ Error processing webhook:", error);
    logger.error("❌ Error stack:", error.stack);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * Handle successful checkout session completion
 * This is the primary event for successful payments
 */
const handleCheckoutSessionCompleted = async (session) => {
  logger.info(
    "🎯 handleCheckoutSessionCompleted called with session:",
    session.id
  );
  logger.info("📊 Session details:", {
    id: session.id,
    payment_intent: session.payment_intent,
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    customer_email: session.customer_details?.email,
  });

  try {
    // Find payment by session ID (not payment intent)
    logger.info("🔍 Searching for payment with stripeSessionId:", session.id);
    const payment = await Payment.findOne({
      stripeSessionId: session.id,
    })
      .populate("userId", "name email role enrolledCourses")
      .populate("course", "title instructor enrolledStudents");

    logger.info(
      "💾 Payment found:",
      payment ? `ID: ${payment._id}, Status: ${payment.status}` : "NOT FOUND"
    );

    if (!payment) {
      logger.error("❌ Payment not found for session:", session.id);
      logger.info(
        "🔍 Let me search by payment intent instead:",
        session.payment_intent
      );

      // Fallback: try to find by payment intent
      const paymentByIntent = await Payment.findOne({
        stripePaymentIntentId: session.payment_intent,
      })
        .populate("userId", "name email role enrolledCourses")
        .populate("course", "title instructor enrolledStudents");

      if (paymentByIntent) {
        logger.info("✅ Found payment by payment intent:", paymentByIntent._id);
        // Update the session ID for future webhooks
        paymentByIntent.stripeSessionId = session.id;
        await paymentByIntent.save();
        // Continue processing with this payment
        return await processPaymentCompletion(paymentByIntent, session);
      } else {
        logger.error("❌ Payment not found by session ID OR payment intent");
        return;
      }
    }

    // Process the payment completion
    return await processPaymentCompletion(payment, session);
  } catch (error) {
    logger.error("Error handling checkout session completed:", error);
    throw error;
  }
};

/**
 * Process payment completion (shared logic for session and payment intent)
 */
const processPaymentCompletion = async (payment, sessionOrIntent) => {
  logger.info("🔄 Processing payment completion for payment:", payment._id);

  try {
    // Verify payment hasn't already been processed
    if (payment.status === "paid") {
      logger.info("⚠️ Payment already processed, skipping:", payment._id);
      return;
    }

    logger.info("💰 Updating payment status to paid");
    // Update payment status
    payment.status = "paid";
    payment.paidAt = new Date();

    // Store gateway response data
    if (sessionOrIntent.payment_intent) {
      // This is a session object
      payment.stripePaymentIntentId = sessionOrIntent.payment_intent;
      payment.paymentGatewayResponse = {
        sessionId: sessionOrIntent.id,
        paymentIntentId: sessionOrIntent.payment_intent,
        customerEmail: sessionOrIntent.customer_details?.email,
        amountTotal: sessionOrIntent.amount_total,
        currency: sessionOrIntent.currency,
        paymentStatus: sessionOrIntent.payment_status,
      };
    } else {
      // This is a payment intent object
      payment.paymentGatewayResponse = {
        paymentIntentId: sessionOrIntent.id,
        amount: sessionOrIntent.amount,
        currency: sessionOrIntent.currency,
        paymentMethod: sessionOrIntent.payment_method,
      };
    }

    logger.info("💾 Saving payment to database");
    await payment.save();
    logger.info("✅ Payment saved successfully");

    // Auto-enroll student if configured
    logger.info("🎓 Starting auto-enrollment process");
    await handleAutoEnrollment(payment);

    // Update user bills
    logger.info("📋 Updating user bills");
    await updateUserBills(payment);

    logger.info("🎉 Payment completion processing finished successfully");
  } catch (error) {
    logger.error("❌ Error in processPaymentCompletion:", error);
    throw error;
  }
};

/**
 * Handle successful payment intent
 * Backup handler for direct payment intent usage
 */
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  logger.info(
    "🎯 handlePaymentIntentSucceeded called with payment intent:",
    paymentIntent.id
  );

  try {
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id,
    })
      .populate("userId", "name email role enrolledCourses")
      .populate("course", "title instructor enrolledStudents");

    if (!payment) {
      logger.error(
        "❌ Payment not found for payment intent:",
        paymentIntent.id
      );
      return;
    }

    logger.info("✅ Payment found for payment intent:", payment._id);

    // Use shared processing function
    return await processPaymentCompletion(payment, paymentIntent);
  } catch (error) {
    logger.error("Error handling payment intent succeeded:", error);
    throw error;
  }
};

/**
 * Handle failed payment intent
 */
const handlePaymentIntentFailed = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!payment) {
      logger.error(
        "Payment not found for failed payment intent:",
        paymentIntent.id
      );
      return;
    }

    payment.status = "failed";
    payment.failureReason =
      paymentIntent.last_payment_error?.message || "Payment failed";
    payment.paymentGatewayResponse = {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error,
    };

    await payment.save();
  } catch (error) {
    logger.error("Error handling payment intent failed:", error);
    throw error;
  }
};

/**
 * Handle automatic enrollment after successful payment
 */
const handleAutoEnrollment = async (payment) => {
  logger.info("🎓 handleAutoEnrollment called for payment:", payment._id);

  try {
    // Check if auto-enrollment is enabled (this should be fetched from admin settings)
    const autoEnrollEnabled = true; // TODO: Get from AdminSettings
    logger.info("⚙️ Auto-enrollment enabled:", autoEnrollEnabled);

    if (!autoEnrollEnabled) {
      logger.info("⚠️ Auto-enrollment disabled, skipping");
      return;
    }

    const course = payment.course;
    const student = payment.userId;

    logger.info("📚 Course:", course ? course.title : "NOT FOUND");
    logger.info("👤 Student:", student ? student.name : "NOT FOUND");

    if (!course || !student) {
      logger.error("❌ Missing course or student data for enrollment");
      return;
    }

    // Check if student is already enrolled
    const alreadyEnrolled = course.enrolledStudents.includes(student._id);
    logger.info("🔍 Student already enrolled:", alreadyEnrolled);

    if (alreadyEnrolled) {
      logger.info("⚠️ Student already enrolled, skipping enrollment");
      return;
    }

    logger.info("➕ Adding student to course enrolled students");
    // Add student to course
    course.enrolledStudents.push(student._id);
    await course.save();
    logger.info("✅ Student added to course successfully");

    // Add course to student's enrolled courses
    const courseAlreadyInStudent = student.enrolledCourses.includes(course._id);
    logger.info(
      "🔍 Course already in student enrolled courses:",
      courseAlreadyInStudent
    );

    if (!courseAlreadyInStudent) {
      logger.info("➕ Adding course to student enrolled courses");
      student.enrolledCourses.push(course._id);
      await student.save();
      logger.info("✅ Course added to student successfully");
    }

    // Create billing transaction for instructor commission tracking
    logger.info("💰 Starting billing transaction creation");
    try {
      const paymentAmount = payment.finalAmount || payment.amount;
      logger.info("💵 Payment amount:", paymentAmount);
      logger.info("👨‍🏫 Course instructor:", course.instructor);

      if (course.instructor && paymentAmount) {
        logger.info("📊 Getting admin settings for fee calculation");
        // Get admin settings for fee calculation (match direct transaction logic)
        const AdminSettings = require("../models/AdminSettings");
        let adminSettings = await AdminSettings.findOne();
        if (!adminSettings) {
          logger.info("⚙️ Creating default admin settings");
          // Create default settings if none exist
          adminSettings = await AdminSettings.create({
            paymentSettings: {
              globalDeductionPercentage: 10, // 10% default
              studentAdminFee: 2, // $2 default admin fee
            },
          });
        }

        const originalAmount = paymentAmount;
        const finalAmount = paymentAmount;
        const adminFee = adminSettings.paymentSettings.studentAdminFee || 2;
        const adminPercentage =
          adminSettings.paymentSettings.globalDeductionPercentage || 10;
        const totalAdminProfit =
          adminFee + (originalAmount * adminPercentage) / 100;
        const instructorAmount = originalAmount - totalAdminProfit;

        logger.info("🧮 Billing calculation:", {
          originalAmount,
          adminFee,
          adminPercentage,
          totalAdminProfit: totalAdminProfit.toFixed(2),
          instructorAmount: instructorAmount.toFixed(2),
        });

        logger.info("🔄 Calling createBillingTransactionForCoursePayment");
        await createBillingTransactionForCoursePayment({
          studentId: student._id,
          courseId: course._id,
          instructorId: course.instructor,
          originalAmount: originalAmount,
          finalAmount: finalAmount,
          adminFee: adminFee,
          adminPercentage: adminPercentage,
          instructorAmount: instructorAmount,
          paymentId: payment._id,
          method: "stripe",
        });
        logger.info(
          `✅ Billing transaction created for Stripe webhook payment: ${payment._id}`
        );
        logger.info(
          `💰 Payment breakdown: Total: $${originalAmount}, Admin: $${totalAdminProfit.toFixed(
            2
          )}, Instructor: $${instructorAmount.toFixed(2)}`
        );
      } else {
        logger.info(
          "⚠️ Skipping billing transaction - missing instructor or payment amount"
        );
      }
    } catch (billingError) {
      logger.error(
        "❌ Error creating billing transaction in webhook:",
        billingError
      );
      logger.error("❌ Billing error stack:", billingError.stack);
      // Don't fail the enrollment if billing fails
    }
  } catch (error) {
    logger.error("Error in auto-enrollment:", error);
    // Don't throw error - payment was successful, enrollment can be handled manually
  }
};

/**
 * Update user bills after successful payment
 */
const updateUserBills = async (payment) => {
  try {
    const user = await User.findById(payment.userId._id);
    if (!user) {
      logger.error("User not found:", payment.userId._id);
      return;
    }

    // Find and update the corresponding bill
    const billIndex = user.bills.findIndex(
      (bill) =>
        bill.paymentId && bill.paymentId.toString() === payment._id.toString()
    );

    if (billIndex !== -1) {
      user.bills[billIndex].status = "paid";
      user.bills[billIndex].paidAt = payment.paidAt;
      await user.save();
    }
  } catch (error) {
    logger.error("Error updating user bills:", error);
    // Don't throw error - payment was successful
  }
};

// @desc    Handle PayPal webhooks
// @route   POST /api/webhooks/paypal
// @access  Public (but verified via signature)
const handlePayPalWebhook = asyncHandler(async (req, res) => {
  logger.info("🔔 PayPal webhook received!");
  logger.info("📋 Headers:", JSON.stringify(req.headers, null, 2));
  logger.info("📦 Body:", JSON.stringify(req.body, null, 2));

  try {
    const webhookEvent = req.body;
    logger.info("🎯 Processing PayPal event:", webhookEvent.event_type);

    // Enhanced PayPal webhook security validation
    if (!validatePayPalWebhook(req.headers, req.body)) {
      logger.error("❌ PayPal webhook signature validation failed");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }
    logger.info("✅ PayPal webhook signature validated");

    // Sanitize event type
    const eventType = sanitizeText(webhookEvent.event_type, 50);
    logger.info("🧹 Sanitized event type:", eventType);

    switch (webhookEvent.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED":
        logger.info("💰 Processing PAYMENT.CAPTURE.COMPLETED");
        await handlePayPalPaymentCompleted(webhookEvent);
        break;
      case "PAYMENT.CAPTURE.DENIED":
        logger.info("❌ Processing PAYMENT.CAPTURE.DENIED");
        await handlePayPalPaymentFailed(webhookEvent);
        break;
      case "CHECKOUT.ORDER.APPROVED":
        logger.info("✅ Processing CHECKOUT.ORDER.APPROVED - no action needed");
        break;
      default:
        logger.info(
          "⚠️ Unhandled PayPal webhook event:",
          webhookEvent.event_type
        );
    }

    logger.info("✅ PayPal webhook processed successfully");
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error("❌ PayPal webhook error:", error);
    logger.error("❌ PayPal webhook error stack:", error.stack);
    res.status(400).json({ error: "PayPal webhook processing failed" });
  }
});

// Helper function to handle PayPal payment completion
const handlePayPalPaymentCompleted = async (webhookEvent) => {
  logger.info("🎯 handlePayPalPaymentCompleted called");
  logger.info(
    "📊 Webhook event resource:",
    JSON.stringify(webhookEvent.resource, null, 2)
  );

  try {
    const resource = webhookEvent.resource;
    const customId = resource.custom_id;

    logger.info("🔍 Custom ID from PayPal webhook:", customId);

    if (!customId) {
      logger.error("❌ No custom_id found in PayPal webhook");
      return;
    }

    // Find payment by ID
    logger.info("🔍 Searching for payment with ID:", customId);
    const payment = await Payment.findById(customId)
      .populate("userId", "name email enrolledCourses")
      .populate("course", "title instructor enrolledStudents");

    logger.info(
      "💾 Payment found:",
      payment ? `ID: ${payment._id}, Status: ${payment.status}` : "NOT FOUND"
    );

    if (!payment) {
      logger.error("❌ Payment not found for PayPal webhook:", customId);
      return;
    }

    // Check if already processed
    if (payment.status === "paid") {
      logger.info(
        "⚠️ PayPal payment already processed, skipping:",
        payment._id
      );
      return;
    }

    logger.info("💰 Updating PayPal payment status to paid");
    // Update payment status
    payment.status = "paid";
    payment.paidAt = new Date();
    payment.paypalPaymentId = resource.id;
    payment.paymentGatewayResponse = resource;

    logger.info("💾 Saving PayPal payment to database");
    await payment.save();
    logger.info("✅ PayPal payment saved successfully");

    // Auto-enroll student in course
    logger.info("🎓 Starting PayPal auto-enrollment process");
    const course = await Course.findById(payment.course._id);
    logger.info("📚 Course found:", course ? course.title : "NOT FOUND");
    logger.info(
      "👤 Student:",
      payment.userId ? payment.userId.name : "NOT FOUND"
    );

    if (course && !course.enrolledStudents.includes(payment.userId._id)) {
      logger.info("➕ Adding student to course enrolled students");
      course.enrolledStudents.push(payment.userId._id);
      await course.save();
      logger.info("✅ Student enrolled in course successfully");

      // Add course to student's enrolled courses
      const student = payment.userId;
      if (student && !student.enrolledCourses.includes(course._id)) {
        logger.info("➕ Adding course to student enrolled courses");
        student.enrolledCourses.push(course._id);
        await student.save();
        logger.info("✅ Course added to student successfully");
      }

      // Create billing transaction for instructor commission tracking
      logger.info("💰 Starting PayPal billing transaction creation");
      try {
        const paymentAmount = payment.finalAmount || payment.amount;
        logger.info("💵 PayPal payment amount:", paymentAmount);
        logger.info("👨‍🏫 Course instructor:", course.instructor);

        if (course.instructor && paymentAmount) {
          logger.info("📊 Getting admin settings for PayPal fee calculation");
          // Get admin settings for fee calculation (match direct transaction logic)
          const AdminSettings = require("../models/AdminSettings");
          let adminSettings = await AdminSettings.findOne();
          if (!adminSettings) {
            logger.info("⚙️ Creating default admin settings for PayPal");
            // Create default settings if none exist
            adminSettings = await AdminSettings.create({
              paymentSettings: {
                globalDeductionPercentage: 10, // 10% default
                studentAdminFee: 2, // $2 default admin fee
              },
            });
          }

          const originalAmount = paymentAmount;
          const finalAmount = paymentAmount;
          const adminFee = adminSettings.paymentSettings.studentAdminFee || 2;
          const adminPercentage =
            adminSettings.paymentSettings.globalDeductionPercentage || 10;
          const totalAdminProfit =
            adminFee + (originalAmount * adminPercentage) / 100;
          const instructorAmount = originalAmount - totalAdminProfit;

          logger.info("🧮 PayPal billing calculation:", {
            originalAmount,
            adminFee,
            adminPercentage,
            totalAdminProfit: totalAdminProfit.toFixed(2),
            instructorAmount: instructorAmount.toFixed(2),
          });

          logger.info(
            "🔄 Calling createBillingTransactionForCoursePayment for PayPal"
          );
          await createBillingTransactionForCoursePayment({
            studentId: payment.userId._id,
            courseId: payment.course._id,
            instructorId: course.instructor,
            originalAmount: originalAmount,
            finalAmount: finalAmount,
            adminFee: adminFee,
            adminPercentage: adminPercentage,
            instructorAmount: instructorAmount,
            paymentId: payment._id,
            method: "paypal",
          });
          logger.info(
            `✅ Billing transaction created for PayPal payment: ${payment._id}`
          );
          logger.info(
            `💰 PayPal payment breakdown: Total: $${originalAmount}, Admin: $${totalAdminProfit.toFixed(
              2
            )}, Instructor: $${instructorAmount.toFixed(2)}`
          );
        } else {
          logger.info(
            "⚠️ Skipping PayPal billing transaction - missing instructor or payment amount"
          );
        }
      } catch (billingError) {
        logger.error(
          "❌ Error creating billing transaction for PayPal payment:",
          billingError
        );
        logger.error("❌ PayPal billing error stack:", billingError.stack);
        // Don't fail the enrollment if billing fails
      }
    } else {
      logger.info("⚠️ Student already enrolled in course or course not found");
    }

    // Update user's bills
    const user = await User.findById(payment.userId._id);
    if (user) {
      user.bills.push({
        description: `Course enrollment: ${payment.course.title}`,
        amount: payment.amount,
        status: "paid",
        paidAt: new Date(),
        paymentMethod: "paypal",
        paymentId: payment._id,
      });
      await user.save();
    }
  } catch (error) {
    logger.error("Error handling PayPal payment completion:", error);
  }
};

// Helper function to handle PayPal payment failure
const handlePayPalPaymentFailed = async (webhookEvent) => {
  try {
    const resource = webhookEvent.resource;
    const customId = resource.custom_id;

    if (!customId) {
      logger.error("No custom_id found in PayPal webhook");
      return;
    }

    // Find payment by ID
    const payment = await Payment.findById(customId);

    if (!payment) {
      logger.error("Payment not found for PayPal webhook:", customId);
      return;
    }

    // Update payment status
    payment.status = "failed";
    payment.failureReason = `PayPal payment denied: ${
      resource.reason_code || "Unknown reason"
    }`;
    await payment.save();
  } catch (error) {
    logger.error("Error handling PayPal payment failure:", error);
  }
};

module.exports = {
  handleStripeWebhook,
  handlePayPalWebhook,
};
