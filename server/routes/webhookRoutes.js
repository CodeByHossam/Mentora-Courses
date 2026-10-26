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

// Test endpoint for webhook connectivity
router.get('/test', (req, res) => {
  console.log('🧪 Webhook test endpoint called');
  res.status(200).json({
    success: true,
    message: 'Webhook endpoints are accessible',
    timestamp: new Date().toISOString(),
    endpoints: {
      direct_transfer: '/api/webhooks/test'
    }
  });
});

// Card/PayPal webhooks removed
router.all('/stripe', (req, res) => res.status(410).json({ success: false, message: 'Card/PayPal payment is not available. Please contact your instructor.' }));
router.all('/paypal', (req, res) => res.status(410).json({ success: false, message: 'Card/PayPal payment is not available. Please contact your instructor.' }));

module.exports = router;
