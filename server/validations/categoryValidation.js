const Joi = require("joi");

const categoryValidation = {
  create: Joi.object({
    name: Joi.string().required().min(2).max(50).messages({
      "string.empty": "Category name is required",
      "string.min": "Category name must be at least 2 characters long",
      "string.max": "Category name cannot exceed 50 characters",
    }),
    description: Joi.string().required().min(10).max(500).messages({
      "string.empty": "Description is required",
      "string.min": "Description must be at least 10 characters long",
      "string.max": "Description cannot exceed 500 characters",
    }),
    icon: Joi.string().default("book"),
    imageUrl: Joi.string()
      .uri()
      .default("https://placehold.co/600x400?text=Category"),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(50).messages({
      "string.min": "Category name must be at least 2 characters long",
      "string.max": "Category name cannot exceed 50 characters",
    }),
    description: Joi.string().min(10).max(500).messages({
      "string.min": "Description must be at least 10 characters long",
      "string.max": "Description cannot exceed 500 characters",
    }),
    icon: Joi.string(),
    imageUrl: Joi.string().uri().messages({
      "string.uri": "Image URL must be a valid URL",
    }),
  }),
};

module.exports = categoryValidation;
