// Webhook helpers barrel. Split from the original monolithic webhookHelpers.js;
// function bodies are unchanged.
//
// Gateway clients and shared model imports below are initialised at import time
// exactly as before (the original module did this once for every helper).

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

const {
  isValidStripeIP,
  validatePayPalWebhook,
} = require('./webhookValidation');
const {
  handleCheckoutSessionCompleted,
  processPaymentCompletion,
} = require('./webhookPaymentCompletion');
const {
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
} = require('./webhookStripeEvents');
const {
  handleAutoEnrollment,
  updateUserBills,
} = require('./webhookEnrollment');
const {
  handlePayPalPaymentCompleted,
  handlePayPalPaymentFailed,
} = require('./webhookPaypalEvents');

module.exports = {
  isValidStripeIP,
  validatePayPalWebhook,
  processPaymentCompletion,
  handleAutoEnrollment,
  updateUserBills,
  handleCheckoutSessionCompleted,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handlePayPalPaymentCompleted,
  handlePayPalPaymentFailed
};
