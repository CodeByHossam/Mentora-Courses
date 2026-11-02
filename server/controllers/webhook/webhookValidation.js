// Webhook request validation (Stripe IP, PayPal signature). Split from webhookHelpers.js; bodies unchanged.

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

module.exports = {
  isValidStripeIP,
  validatePayPalWebhook
};
