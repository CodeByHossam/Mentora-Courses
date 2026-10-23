/**
 * Webhook Routes
 * 
 * Separate routes for webhook handling that bypass express.json() middleware
 * to preserve raw body for signature verification.
 * 
 * @author Mentora Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const { handleStripeWebhook, handlePayPalWebhook } = require('../controllers/webhookController');

// Use express.raw() for Stripe webhooks - must preserve raw body for signature verification
router.use('/stripe', express.raw({ type: 'application/json' }));
router.use('/paypal', express.json()); // PayPal can use JSON parsing

// Add logging middleware for debugging
router.use((req, res, next) => {
  console.log(`🔍 Webhook route: ${req.method} ${req.originalUrl}`);
  console.log(`📦 Body type: ${typeof req.body}, Length: ${req.body ? req.body.length : 'No body'}`);
  next();
});

// Test endpoint for webhook connectivity
router.get('/test', (req, res) => {
  console.log('🧪 Webhook test endpoint called');
  res.status(200).json({
    success: true,
    message: 'Webhook endpoints are accessible',
    timestamp: new Date().toISOString(),
    endpoints: {
      stripe: '/api/webhooks/stripe',
      paypal: '/api/webhooks/paypal'
    }
  });
});

// Webhook routes
router.post('/stripe', handleStripeWebhook);
router.post('/paypal', handlePayPalWebhook);

module.exports = router;
