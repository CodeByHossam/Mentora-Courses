const Joi = require("joi");

// Enhanced password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const userValidation = {
  register: Joi.object({
    name: Joi.string()
      .required()
      .min(2)
      .max(50)
      .trim()
      .pattern(/^[a-zA-Z\s\-']+$/)
      .messages({
        "string.empty": "Name is required",
        "string.min": "Name must be at least 2 characters long",
        "string.max": "Name cannot exceed 50 characters",
        "string.pattern.base": "Name can only contain letters, spaces, hyphens, and apostrophes"
      }),
    email: Joi.string()
      .required()
      .email({ tlds: { allow: false } })
      .max(254)
      .lowercase()
      .trim()
      .messages({
        "string.empty": "Email is required",
        "string.email": "Please provide a valid email address",
        "string.max": "Email cannot exceed 254 characters"
      }),
    password: Joi.string()
      .required()
      .min(8)
      .max(128)
      .pattern(passwordRegex)
      .messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 8 characters long",
        "string.max": "Password cannot exceed 128 characters",
        "string.pattern.base": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      }),
    role: Joi.string()
      .valid("student", "instructor", "admin")
      .default("student")
      .messages({
        "any.only": "Role must be one of: student, instructor, admin",
      }),
    termsAccepted: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
  }),

  login: Joi.object({
    email: Joi.string().required().email().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required",
    }),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(50).messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 50 characters",
    }),
    email: Joi.string().email().messages({
      "string.email": "Please provide a valid email address",
    }),
    role: Joi.string().valid("student", "instructor", "admin").messages({
      "any.only": "Role must be one of: student, instructor, admin",
    }),
    bio: Joi.string()
      .max(1000)
      .trim()
      .allow('')
      .messages({
        "string.max": "Bio cannot exceed 1000 characters"
      }),
    avatar: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .max(500)
      .messages({
        "string.uri": "Avatar URL must be a valid URL",
        "string.max": "Avatar URL cannot exceed 500 characters"
      }),
    isVerified: Joi.boolean(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      "string.empty": "Current password is required",
    }),
    newPassword: Joi.string()
      .required()
      .min(8)
      .max(128)
      .pattern(passwordRegex)
      .messages({
        "string.empty": "New password is required",
        "string.min": "New password must be at least 8 characters long",
        "string.max": "New password cannot exceed 128 characters",
        "string.pattern.base": "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      }),
    confirmPassword: Joi.string()
      .required()
      .valid(Joi.ref("newPassword"))
      .messages({
        "string.empty": "Please confirm your new password",
        "any.only": "Passwords do not match",
      }),
  }),

  resetPassword: Joi.object({
    email: Joi.string().required().email().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
    }),
  }),

  verifyResetToken: Joi.object({
    token: Joi.string().required().messages({
      "string.empty": "Reset token is required",
    }),
    newPassword: Joi.string()
      .required()
      .min(8)
      .max(128)
      .pattern(passwordRegex)
      .messages({
        "string.empty": "New password is required",
        "string.min": "New password must be at least 8 characters long",
        "string.max": "New password cannot exceed 128 characters",
        "string.pattern.base": "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      }),
    confirmPassword: Joi.string()
      .required()
      .valid(Joi.ref("newPassword"))
      .messages({
        "string.empty": "Please confirm your new password",
        "any.only": "Passwords do not match",
      }),
  }),
};

module.exports = userValidation;
