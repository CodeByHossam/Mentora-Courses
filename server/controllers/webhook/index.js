module.exports = {
  ...require('./stripeWebhookController'),
  ...require('./paypalWebhookController'),
};

// Import from this barrel only. Never deep-path into this folder.