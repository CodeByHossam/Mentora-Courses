import DOMPurify from "dompurify";

/**
 * Comprehensive frontend validation utilities
 * Provides client-side validation and sanitization
 */

// Validation patterns - Match backend exactly
const PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-Z\s\-']+$/,
  phone: /^\+?[\d\s\-()]{10,15}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  mongoId: /^[0-9a-fA-F]{24}$/,
  alphanumeric: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
};

// Error messages
const ERROR_MESSAGES = {
  required: "This field is required",
  email: "Please enter a valid email address",
  password:
    "Password must contain at least 8 characters with uppercase, lowercase, number, and special character",
  passwordMismatch: "Passwords do not match",
  minLength: (min) => `Must be at least ${min} characters long`,
  maxLength: (max) => `Cannot exceed ${max} characters`,
  invalidFormat: "Invalid format",
  invalidFile: "Invalid file type or size",
  invalidUrl: "Please enter a valid URL",
  invalidName:
    "Name can only contain letters, spaces, hyphens, and apostrophes",
  invalidPrice: "Price must be a valid number between 0 and 10000",
  invalidDuration: "Duration must be a positive number",
};

/**
 * Sanitize input to prevent XSS attacks
 */
export const sanitizeInput = (input, allowHtml = false) => {
  if (typeof input !== "string") return input;

  if (allowHtml) {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "ol",
        "ul",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
      ],
      ALLOWED_ATTR: [],
    });
  }

  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Validate individual field
 */
export const validateField = (name, value, rules = {}, formData = {}) => {
  const errors = [];
  const sanitizedValue = sanitizeInput(value, rules.allowHtml);

  // Helper to safely trim strings
  const trimmedValue =
    typeof sanitizedValue === "string" ? sanitizedValue.trim() : sanitizedValue;

  // Required validation
  if (
    rules.required &&
    (trimmedValue === "" || trimmedValue === null || trimmedValue === undefined)
  ) {
    errors.push(ERROR_MESSAGES.required);
    return { isValid: false, errors, sanitizedValue };
  }

  // Skip other validations if field is empty and not required
  if (
    trimmedValue === "" ||
    trimmedValue === null ||
    trimmedValue === undefined
  ) {
    return { isValid: true, errors: [], sanitizedValue };
  }

  // Length validations
  if (rules.minLength && sanitizedValue.length < rules.minLength) {
    errors.push(ERROR_MESSAGES.minLength(rules.minLength));
  }

  if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
    errors.push(ERROR_MESSAGES.maxLength(rules.maxLength));
  }

  // Pattern validations
  if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
    errors.push(rules.patternMessage || ERROR_MESSAGES.invalidFormat);
  }

  // Match validation (for password confirmation)
  if (rules.match && formData[rules.match] !== sanitizedValue) {
    errors.push(ERROR_MESSAGES.passwordMismatch);
  }

  // Specific field validations
  switch (name) {
    case "email":
      if (!PATTERNS.email.test(sanitizedValue)) {
        errors.push(ERROR_MESSAGES.email);
      }
      break;

    case "password":
      if (!PATTERNS.password.test(sanitizedValue)) {
        errors.push(ERROR_MESSAGES.password);
      }
      break;

    case "name":
      if (!PATTERNS.name.test(sanitizedValue)) {
        errors.push(ERROR_MESSAGES.invalidName);
      }
      break;

    case "price":
      const price = parseFloat(sanitizedValue);
      if (isNaN(price) || price < 0 || price > 10000) {
        errors.push(ERROR_MESSAGES.invalidPrice);
      }
      break;

    case "duration":
      const duration = parseFloat(sanitizedValue);
      if (isNaN(duration) || duration <= 0) {
        errors.push(ERROR_MESSAGES.invalidDuration);
      }
      break;

    case "url":
      if (!PATTERNS.url.test(sanitizedValue)) {
        errors.push(ERROR_MESSAGES.invalidUrl);
      }
      break;
  }

  // Custom validation function
  if (rules.customValidator) {
    const customError = rules.customValidator(sanitizedValue);
    if (customError) {
      errors.push(customError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue,
  };
};

/**
 * Validate entire form
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  const sanitizedData = {};
  let isValid = true;

  Object.keys(validationRules).forEach((fieldName) => {
    const fieldValue = formData[fieldName];
    const fieldRules = validationRules[fieldName];

    const validation = validateField(fieldName, fieldValue, fieldRules);

    if (!validation.isValid) {
      errors[fieldName] = validation.errors;
      isValid = false;
    }

    sanitizedData[fieldName] = validation.sanitizedValue;
  });

  return { isValid, errors, sanitizedData };
};

/**
 * Validate file upload
 */
export const validateFile = (file, options = {}) => {
  const {
    allowedTypes = ["image/jpeg", "image/png", "image/webp"],
    maxSize = 5 * 1024 * 1024, // 5MB default
    required = false,
  } = options;

  if (!file) {
    return {
      isValid: !required,
      errors: required ? [ERROR_MESSAGES.required] : [],
    };
  }

  const errors = [];

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(
      `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`
    );
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(
      `File too large. Maximum size: ${(maxSize / (1024 * 1024)).toFixed(1)}MB`
    );
  }

  // Check file name for security
  if (file.name && !/^[a-zA-Z0-9._-]+$/.test(file.name.split(".")[0])) {
    errors.push(
      "Invalid file name. Use only letters, numbers, dots, hyphens, and underscores"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Password confirmation validation
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      errors: [ERROR_MESSAGES.passwordMismatch],
    };
  }
  return { isValid: true, errors: [] };
};

/**
 * Predefined validation rules for common forms
 */
export const VALIDATION_RULES = {
  user: {
    register: {
      name: { required: true, minLength: 2, maxLength: 50 },
      email: { required: true, maxLength: 254 },
      password: { required: true, minLength: 8, maxLength: 128 },
      confirmPassword: { required: true },
    },
    login: {
      email: { required: true },
      password: { required: true },
    },
    profile: {
      name: { required: true, minLength: 2, maxLength: 50 },
      email: { required: true, maxLength: 254 },
      bio: { maxLength: 1000, allowHtml: true },
    },
  },
  course: {
    create: {
      title: {
        required: true,
        minLength: 3,
        maxLength: 100,
        pattern: PATTERNS.alphanumeric,
        patternMessage: "Title contains invalid characters",
      },
      description: {
        required: true,
        minLength: 10,
        maxLength: 2000,
        allowHtml: true,
      },
      category: { required: true },
      level: { required: true },
      price: { required: true },
      duration: { required: true },
      topics: { required: true },
    },
  },
  lesson: {
    create: {
      title: {
        required: true,
        minLength: 3,
        maxLength: 200,
        pattern: PATTERNS.alphanumeric,
        patternMessage: "Title contains invalid characters",
      },
      description: {
        required: true,
        minLength: 10,
        maxLength: 2000,
        allowHtml: true,
      },
      content: {
        required: true,
        minLength: 20,
        maxLength: 50000,
        allowHtml: true,
      },
      duration: { required: true },
      order: { required: true },
    },
  },
  comment: {
    create: {
      content: { required: true, minLength: 1, maxLength: 1000 },
    },
  },
};

export default {
  validateField,
  validateForm,
  validateFile,
  validatePasswordConfirmation,
  sanitizeInput,
  VALIDATION_RULES,
  PATTERNS,
  ERROR_MESSAGES,
};
