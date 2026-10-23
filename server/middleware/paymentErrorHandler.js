/**
 * Payment Error Handling Middleware
 * 
 * Specialized error handling for payment operations with detailed logging,
 * user-friendly error messages, and security considerations.
 * 
 * @author Mentora Team
 * @version 1.0.0
 */

 
/**
 * Payment-specific error handler
 */
const paymentErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details (sanitized for security)
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id,
    timestamp: new Date().toISOString(),
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  };

  // Stripe-specific errors
  if (err.type && err.type.startsWith('Stripe')) {
     
    switch (err.type) {
      case 'StripeCardError':
        return res.status(400).json({
          success: false,
          message: 'Your card was declined. Please try a different payment method.',
          errorCode: 'CARD_DECLINED',
          data: null
        });
      
      case 'StripeRateLimitError':
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please wait a moment and try again.',
          errorCode: 'RATE_LIMITED',
          data: null
        });
      
      case 'StripeInvalidRequestError':
        return res.status(400).json({
          success: false,
          message: 'Invalid payment request. Please check your information.',
          errorCode: 'INVALID_REQUEST',
          data: null
        });
      
      case 'StripeAPIError':
      case 'StripeConnectionError':
      case 'StripeAuthenticationError':
        return res.status(500).json({
          success: false,
          message: 'Payment service temporarily unavailable. Please try again later.',
          errorCode: 'SERVICE_UNAVAILABLE',
          data: null
        });
      
      default:
        return res.status(500).json({
          success: false,
          message: 'Payment processing failed. Please try again.',
          errorCode: 'PAYMENT_ERROR',
          data: null
        });
    }
  }

  // PayPal-specific errors
  if (err.name === 'PayPalError' || (err.details && err.details[0]?.issue)) {
     
    return res.status(400).json({
      success: false,
      message: 'PayPal payment failed. Please check your PayPal account and try again.',
      errorCode: 'PAYPAL_ERROR',
      data: null
    });
  }

  // Validation errors (from express-validator)
  if (err.name === 'ValidationError' || err.errors) {
     
    return res.status(400).json({
      success: false,
      message: 'Invalid payment information provided.',
      errorCode: 'VALIDATION_ERROR',
      errors: err.errors || [{ message: err.message }],
      data: null
    });
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
     
    return res.status(400).json({
      success: false,
      message: 'Receipt file is too large. Please upload a file smaller than 5MB.',
      errorCode: 'FILE_TOO_LARGE',
      data: null
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
     
    return res.status(400).json({
      success: false,
      message: 'Invalid file upload. Please upload only image or PDF files.',
      errorCode: 'INVALID_FILE_TYPE',
      data: null
    });
  }

  // MongoDB/Database errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
     
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate payment record detected.',
        errorCode: 'DUPLICATE_PAYMENT',
        data: null
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Database error occurred. Please try again.',
      errorCode: 'DATABASE_ERROR',
      data: null
    });
  }

  // Rate limiting errors
  if (err.status === 429) {

    
    return res.status(429).json({
      success: false,
      message: err.message || 'Too many requests. Please wait before trying again.',
      errorCode: 'RATE_LIMITED',
      data: null
    });
  }

  // Authentication/Authorization errors
  if (err.status === 401) {
     
    return res.status(401).json({
      success: false,
      message: 'Authentication required for payment operations.',
      errorCode: 'UNAUTHORIZED',
      data: null
    });
  }

  if (err.status === 403) {
     
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions for this payment operation.',
      errorCode: 'FORBIDDEN',
      data: null
    });
  }

  // Generic payment errors
  if (err.message.toLowerCase().includes('payment')) {
     
    return res.status(500).json({
      success: false,
      message: 'Payment processing failed. Please contact support if the issue persists.',
      errorCode: 'PAYMENT_PROCESSING_ERROR',
      data: null
    });
  }

  // Default error handling
   
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred. Please try again later.'
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    errorCode: 'INTERNAL_ERROR',
    data: null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async error wrapper for payment routes
 */
const asyncPaymentHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Payment operation logger middleware
 */
const logPaymentOperation = (operation) => (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
 
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
     return originalJson.call(this, data);
  };

  next();
};

module.exports = {
  paymentErrorHandler,
  asyncPaymentHandler,
  logPaymentOperation
};
