const { isValidStripeIP, validatePayPalWebhook, processPaymentCompletion, handleAutoEnrollment, updateUserBills, handleCheckoutSessionCompleted, handlePaymentIntentSucceeded, handlePaymentIntentFailed, handlePayPalPaymentCompleted, handlePayPalPaymentFailed } = require('./webhookHelpers');
const logger = require('../../utils/logger');
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
const Payment = require("../../models/Payment");
const Course = require("../../models/Course");
const User = require("../../models/User");
const { sanitizeText, sanitizeObjectId } = require("../../utils/sanitizer");

// Import billing utilities for commission tracking
const {
  createBillingTransactionForCoursePayment,
} = require("../../utils/billingUtils");

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

module.exports = {
  handlePayPalWebhook
};
