const Joi = require("joi");

const commentValidation = {
  create: Joi.object({
    content: Joi.string()
      .required()
      .min(1)
      .max(1000)
      .trim()
      .messages({
        "string.empty": "Comment content is required",
        "string.min": "Comment cannot be empty",
        "string.max": "Comment cannot exceed 1000 characters"
      }),

    lesson: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.empty": "Lesson ID is required",
        "string.pattern.base": "Invalid lesson ID format"
      }),

    parentComment: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        "string.pattern.base": "Invalid parent comment ID format"
      })
  }),

  update: Joi.object({
    content: Joi.string()
      .required()
      .min(1)
      .max(1000)
      .trim()
      .messages({
        "string.empty": "Comment content is required",
        "string.min": "Comment cannot be empty",
        "string.max": "Comment cannot exceed 1000 characters"
      })
  })
};

module.exports = commentValidation;
