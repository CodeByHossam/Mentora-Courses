const Joi = require('joi');

const certificateValidation = {
  upload: Joi.object({
    studentId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.empty': 'Student ID is required',
        'string.pattern.base': 'Invalid student ID format'
      }),
    courseId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.empty': 'Course ID is required',
        'string.pattern.base': 'Invalid course ID format'
      }),
    grade: Joi.number()
      .min(0)
      .max(100)
      .required()
      .messages({
        'number.base': 'Grade must be a number',
        'number.min': 'Grade cannot be less than 0',
        'number.max': 'Grade cannot be more than 100',
        'any.required': 'Grade is required'
      }),
    issueDate: Joi.date()
      .default(Date.now)
      .messages({
        'date.base': 'Issue date must be a valid date'
      }),
    remarks: Joi.string()
      .max(500)
      .allow('')
      .default('')
      .messages({
        'string.max': 'Remarks cannot exceed 500 characters'
      })
  })
};

module.exports = certificateValidation;