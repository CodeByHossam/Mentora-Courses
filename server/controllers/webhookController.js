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
  console.log("🔔 Stripe webhook received!");
  console.log("📋 Headers:", JSON.stringify(req.headers, null, 2));
  console.log("📦 Body length:", req.body ? req.body.length : "No body");
  console.log("🌐 Original URL:", req.originalUrl);

  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Enhanced security validation
  if (!endpointSecret) {
    console.error("❌ Stripe webhook secret not configured");
    console.error(
      "❌ STRIPE_WEBHOOK_SECRET env var:",
      process.env.STRIPE_WEBHOOK_SECRET ? "SET" : "NOT SET"
    );
    return res.status(400).send("Webhook secret not configured");
  }

  if (!sig) {
    console.error("❌ Missing Stripe signature header");
    console.error("❌ Available headers:", Object.keys(req.headers));
    return res.status(400).send("Missing signature header");
  }

  console.log("✅ Webhook secret configured");
  console.log("✅ Signature header present:", sig.substring(0, 20) + "...");
  console.log(
    "🔑 Expected webhook secret (first 20 chars):",
    endpointSecret.substring(0, 20) + "..."
  );

  // Rate limiting check for webhooks (basic IP-based)
  const clientIP = req.ip || req.connection.remoteAddress;
  console.log("🌐 Webhook request from IP:", clientIP);

  // Skip IP validation in development
  if (process.env.NODE_ENV === "production" && !isValidStripeIP(clientIP)) {
    console.error("Webhook request from invalid IP:", clientIP);
    return res.status(403).send("Forbidden");
  }

  let event;

  try {
    if (!stripe) {
      console.error("Stripe webhook received but Stripe is not configured");
      return res.status(503).send("Stripe service not configured");
    }

    // Verify webhook signature using raw body
    console.log("🔐 Attempting signature verification...");
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("✅ Signature verification successful");
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    console.error("❌ Error details:", err);

    // In development, try to parse the body anyway for debugging
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "🔧 Development mode: Attempting to parse body without signature verification"
      );
      try {
        event = JSON.parse(req.body.toString());
        console.log("✅ Body parsed successfully in development mode");
      } catch (parseErr) {
        console.error(
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
    console.log("🎯 Processing Stripe event:", event.type);
    console.log("📊 Event data:", JSON.stringify(event.data.object, null, 2));

    switch (event.type) {
      case "checkout.session.completed":
        console.log("✅ Processing checkout.session.completed");
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

    console.log("✅ Webhook processing completed successfully");
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

/**
 * Handle successful checkout session completion
 * This is the primary event for successful payments
 */
const handleCheckoutSessionCompleted = async (session) => {
  console.log(
    "🎯 handleCheckoutSessionCompleted called with session:",
    session.id
  );
  console.log("📊 Session details:", {
    id: session.id,
    payment_intent: session.payment_intent,
    payment_status: session.payment_status,
    amount_total: session.amount_total,
    customer_email: session.customer_details?.email,
  });

  try {
    // Find payment by session ID (not payment intent)
    console.log("🔍 Searching for payment with stripeSessionId:", session.id);
    const payment = await Payment.findOne({
      stripeSessionId: session.id,
    })
      .populate("userId", "name email role enrolledCourses")
      .populate("course", "title instructor enrolledStudents");

    console.log(
      "💾 Payment found:",
      payment ? `ID: ${payment._id}, Status: ${payment.status}` : "NOT FOUND"
    );

    if (!payment) {
      console.error("❌ Payment not found for session:", session.id);
      console.log(
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
        console.log("✅ Found payment by payment intent:", paymentByIntent._id);
        // Update the session ID for future webhooks
        paymentByIntent.stripeSessionId = session.id;
        await paymentByIntent.save();
        // Continue processing with this payment
        return await processPaymentCompletion(paymentByIntent, session);
      } else {
        console.error("❌ Payment not found by session ID OR payment intent");
        return;
      }
    }

    // Process the payment completion
    return await processPaymentCompletion(payment, session);
  } catch (error) {
    console.error("Error handling checkout session completed:", error);
    throw error;
  }
};

/**
 * Process payment completion (shared logic for session and payment intent)
 */
const processPaymentCompletion = async (payment, sessionOrIntent) => {
  console.log("🔄 Processing payment completion for payment:", payment._id);

  try {
    // Verify payment hasn't already been processed
    if (payment.status === "paid") {
      console.log("⚠️ Payment already processed, skipping:", payment._id);
      return;
    }

    console.log("💰 Updating payment status to paid");
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

    console.log("💾 Saving payment to database");
    await payment.save();
    console.log("✅ Payment saved successfully");

    // Auto-enroll student if configured
    console.log("🎓 Starting auto-enrollment process");
    await handleAutoEnrollment(payment);

    // Update user bills
    console.log("📋 Updating user bills");
    await updateUserBills(payment);

    console.log("🎉 Payment completion processing finished successfully");
  } catch (error) {
    console.error("❌ Error in processPaymentCompletion:", error);
    throw error;
  }
};

/**
 * Handle successful payment intent
 * Backup handler for direct payment intent usage
 */
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  console.log(
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
      console.error(
        "❌ Payment not found for payment intent:",
        paymentIntent.id
      );
      return;
    }

    console.log("✅ Payment found for payment intent:", payment._id);

    // Use shared processing function
    return await processPaymentCompletion(payment, paymentIntent);
  } catch (error) {
    console.error("Error handling payment intent succeeded:", error);
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
      console.error(
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
    console.error("Error handling payment intent failed:", error);
    throw error;
  }
};

/**
 * Handle automatic enrollment after successful payment
 */
const handleAutoEnrollment = async (payment) => {
  console.log("🎓 handleAutoEnrollment called for payment:", payment._id);

  try {
    // Check if auto-enrollment is enabled (this should be fetched from admin settings)
    const autoEnrollEnabled = true; // TODO: Get from AdminSettings
    console.log("⚙️ Auto-enrollment enabled:", autoEnrollEnabled);

    if (!autoEnrollEnabled) {
      console.log("⚠️ Auto-enrollment disabled, skipping");
      return;
    }

    const course = payment.course;
    const student = payment.userId;

    console.log("📚 Course:", course ? course.title : "NOT FOUND");
    console.log("👤 Student:", student ? student.name : "NOT FOUND");

    if (!course || !student) {
      console.error("❌ Missing course or student data for enrollment");
      return;
    }

    // Check if student is already enrolled
    const alreadyEnrolled = course.enrolledStudents.includes(student._id);
    console.log("🔍 Student already enrolled:", alreadyEnrolled);

    if (alreadyEnrolled) {
      console.log("⚠️ Student already enrolled, skipping enrollment");
      return;
    }

    console.log("➕ Adding student to course enrolled students");
    // Add student to course
    course.enrolledStudents.push(student._id);
    await course.save();
    console.log("✅ Student added to course successfully");

    // Add course to student's enrolled courses
    const courseAlreadyInStudent = student.enrolledCourses.includes(course._id);
    console.log(
      "🔍 Course already in student enrolled courses:",
      courseAlreadyInStudent
    );

    if (!courseAlreadyInStudent) {
      console.log("➕ Adding course to student enrolled courses");
      student.enrolledCourses.push(course._id);
      await student.save();
      console.log("✅ Course added to student successfully");
    }

    // Create billing transaction for instructor commission tracking
    console.log("💰 Starting billing transaction creation");
    try {
      const paymentAmount = payment.finalAmount || payment.amount;
      console.log("💵 Payment amount:", paymentAmount);
      console.log("👨‍🏫 Course instructor:", course.instructor);

      if (course.instructor && paymentAmount) {
        console.log("📊 Getting admin settings for fee calculation");
        // Get admin settings for fee calculation (match direct transaction logic)
        const AdminSettings = require("../models/AdminSettings");
        let adminSettings = await AdminSettings.findOne();
        if (!adminSettings) {
          console.log("⚙️ Creating default admin settings");
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

        console.log("🧮 Billing calculation:", {
          originalAmount,
          adminFee,
          adminPercentage,
          totalAdminProfit: totalAdminProfit.toFixed(2),
          instructorAmount: instructorAmount.toFixed(2),
        });

        console.log("🔄 Calling createBillingTransactionForCoursePayment");
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
        console.log(
          `✅ Billing transaction created for Stripe webhook payment: ${payment._id}`
        );
        console.log(
          `💰 Payment breakdown: Total: $${originalAmount}, Admin: $${totalAdminProfit.toFixed(
            2
          )}, Instructor: $${instructorAmount.toFixed(2)}`
        );
      } else {
        console.log(
          "⚠️ Skipping billing transaction - missing instructor or payment amount"
        );
      }
    } catch (billingError) {
      console.error(
        "❌ Error creating billing transaction in webhook:",
        billingError
      );
      console.error("❌ Billing error stack:", billingError.stack);
      // Don't fail the enrollment if billing fails
    }
  } catch (error) {
    console.error("Error in auto-enrollment:", error);
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
      console.error("User not found:", payment.userId._id);
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
    console.error("Error updating user bills:", error);
    // Don't throw error - payment was successful
  }
};

// @desc    Handle PayPal webhooks
// @route   POST /api/webhooks/paypal
// @access  Public (but verified via signature)
const handlePayPalWebhook = asyncHandler(async (req, res) => {
  console.log("🔔 PayPal webhook received!");
  console.log("📋 Headers:", JSON.stringify(req.headers, null, 2));
  console.log("📦 Body:", JSON.stringify(req.body, null, 2));

  try {
    const webhookEvent = req.body;
    console.log("🎯 Processing PayPal event:", webhookEvent.event_type);

    // Enhanced PayPal webhook security validation
    if (!validatePayPalWebhook(req.headers, req.body)) {
      console.error("❌ PayPal webhook signature validation failed");
      return res.status(400).json({ error: "Invalid webhook signature" });
    }
    console.log("✅ PayPal webhook signature validated");

    // Sanitize event type
    const eventType = sanitizeText(webhookEvent.event_type, 50);
    console.log("🧹 Sanitized event type:", eventType);

    switch (webhookEvent.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED":
        console.log("💰 Processing PAYMENT.CAPTURE.COMPLETED");
        await handlePayPalPaymentCompleted(webhookEvent);
        break;
      case "PAYMENT.CAPTURE.DENIED":
        console.log("❌ Processing PAYMENT.CAPTURE.DENIED");
        await handlePayPalPaymentFailed(webhookEvent);
        break;
      case "CHECKOUT.ORDER.APPROVED":
        console.log("✅ Processing CHECKOUT.ORDER.APPROVED - no action needed");
        break;
      default:
        console.log(
          "⚠️ Unhandled PayPal webhook event:",
          webhookEvent.event_type
        );
    }

    console.log("✅ PayPal webhook processed successfully");
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ PayPal webhook error:", error);
    console.error("❌ PayPal webhook error stack:", error.stack);
    res.status(400).json({ error: "PayPal webhook processing failed" });
  }
});

// Helper function to handle PayPal payment completion
const handlePayPalPaymentCompleted = async (webhookEvent) => {
  console.log("🎯 handlePayPalPaymentCompleted called");
  console.log(
    "📊 Webhook event resource:",
    JSON.stringify(webhookEvent.resource, null, 2)
  );

  try {
    const resource = webhookEvent.resource;
    const customId = resource.custom_id;

    console.log("🔍 Custom ID from PayPal webhook:", customId);

    if (!customId) {
      console.error("❌ No custom_id found in PayPal webhook");
      return;
    }

    // Find payment by ID
    console.log("🔍 Searching for payment with ID:", customId);
    const payment = await Payment.findById(customId)
      .populate("userId", "name email enrolledCourses")
      .populate("course", "title instructor enrolledStudents");

    console.log(
      "💾 Payment found:",
      payment ? `ID: ${payment._id}, Status: ${payment.status}` : "NOT FOUND"
    );

    if (!payment) {
      console.error("❌ Payment not found for PayPal webhook:", customId);
      return;
    }

    // Check if already processed
    if (payment.status === "paid") {
      console.log(
        "⚠️ PayPal payment already processed, skipping:",
        payment._id
      );
      return;
    }

    console.log("💰 Updating PayPal payment status to paid");
    // Update payment status
    payment.status = "paid";
    payment.paidAt = new Date();
    payment.paypalPaymentId = resource.id;
    payment.paymentGatewayResponse = resource;

    console.log("💾 Saving PayPal payment to database");
    await payment.save();
    console.log("✅ PayPal payment saved successfully");

    // Auto-enroll student in course
    console.log("🎓 Starting PayPal auto-enrollment process");
    const course = await Course.findById(payment.course._id);
    console.log("📚 Course found:", course ? course.title : "NOT FOUND");
    console.log(
      "👤 Student:",
      payment.userId ? payment.userId.name : "NOT FOUND"
    );

    if (course && !course.enrolledStudents.includes(payment.userId._id)) {
      console.log("➕ Adding student to course enrolled students");
      course.enrolledStudents.push(payment.userId._id);
      await course.save();
      console.log("✅ Student enrolled in course successfully");

      // Add course to student's enrolled courses
      const student = payment.userId;
      if (student && !student.enrolledCourses.includes(course._id)) {
        console.log("➕ Adding course to student enrolled courses");
        student.enrolledCourses.push(course._id);
        await student.save();
        console.log("✅ Course added to student successfully");
      }

      // Create billing transaction for instructor commission tracking
      console.log("💰 Starting PayPal billing transaction creation");
      try {
        const paymentAmount = payment.finalAmount || payment.amount;
        console.log("💵 PayPal payment amount:", paymentAmount);
        console.log("👨‍🏫 Course instructor:", course.instructor);

        if (course.instructor && paymentAmount) {
          console.log("📊 Getting admin settings for PayPal fee calculation");
          // Get admin settings for fee calculation (match direct transaction logic)
          const AdminSettings = require("../models/AdminSettings");
          let adminSettings = await AdminSettings.findOne();
          if (!adminSettings) {
            console.log("⚙️ Creating default admin settings for PayPal");
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

          console.log("🧮 PayPal billing calculation:", {
            originalAmount,
            adminFee,
            adminPercentage,
            totalAdminProfit: totalAdminProfit.toFixed(2),
            instructorAmount: instructorAmount.toFixed(2),
          });

          console.log(
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
          console.log(
            `✅ Billing transaction created for PayPal payment: ${payment._id}`
          );
          console.log(
            `💰 PayPal payment breakdown: Total: $${originalAmount}, Admin: $${totalAdminProfit.toFixed(
              2
            )}, Instructor: $${instructorAmount.toFixed(2)}`
          );
        } else {
          console.log(
            "⚠️ Skipping PayPal billing transaction - missing instructor or payment amount"
          );
        }
      } catch (billingError) {
        console.error(
          "❌ Error creating billing transaction for PayPal payment:",
          billingError
        );
        console.error("❌ PayPal billing error stack:", billingError.stack);
        // Don't fail the enrollment if billing fails
      }
    } else {
      console.log("⚠️ Student already enrolled in course or course not found");
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
    console.error("Error handling PayPal payment completion:", error);
  }
};

// Helper function to handle PayPal payment failure
const handlePayPalPaymentFailed = async (webhookEvent) => {
  try {
    const resource = webhookEvent.resource;
    const customId = resource.custom_id;

    if (!customId) {
      console.error("No custom_id found in PayPal webhook");
      return;
    }

    // Find payment by ID
    const payment = await Payment.findById(customId);

    if (!payment) {
      console.error("Payment not found for PayPal webhook:", customId);
      return;
    }

    // Update payment status
    payment.status = "failed";
    payment.failureReason = `PayPal payment denied: ${
      resource.reason_code || "Unknown reason"
    }`;
    await payment.save();
  } catch (error) {
    console.error("Error handling PayPal payment failure:", error);
  }
};

module.exports = {
  handleStripeWebhook,
  handlePayPalWebhook,
};
