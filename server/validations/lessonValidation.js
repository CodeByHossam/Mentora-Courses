const Joi = require("joi");

const lessonValidation = {
  create: Joi.object({
    title: Joi.string()
      .required()
      .min(3)
      .max(200)
      .trim()
      .pattern(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
      .messages({
        "string.empty": "Lesson title is required",
        "string.min": "Title must be at least 3 characters long",
        "string.max": "Title cannot exceed 200 characters",
        "string.pattern.base": "Title contains invalid characters"
      }),

    description: Joi.string()
      .required()
      .min(10)
      .max(2000)
      .trim()
      .messages({
        "string.empty": "Description is required",
        "string.min": "Description must be at least 10 characters long",
        "string.max": "Description cannot exceed 2000 characters"
      }),

    content: Joi.string()
      .required()
      .min(20)
      .max(50000)
      .trim()
      .messages({
        "string.empty": "Content is required",
        "string.min": "Content must be at least 20 characters long",
        "string.max": "Content cannot exceed 50000 characters"
      }),

    duration: Joi.string()
      .required()
      .pattern(/^([0-9]{1,2}):([0-5][0-9])$/)
      .messages({
        "string.empty": "Duration is required",
        "string.pattern.base": "Duration must be in format MM:SS or HH:MM"
      }),

    order: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .default(1)
      .messages({
        "number.base": "Order must be a number",
        "number.integer": "Order must be an integer",
        "number.min": "Order must be at least 1",
        "number.max": "Order cannot exceed 1000"
      }),

    course: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.empty": "Course ID is required",
        "string.pattern.base": "Invalid course ID format"
      }),

    videoUrl: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .max(500)
      .optional()
      .messages({
        "string.uri": "Video URL must be a valid URL",
        "string.max": "Video URL cannot exceed 500 characters"
      }),

    image: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .max(500)
      .optional()
      .messages({
        "string.uri": "Image URL must be a valid URL",
        "string.max": "Image URL cannot exceed 500 characters"
      })
  }),

  update: Joi.object({
    title: Joi.string()
      .min(3)
      .max(200)
      .trim()
      .pattern(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
      .messages({
        "string.min": "Title must be at least 3 characters long",
        "string.max": "Title cannot exceed 200 characters",
        "string.pattern.base": "Title contains invalid characters"
      }),

    description: Joi.string()
      .min(10)
      .max(2000)
      .trim()
      .messages({
        "string.min": "Description must be at least 10 characters long",
        "string.max": "Description cannot exceed 2000 characters"
      }),

    content: Joi.string()
      .min(20)
      .max(50000)
      .trim()
      .messages({
        "string.min": "Content must be at least 20 characters long",
        "string.max": "Content cannot exceed 50000 characters"
      }),

    duration: Joi.string()
      .pattern(/^([0-9]{1,2}):([0-5][0-9])$/)
      .messages({
        "string.pattern.base": "Duration must be in format MM:SS or HH:MM"
      }),

    order: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .messages({
        "number.base": "Order must be a number",
        "number.integer": "Order must be an integer",
        "number.min": "Order must be at least 1",
        "number.max": "Order cannot exceed 1000"
      }),

    videoUrl: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .max(500)
      .allow('')
      .messages({
        "string.uri": "Video URL must be a valid URL",
        "string.max": "Video URL cannot exceed 500 characters"
      }),

    image: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .max(500)
      .allow('')
      .messages({
        "string.uri": "Image URL must be a valid URL",
        "string.max": "Image URL cannot exceed 500 characters"
      })
  })
};

module.exports = lessonValidation;
