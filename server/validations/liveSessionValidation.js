/**
 * Live Session Validation Middleware
 * 
 * Provides validation for live session-related requests using express-validator
 */

const { body, validationResult } = require("express-validator");

/**
 * Validation rules for creating a live session
 */
const validateLiveSession = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
    .withMessage("Title contains invalid characters"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),

  body("courseId")
    .isMongoId()
    .withMessage("Invalid course ID format"),

  body("scheduledDate")
    .isISO8601()
    .withMessage("Invalid date format. Use ISO 8601 format")
    .custom((value) => {
      const scheduledDate = new Date(value);
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      
      if (scheduledDate <= oneHourFromNow) {
        throw new Error("Session must be scheduled at least 1 hour in advance");
      }
      
      // Don't allow scheduling more than 1 year in advance
      const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      if (scheduledDate > oneYearFromNow) {
        throw new Error("Session cannot be scheduled more than 1 year in advance");
      }
      
      return true;
    }),

  body("duration")
    .isInt({ min: 15, max: 480 })
    .withMessage("Duration must be between 15 and 480 minutes")
    .custom((value) => {
      if (value % 15 !== 0) {
        throw new Error("Duration must be in 15-minute increments");
      }
      return true;
    }),

  body("sessionType")
    .optional()
    .isIn(["lecture", "workshop", "qa", "review", "exam"])
    .withMessage("Invalid session type"),

  body("maxParticipants")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("Maximum participants must be between 1 and 500"),

  body("instructorNotes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Instructor notes cannot exceed 2000 characters"),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

/**
 * Validation rules for updating a live session
 */
const validateSessionUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
    .withMessage("Title contains invalid characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),

  body("scheduledDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format. Use ISO 8601 format")
    .custom((value) => {
      const scheduledDate = new Date(value);
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
      
      if (scheduledDate <= oneHourFromNow) {
        throw new Error("Session must be scheduled at least 1 hour in advance");
      }
      
      const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      if (scheduledDate > oneYearFromNow) {
        throw new Error("Session cannot be scheduled more than 1 year in advance");
      }
      
      return true;
    }),

  body("duration")
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage("Duration must be between 15 and 480 minutes")
    .custom((value) => {
      if (value % 15 !== 0) {
        throw new Error("Duration must be in 15-minute increments");
      }
      return true;
    }),

  body("sessionType")
    .optional()
    .isIn(["lecture", "workshop", "qa", "review", "exam"])
    .withMessage("Invalid session type"),

  body("maxParticipants")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("Maximum participants must be between 1 and 500"),

  body("instructorNotes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Instructor notes cannot exceed 2000 characters"),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

/**
 * Validation rules for uploading session recording
 */
const validateRecording = [
  body("recordingUrl")
    .isURL({ protocols: ["http", "https"] })
    .withMessage("Recording URL must be a valid HTTP/HTTPS URL"),

  body("recordingPassword")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Recording password cannot exceed 20 characters"),

  body("isRecordingPublic")
    .optional()
    .isBoolean()
    .withMessage("isRecordingPublic must be a boolean value"),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

/**
 * Validation rules for session ID parameter
 */
const validateSessionId = [
  body("sessionId")
    .isMongoId()
    .withMessage("Invalid session ID format"),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateLiveSession,
  validateSessionUpdate,
  validateRecording,
  validateSessionId
};
