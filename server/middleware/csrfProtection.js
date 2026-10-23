/**
 * CSRF Protection Middleware
 * 
 * Implements Cross-Site Request Forgery protection for payment operations
 * using double-submit cookie pattern and SameSite cookies.
 * 
 * @author Mentora Team
 * @version 1.0.0
 */

const crypto = require('crypto');
const { sanitizeText } = require('../utils/sanitizer');

/**
 * Generate CSRF token
 */
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF protection middleware for payment routes
 */
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests and webhooks
  if (req.method === 'GET' || req.originalUrl.includes('/webhooks/')) {
    return next();
  }

  // Skip CSRF in development for API testing
  if (process.env.NODE_ENV === 'development' && req.headers['x-api-test']) {
    return next();
  }

  // Debug logging for CSRF token validation
  if (process.env.NODE_ENV === 'development') {
    console.log('CSRF Debug:', {
      headerToken: req.headers['x-csrf-token'],
      cookieToken: req.cookies['csrf-token'],
      hasHeaderToken: !!req.headers['x-csrf-token'],
      hasCookieToken: !!req.cookies['csrf-token']
    });
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const cookieToken = req.cookies['csrf-token'];

  // Sanitize tokens
  const sanitizedToken = sanitizeText(token, 64);
  const sanitizedCookieToken = sanitizeText(cookieToken, 64);

  // Validate CSRF token
  if (!sanitizedToken || !sanitizedCookieToken || sanitizedToken !== sanitizedCookieToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token. Please refresh the page and try again.',
      errorCode: 'CSRF_TOKEN_INVALID',
      data: null
    });
  }

  next();
};

/**
 * Generate and set CSRF token for client
 */
const setCSRFToken = (req, res, next) => {
  const token = generateCSRFToken();
  
  // Set secure cookie with CSRF token
  res.cookie('csrf-token', token, {
    httpOnly: false, // Allow client-side access for AJAX requests
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // Prevent cross-site requests
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  // Also provide token in response header for SPA applications
  res.set('X-CSRF-Token', token);
  
  next();
};

/**
 * CSRF token endpoint for client applications
 */
const getCSRFToken = (req, res) => {
  const token = generateCSRFToken();
  
  res.cookie('csrf-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  });

  res.json({
    success: true,
    message: 'CSRF token generated',
    data: { csrfToken: token }
  });
};

/**
 * Enhanced CSRF protection with additional security measures
 */
const enhancedCSRFProtection = (req, res, next) => {
  // Skip for safe methods and webhooks
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.originalUrl.includes('/webhooks/')) {
    return next();
  }

  // Check Origin header for additional protection
  const origin = req.headers.origin;
  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.ADMIN_URL,
    'http://localhost:3000', // Development
    'http://localhost:5173'  // Vite dev server
  ].filter(Boolean);

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Request from unauthorized origin.',
      errorCode: 'INVALID_ORIGIN',
      data: null
    });
  }

  // Check Referer header as additional protection
  const referer = req.headers.referer;
  if (referer) {
    const refererOrigin = new URL(referer).origin;
    if (!allowedOrigins.includes(refererOrigin)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid referer header.',
        errorCode: 'INVALID_REFERER',
        data: null
      });
    }
  }

  // Apply standard CSRF protection
  csrfProtection(req, res, next);
};

/**
 * Payment-specific CSRF protection with rate limiting
 */
const paymentCSRFProtection = (req, res, next) => {
  // Additional validation for payment operations
  const userAgent = req.headers['user-agent'];
  
  // Block requests without user agent (likely bots)
  if (!userAgent || userAgent.length < 10) {
    return res.status(403).json({
      success: false,
      message: 'Invalid request headers.',
      errorCode: 'INVALID_USER_AGENT',
      data: null
    });
  }

  // Check for suspicious patterns in user agent
  const suspiciousPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /java/i
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    return res.status(403).json({
      success: false,
      message: 'Automated requests not allowed for payment operations.',
      errorCode: 'AUTOMATED_REQUEST_BLOCKED',
      data: null
    });
  }

  // Apply enhanced CSRF protection
  enhancedCSRFProtection(req, res, next);
};

module.exports = {
  csrfProtection,
  setCSRFToken,
  getCSRFToken,
  enhancedCSRFProtection,
  paymentCSRFProtection,
  generateCSRFToken
};
