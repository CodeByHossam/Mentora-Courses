// Stripe checkout completion and shared payment completion logic. Split from webhookHelpers.js; bodies unchanged.

const logger = require('../../utils/logger');
const Payment = require("../../models/Payment");
const {
  handleAutoEnrollment,
  updateUserBills,
} = require("./webhookEnrollment");

// @desc    Handle Stripe webhooks
// @route   POST /api/webhooks/stripe
// @access  Public (but verified via signature)

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

module.exports = {
  handleCheckoutSessionCompleted,
  processPaymentCompletion
};
