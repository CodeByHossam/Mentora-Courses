/**
 * Shared Stripe client instance.
 *
 * Extracted verbatim from the guarded initialisation at the top of
 * paymentController.js so every role file uses the same instance.
 */
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  } catch (e) {
    stripe = null;
  }
}

module.exports = stripe;
