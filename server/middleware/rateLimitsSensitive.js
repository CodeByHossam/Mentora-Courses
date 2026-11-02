const rateLimit = require('express-rate-limit');

// ================================
// PAYMENT OPERATIONS
// ================================

// Payment processing - strict limits for security
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment attempts per window
  message: {
    success: false,
    message: 'Payment rate limit exceeded. Please wait before making another payment.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `payment_${req.user._id}` : `payment_${req.ip}`;
  }
});

// Billing operations - moderate limits
const billingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 billing requests per window
  message: {
    success: false,
    message: 'Billing rate limit exceeded. Please wait before making more billing requests.',
    retryAfter: 10 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `billing_${req.user._id}` : `billing_${req.ip}`;
  }
});


// ================================
// ADMIN OPERATIONS
// ================================

// Admin operations - higher limits for admin users
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 admin requests per window
  message: {
    success: false,
    message: 'Admin rate limit exceeded. Please wait before making more requests.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `admin_${req.user._id}` : `admin_${req.ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for super admin
    return req.user && req.user.role === 'super_admin';
  }
});


// ================================
// WEBHOOK OPERATIONS
// ================================

// Webhook processing - strict limits for security
const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 webhook requests per window
  message: {
    success: false,
    message: 'Webhook rate limit exceeded.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use webhook source if available
    return req.headers['x-webhook-source'] || req.ip;
  }
});


module.exports = {
  paymentLimiter,
  billingLimiter,
  adminLimiter,
  webhookLimiter
};
