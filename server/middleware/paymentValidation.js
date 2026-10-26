/**
 * Payment Validation Middleware
 * 
 * Comprehensive input validation and sanitization for payment endpoints
 * using express-validator to prevent XSS, injection attacks, and data corruption.
 * 
 * @author Mentora Team
 * @version 1.0.0
 */

const { body, param, query, validationResult } = require('express-validator');
const { sanitizeHtml } = require('../utils/sanitizer');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * Validation for payment initiation
 */
const validatePaymentInitiation = [
  body('courseId')
    .isMongoId()
    .withMessage('Course ID must be a valid MongoDB ObjectId')
    .notEmpty()
    .withMessage('Course ID is required'),
  
  body('method')
    .optional()
    .isIn(['stripe', 'paypal', 'direct_transfer'])
    .withMessage('Payment method must be stripe, paypal, or direct_transfer')
    .customSanitizer(value => sanitizeHtml(value)),
  
  handleValidationErrors
];

/**
 * Validation for Stripe payment confirmation
 */
const validateStripeConfirmation = [
  body('paymentIntentId')
    .isString()
    .withMessage('Payment Intent ID must be a string')
    .matches(/^pi_[a-zA-Z0-9_]+$/)
    .withMessage('Invalid Stripe Payment Intent ID format')
    .isLength({ min: 10, max: 100 })
    .withMessage('Payment Intent ID must be between 10 and 100 characters'),
  
  handleValidationErrors
];

/**
 * Validation for PayPal payment confirmation
 */
const validatePayPalConfirmation = [
  body('orderId')
    .isString()
    .withMessage('Order ID must be a string')
    .isLength({ min: 10, max: 50 })
    .withMessage('Order ID must be between 10 and 50 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Invalid PayPal Order ID format'),
  
  body('paymentId')
    .isMongoId()
    .withMessage('Payment ID must be a valid MongoDB ObjectId')
    .notEmpty()
    .withMessage('Payment ID is required'),
  
  handleValidationErrors
];

/**
 * Validation for direct transfer payment
 */
const validateDirectTransfer = [
  body('paymentId')
    .isMongoId()
    .withMessage('Payment ID must be a valid MongoDB ObjectId')
    .notEmpty()
    .withMessage('Payment ID is required'),
  
  body('transferDetails.bankName')
    .isString()
    .withMessage('Bank name must be a string')
    .isLength({ min: 2, max: 100 })
    .withMessage('Bank name must be between 2 and 100 characters')
    .customSanitizer(value => sanitizeHtml(value))
    .trim()
    .escape(),
  
  body('transferDetails.accountNumber')
    .isString()
    .withMessage('Account number must be a string')
    .isLength({ min: 5, max: 30 })
    .withMessage('Account number must be between 5 and 30 characters')
    .matches(/^[0-9A-Za-z\-]+$/)
    .withMessage('Account number can only contain letters, numbers, and hyphens')
    .customSanitizer(value => sanitizeHtml(value)),
  
  body('transferDetails.transferAmount')
    .isFloat({ min: 0.01, max: 999999.99 })
    .withMessage('Transfer amount must be a valid number between 0.01 and 999999.99')
    .toFloat(),
  
  body('transferDetails.transferDate')
    .isISO8601()
    .withMessage('Transfer date must be a valid ISO 8601 date')
    .toDate(),
  
  body('transferDetails.referenceNumber')
    .optional()
    .isString()
    .withMessage('Reference number must be a string')
    .isLength({ max: 50 })
    .withMessage('Reference number must be less than 50 characters')
    .customSanitizer(value => sanitizeHtml(value))
    .trim()
    .escape(),
  
  handleValidationErrors
];

/**
 * Validation for payment approval (admin)
 */
const validatePaymentApproval = [
  param('id')
    .isMongoId()
    .withMessage('Payment ID must be a valid MongoDB ObjectId'),
  
  body('approved')
    .isBoolean()
    .withMessage('Approved field must be a boolean')
    .toBoolean(),
  
  body('adminNote')
    .optional()
    .isString()
    .withMessage('Admin note must be a string')
    .isLength({ max: 500 })
    .withMessage('Admin note must be less than 500 characters')
    .customSanitizer(value => sanitizeHtml(value))
    .trim()
    .escape(),
  
  handleValidationErrors
];

/**
 * Validation for legacy payment creation (admin)
 */
const validateLegacyPaymentCreation = [
  body('student')
    .isMongoId()
    .withMessage('Student ID must be a valid MongoDB ObjectId')
    .notEmpty()
    .withMessage('Student ID is required'),
  
  body('course')
    .isMongoId()
    .withMessage('Course ID must be a valid MongoDB ObjectId')
    .notEmpty()
    .withMessage('Course ID is required'),
  
  body('enrollmentRequest')
    .optional()
    .isMongoId()
    .withMessage('Enrollment Request ID must be a valid MongoDB ObjectId'),
  
  body('amount')
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Amount must be a valid number between 0 and 999999.99')
    .toFloat(),
  
  body('method')
    .optional()
    .isIn(['stripe', 'paypal', 'direct_transfer', 'cash', 'bank_transfer'])
    .withMessage('Invalid payment method')
    .customSanitizer(value => sanitizeHtml(value)),
  
  body('status')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Invalid payment status')
    .customSanitizer(value => sanitizeHtml(value)),
  
  handleValidationErrors
];

/**
 * Validation for payment updates (admin)
 */
const validatePaymentUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Payment ID must be a valid MongoDB ObjectId'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0, max: 999999.99 })
    .withMessage('Amount must be a valid number between 0 and 999999.99')
    .toFloat(),
  
  body('method')
    .optional()
    .isIn(['stripe', 'paypal', 'direct_transfer', 'cash', 'bank_transfer'])
    .withMessage('Invalid payment method')
    .customSanitizer(value => sanitizeHtml(value)),
  
  body('status')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Invalid payment status')
    .customSanitizer(value => sanitizeHtml(value)),
  
  handleValidationErrors
];

/**
 * Validation for query parameters
 */
const validatePaymentQuery = [
  query('status')
    .optional()
    .isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Invalid status filter')
    .customSanitizer(value => sanitizeHtml(value)),
  
  query('method')
    .optional()
    .isIn(['stripe', 'paypal', 'direct_transfer', 'cash', 'bank_transfer'])
    .withMessage('Invalid method filter')
    .customSanitizer(value => sanitizeHtml(value)),
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be an integer between 1 and 1000')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),
  
  handleValidationErrors
];

/**
 * Validation for MongoDB ObjectId parameters
 */
const validateObjectIdParam = [
  param('id')
    .isMongoId()
    .withMessage('ID must be a valid MongoDB ObjectId'),
  
  handleValidationErrors
];

module.exports = {
  validatePaymentInitiation,
  validateDirectTransfer,
  validatePaymentApproval,
  validateLegacyPaymentCreation,
  validatePaymentUpdate,
  validatePaymentQuery,
  validateObjectIdParam,
  handleValidationErrors
};
