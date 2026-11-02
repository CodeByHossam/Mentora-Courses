module.exports = {
  ...require('./stripeWebhookController'),
  ...require('./paypalWebhookController'),
};

// Backward-compatible barrel.