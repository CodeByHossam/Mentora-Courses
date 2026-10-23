const Joi = require("joi");

const parseTopics = (value, helpers) => {
  try {
    if (typeof value === "string") {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        return helpers.error("any.invalid");
      }
      return parsed;
    }
    return value;
  } catch (err) {
    return helpers.error("any.invalid");
  }
};

const courseValidation = {
  create: Joi.object({
    title: Joi.string()
      .required()
      .min(3)
      .max(100)
      .trim()
      .pattern(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
      .messages({
      "string.empty": "Title is required",
      "string.min": "Title must be at least 3 characters long",
      "string.max": "Title cannot exceed 100 characters",
    }),
    description: Joi.string()
      .required()
      .min(10)
      .max(2000)
      .trim()
      .messages({
      "string.empty": "Description is required",
      "string.min": "Description must be at least 10 characters long",
      "string.max": "Description cannot exceed 1000 characters",
    }),
    category: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
      "string.empty": "Category is required",
      "string.pattern.base": "Invalid category ID format"
    }),
    level: Joi.string()
      .valid("Beginner", "Intermediate", "Advanced")
      .required()
      .messages({
        "any.only": "Level must be one of: Beginner, Intermediate, Advanced",
      }),
    price: Joi.number()
      .required()
      .min(0)
      .max(10000)
      .precision(2)
      .messages({
      "number.base": "Price must be a number",
      "number.min": "Price cannot be negative",
    }),
    duration: Joi.number()
      .required()
      .integer()
      .min(1)
      .max(500)
      .messages({
      "number.base": "Duration must be a number",
      "number.integer": "Duration must be an integer",
      "number.min": "Duration must be at least 1 hour",
      "number.max": "Duration cannot exceed 500 hours"
    }),

    // topics can be sent as a stringified array or a real array
    topics: Joi.alternatives()
      .try(
        Joi.array().items(Joi.string()).min(1),
        Joi.string().custom(parseTopics, "JSON string to array")
      )
      .required()
      .messages({
        "array.min": "At least one topic is required",
        "any.invalid": "Topics must be a valid array or JSON string of strings",
      }),

    imageUrl: Joi.string()
      .optional()
      .uri({ scheme: ['http', 'https'] })
      .max(500)
      .messages({
        "string.uri": "Image URL must be a valid URL",
        "string.max": "Image URL cannot exceed 500 characters"
      }),
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(100).messages({
      "string.min": "Title must be at least 3 characters long",
      "string.max": "Title cannot exceed 100 characters",
    }),
    description: Joi.string().min(10).max(1000).messages({
      "string.min": "Description must be at least 10 characters long",
      "string.max": "Description cannot exceed 1000 characters",
    }),
    category: Joi.string(),
    level: Joi.string().valid("Beginner", "Intermediate", "Advanced").messages({
      "any.only": "Level must be one of: Beginner, Intermediate, Advanced",
    }),
    price: Joi.number().min(0).messages({
      "number.base": "Price must be a number",
      "number.min": "Price cannot be negative",
    }),
    duration: Joi.string(),

    topics: Joi.alternatives()
      .try(
        Joi.array().items(Joi.string()).min(1),
        Joi.string().custom(parseTopics, "JSON string to array")
      )
      .messages({
        "array.min": "At least one topic is required",
        "any.invalid": "Topics must be a valid array or JSON string of strings",
      }),

    imageUrl: Joi.string().uri().messages({
      "string.uri": "Image URL must be a valid URL",
    }),
    isPublished: Joi.boolean(),
  }),
};

module.exports = courseValidation;
