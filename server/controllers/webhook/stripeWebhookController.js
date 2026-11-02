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

module.exports = {
  handleStripeWebhook
};
