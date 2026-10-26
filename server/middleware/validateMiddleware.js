/**
 * Middleware for Joi-based request validation
 */

const { sendError } = require("../utils/apiResponse");
const logger = require("../utils/logger");

/**
 * Creates a validation middleware using the provided Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Request property to validate: body, query, or params
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/"/g, ""),
      }));

      logger.warn("Request validation failed", { source, errors });
      return sendError(res, "Validation failed", 400, errors);
    }

    req[source] = value;
    next();
  };
};

module.exports = {
  validate
};