const Joi = require("joi");

const paymentValidation = {
  create: Joi.object({
    amount: Joi.number()
      .required()
      .positive()
      .precision(2)
      .min(0.01)
      .max(10000)
      .messages({
        "number.base": "Amount must be a number",
        "number.positive": "Amount must be positive",
        "number.precision": "Amount cannot have more than 2 decimal places",
        "number.min": "Amount must be at least $0.01",
        "number.max": "Amount cannot exceed $10,000"
      }),

    course: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.empty": "Course ID is required",
        "string.pattern.base": "Invalid course ID format"
      }),

    paymentMethod: Joi.string()
      .required()
      .valid('credit_card', 'debit_card', 'paypal', 'bank_transfer')
      .messages({
        "string.empty": "Payment method is required",
        "any.only": "Invalid payment method"
      }),

    currency: Joi.string()
      .required()
      .length(3)
      .uppercase()
      .pattern(/^[A-Z]{3}$/)
      .default('USD')
      .messages({
        "string.empty": "Currency is required",
        "string.length": "Currency must be 3 characters",
        "string.pattern.base": "Invalid currency format"
      }),

    transactionId: Joi.string()
      .required()
      .min(10)
      .max(100)
      .alphanum()
      .messages({
        "string.empty": "Transaction ID is required",
        "string.min": "Transaction ID must be at least 10 characters",
        "string.max": "Transaction ID cannot exceed 100 characters",
        "string.alphanum": "Transaction ID must contain only letters and numbers"
      })
  }),

  update: Joi.object({
    status: Joi.string()
      .valid('pending', 'completed', 'failed', 'refunded')
      .messages({
        "any.only": "Invalid payment status"
      }),

    refundReason: Joi.string()
      .max(500)
      .trim()
      .when('status', {
        is: 'refunded',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        "string.max": "Refund reason cannot exceed 500 characters"
      })
  })
};

module.exports = paymentValidation;
