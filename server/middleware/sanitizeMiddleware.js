const xss = require('xss');
const validator = require('validator');
const {logMessage} = require('./Logger');

// XSS sanitization options
const xssOptions = {
  whiteList: {
    'p': [],
    'br': [],
    'strong': [],
    'em': [],
    'u': [],
    'ol': [],
    'ul': [],
    'li': [],
    'h1': [],
    'h2': [],
    'h3': [],
    'h4': [],
    'h5': [],
    'h6': []
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed']
};



/**
 * Sanitizes input by trimming whitespace and stripping dangerous HTML
 * @param {Object} options - Configuration options
 * @param {string[]} options.allowHtmlFields - Array of field names where HTML is allowed
 */
const sanitizeInput = ({ allowHtmlFields = [] } = {}) => {
  return (req, res, next) => {
    try {
      if (req.body) {
        // Deep clone to avoid modifying the original
        const sanitized = JSON.parse(JSON.stringify(req.body));
        
        // Process all fields
        Object.keys(sanitized).forEach(field => {
          if (typeof sanitized[field] === 'string') {
            // Trim whitespace
            sanitized[field] = sanitized[field].trim();
            
            // Apply XSS sanitization
            if (allowHtmlFields.includes(field)) {
              sanitized[field] = xss(sanitized[field], xssOptions);
            } else {
              sanitized[field] = xss(sanitized[field], { whiteList: {} }); // Strip all HTML
            }
            
            // Special handling for email fields
            if (field === 'email' && validator.isEmail(sanitized[field])) {
              sanitized[field] = validator.normalizeEmail(sanitized[field], {
                gmail_remove_dots: false,
                gmail_remove_subaddress: false,
                outlookdotcom_remove_subaddress: false,
                yahoo_remove_subaddress: false,
                icloud_remove_subaddress: false
              }) || sanitized[field];
            }
          }
        });
        
        req.body = sanitized;
      }
      next();
    } catch (error) {
      logMessage(`Error sanitizing input: ${error.message}\t ${req.body}`, 'security.log');
      next(error);
    }
  };
};

module.exports = {
  sanitizeInput
};