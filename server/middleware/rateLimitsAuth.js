const rateLimit = require('express-rate-limit');

// ================================
// AUTHENTICATION OPERATIONS
// ================================

// Login attempts - strict limits for security
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email if provided, otherwise IP
    return req.body?.email ? `login_${req.body.email}` : `login_${req.ip}`;
  },
  skipSuccessfulRequests: true // Don't count successful logins
});

// Registration attempts - moderate limits
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again in 1 hour.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email ? `register_${req.body.email}` : `register_${req.ip}`;
  }
});

// Password reset attempts
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in 1 hour.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email ? `reset_${req.body.email}` : `reset_${req.ip}`;
  }
});


module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter
};
