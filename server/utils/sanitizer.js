/**
 * Input Sanitization Utilities
 * 
 * Provides comprehensive input sanitization to prevent XSS attacks,
 * HTML injection, and other security vulnerabilities.
 * 
 * @author Mentora Team
 * @version 1.0.0
 */

const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeHtml = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Use DOMPurify to clean HTML
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true // Keep text content
  });
  
  // Additional escaping for extra security
  return validator.escape(cleaned);
};

/**
 * Sanitize and validate email addresses
 * @param {string} email - The email to sanitize and validate
 * @returns {string|null} - Sanitized email or null if invalid
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') {
    return null;
  }
  
  const normalizedEmail = validator.normalizeEmail(email);
  return validator.isEmail(normalizedEmail) ? normalizedEmail : null;
};

/**
 * Sanitize numeric input
 * @param {any} input - The input to sanitize as number
 * @param {object} options - Validation options {min, max, isFloat}
 * @returns {number|null} - Sanitized number or null if invalid
 */
const sanitizeNumber = (input, options = {}) => {
  const { min = -Infinity, max = Infinity, isFloat = true } = options;
  
  let num;
  if (isFloat) {
    num = parseFloat(input);
  } else {
    num = parseInt(input, 10);
  }
  
  if (isNaN(num) || num < min || num > max) {
    return null;
  }
  
  return num;
};

/**
 * Sanitize MongoDB ObjectId
 * @param {string} id - The ObjectId string to validate
 * @returns {string|null} - Valid ObjectId or null
 */
const sanitizeObjectId = (id) => {
  if (typeof id !== 'string') {
    return null;
  }
  
  return validator.isMongoId(id) ? id : null;
};

/**
 * Sanitize URL input
 * @param {string} url - The URL to sanitize
 * @returns {string|null} - Valid URL or null
 */
const sanitizeUrl = (url) => {
  if (typeof url !== 'string') {
    return null;
  }
  
  return validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  }) ? url : null;
};

/**
 * Sanitize file name to prevent directory traversal
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Safe filename
 */
const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') {
    return 'file';
  }
  
  // Remove path separators and dangerous characters
  return filename
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/\.\./g, '')
    .replace(/^\./, '')
    .trim() || 'file';
};

/**
 * Sanitize phone number
 * @param {string} phone - The phone number to sanitize
 * @returns {string|null} - Sanitized phone or null if invalid
 */
const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') {
    return null;
  }
  
  // Remove all non-digit characters except + at the beginning
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  return validator.isMobilePhone(cleaned) ? cleaned : null;
};

/**
 * Sanitize text input with length limits
 * @param {string} text - The text to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized text
 */
const sanitizeText = (text, maxLength = 1000) => {
  if (typeof text !== 'string') {
    return '';
  }
  
  // Sanitize HTML and trim
  const sanitized = sanitizeHtml(text).trim();
  
  // Enforce length limit
  return sanitized.length > maxLength 
    ? sanitized.substring(0, maxLength) 
    : sanitized;
};

/**
 * Sanitize boolean input
 * @param {any} input - The input to convert to boolean
 * @returns {boolean} - Sanitized boolean
 */
const sanitizeBoolean = (input) => {
  if (typeof input === 'boolean') {
    return input;
  }
  
  if (typeof input === 'string') {
    const lower = input.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  
  return Boolean(input);
};

/**
 * Sanitize date input
 * @param {any} input - The input to convert to date
 * @returns {Date|null} - Valid date or null
 */
const sanitizeDate = (input) => {
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  
  if (typeof input === 'string') {
    const date = new Date(input);
    return isNaN(date.getTime()) ? null : date;
  }
  
  return null;
};

/**
 * Comprehensive object sanitization
 * @param {object} obj - Object to sanitize
 * @param {object} schema - Sanitization schema
 * @returns {object} - Sanitized object
 */
const sanitizeObject = (obj, schema) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }
  
  const sanitized = {};
  
  for (const [key, config] of Object.entries(schema)) {
    const value = obj[key];
    
    if (value === undefined || value === null) {
      if (config.required) {
        throw new Error(`Required field ${key} is missing`);
      }
      continue;
    }
    
    switch (config.type) {
      case 'string':
        sanitized[key] = sanitizeText(value, config.maxLength);
        break;
      case 'email':
        sanitized[key] = sanitizeEmail(value);
        break;
      case 'number':
        sanitized[key] = sanitizeNumber(value, config.options);
        break;
      case 'boolean':
        sanitized[key] = sanitizeBoolean(value);
        break;
      case 'date':
        sanitized[key] = sanitizeDate(value);
        break;
      case 'objectId':
        sanitized[key] = sanitizeObjectId(value);
        break;
      case 'url':
        sanitized[key] = sanitizeUrl(value);
        break;
      default:
        sanitized[key] = sanitizeHtml(String(value));
    }
    
    if (sanitized[key] === null && config.required) {
      throw new Error(`Invalid value for required field ${key}`);
    }
  }
  
  return sanitized;
};

module.exports = {
  sanitizeHtml,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeObjectId,
  sanitizeUrl,
  sanitizeFilename,
  sanitizePhone,
  sanitizeText,
  sanitizeBoolean,
  sanitizeDate,
  sanitizeObject
};
