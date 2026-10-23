// this is additional error handler of required

// // Removed responseHandler import - using direct JSON responses
// const logger = require('../config/logger');

// /**
//  * Centralized error handling middleware for consistent error responses
//  */

// /**
//  * Handle Joi validation errors
//  */
// const handleJoiError = (error) => {
//   const errors = {};
//   error.details.forEach(detail => {
//     const field = detail.path.join('.');
//     errors[field] = detail.message.replace(/"/g, '');
//   });
//   return { message: 'Validation failed', errors, statusCode: 400 };
// };

// /**
//  * Handle Mongoose validation errors
//  */
// const handleMongooseValidationError = (error) => {
//   const errors = {};
//   Object.keys(error.errors).forEach(key => {
//     errors[key] = error.errors[key].message;
//   });
//   return { message: 'Validation failed', errors, statusCode: 400 };
// };

// /**
//  * Handle Mongoose duplicate key errors
//  */
// const handleMongoDuplicateError = (error) => {
//   const field = Object.keys(error.keyValue)[0];
//   const value = error.keyValue[field];
//   const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
//   return { message, statusCode: 400 };
// };

// /**
//  * Handle Mongoose cast errors
//  */
// const handleMongoCastError = (error) => {
//   const message = `Invalid ${error.path}: ${error.value}`;
//   return { message, statusCode: 400 };
// };

// /**
//  * Handle JWT errors
//  */
// const handleJWTError = (error) => {
//   let message = 'Authentication failed';
//   if (error.name === 'TokenExpiredError') {
//     message = 'Token has expired';
//   } else if (error.name === 'JsonWebTokenError') {
//     message = 'Invalid token';
//   }
//   return { message, statusCode: 401 };
// };

// /**
//  * Handle Multer errors
//  */
// const handleMulterError = (error) => {
//   let message = 'File upload error';
//   let statusCode = 400;

//   switch (error.code) {
//     case 'LIMIT_FILE_SIZE':
//       message = 'File size too large';
//       break;
//     case 'LIMIT_FILE_COUNT':
//       message = 'Too many files';
//       break;
//     case 'LIMIT_UNEXPECTED_FILE':
//       message = 'Unexpected file field';
//       break;
//     case 'LIMIT_PART_COUNT':
//       message = 'Too many parts';
//       break;
//     case 'LIMIT_FIELD_KEY':
//       message = 'Field name too long';
//       break;
//     case 'LIMIT_FIELD_VALUE':
//       message = 'Field value too long';
//       break;
//     case 'LIMIT_FIELD_COUNT':
//       message = 'Too many fields';
//       break;
//     default:
//       message = error.message || 'File upload error';
//   }

//   return { message, statusCode };
// };

// /**
//  * Main error handling middleware
//  */
// const errorHandler = (error, req, res, next) => {
//   let { message, statusCode, errors } = error;

//   // Log error details
//   logger.error({
//     error: {
//       message: error.message,
//       stack: error.stack,
//       name: error.name
//     },
//     request: {
//       method: req.method,
//       url: req.url,
//       ip: req.ip,
//       userAgent: req.get('User-Agent')
//     },
//     user: req.user ? { id: req.user._id, email: req.user.email } : null
//   });

//   // Handle specific error types
//   if (error.name === 'ValidationError' && error.isJoi) {
//     ({ message, errors, statusCode } = handleJoiError(error));
//   } else if (error.name === 'ValidationError' && error.errors) {
//     ({ message, errors, statusCode } = handleMongooseValidationError(error));
//   } else if (error.code === 11000) {
//     ({ message, statusCode } = handleMongoDuplicateError(error));
//   } else if (error.name === 'CastError') {
//     ({ message, statusCode } = handleMongoCastError(error));
//   } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
//     ({ message, statusCode } = handleJWTError(error));
//   } else if (error.name === 'MulterError') {
//     ({ message, statusCode } = handleMulterError(error));
//   } else if (error.name === 'MongoNetworkError') {
//     message = 'Database connection error';
//     statusCode = 503;
//   } else if (error.name === 'MongoTimeoutError') {
//     message = 'Database operation timeout';
//     statusCode = 503;
//   }

//   // Default to 500 if no status code set
//   statusCode = statusCode || 500;
//   message = message || 'Internal Server Error';

//   // Send appropriate response
//   if (errors) {
//     return res.status(statusCode).json({
//       success: false,
//       message,
//       errors
//     });
//   } else {
//     return res.status(statusCode).json({
//       success: false,
//       message
//     });
//   }
// };

// /**
//  * Handle 404 errors for unmatched routes
//  */
// const notFoundHandler = (req, res, next) => {
//   const message = `Route ${req.originalUrl} not found`;
//   logger.warn({
//     message: 'Route not found',
//     request: {
//       method: req.method,
//       url: req.originalUrl,
//       ip: req.ip
//     }
//   });

//   return res.status(404).json({
//     success: false,
//     message
//   });
// };

// /**
//  * Handle async errors in routes
//  */
// const asyncErrorHandler = (fn) => (req, res, next) => {
//   Promise.resolve(fn(req, res, next)).catch(next);
// };

// /**
//  * Custom error class for application errors
//  */
// class AppError extends Error {
//   constructor(message, statusCode = 500, errors = null) {
//     super(message);
//     this.statusCode = statusCode;
//     this.errors = errors;
//     this.isOperational = true;

//     Error.captureStackTrace(this, this.constructor);
//   }
// }

// /**
//  * Create specific error types
//  */
// const createValidationError = (message, errors) => new AppError(message, 400, errors);
// const createNotFoundError = (resource = 'Resource') => new AppError(`${resource} not found`, 404);
// const createUnauthorizedError = (message = 'Unauthorized') => new AppError(message, 401);
// const createForbiddenError = (message = 'Forbidden') => new AppError(message, 403);
// const createConflictError = (message = 'Conflict') => new AppError(message, 409);
// const createRateLimitError = (message = 'Too many requests') => new AppError(message, 429);

// module.exports = {
//   errorHandler,
//   notFoundHandler,
//   asyncErrorHandler,
//   AppError,
//   createValidationError,
//   createNotFoundError,
//   createUnauthorizedError,
//   createForbiddenError,
//   createConflictError,
//   createRateLimitError
// };
