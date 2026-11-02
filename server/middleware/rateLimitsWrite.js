const rateLimit = require('express-rate-limit');

// ================================
// CONTENT CREATION OPERATIONS
// ================================

// Course creation - reasonable limits for instructors
const courseCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 course creations per hour (very generous)
  message: {
    success: false,
    message: 'Course creation rate limit exceeded. Please wait before creating more courses.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `course_create_${req.user._id}` : `course_create_${req.ip}`;
  }
});

// Course update/edit - very generous limits
const courseUpdateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 course updates per 15 minutes
  message: {
    success: false,
    message: 'Course update rate limit exceeded. Please wait before making more changes.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `course_update_${req.user._id}` : `course_update_${req.ip}`;
  }
});

// Course enrollment - separate limiter for enrollments
const courseEnrollmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 enrollments per 15 minutes
  message: {
    success: false,
    message: 'Enrollment rate limit exceeded. Please wait before enrolling in more courses.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `course_enroll_${req.user._id}` : `course_enroll_${req.ip}`;
  }
});

// Lesson creation - generous limits for course building
const lessonCreationLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 100, // 100 lesson operations per 30 minutes
  message: {
    success: false,
    message: 'Lesson creation rate limit exceeded. Please wait before creating more lessons.',
    retryAfter: 30 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `lesson_create_${req.user._id}` : `lesson_create_${req.ip}`;
  }
});


// ================================
// FILE UPLOAD OPERATIONS
// ================================

// File uploads - strict limits due to bandwidth
const fileUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 file uploads per hour
  message: {
    success: false,
    message: 'File upload rate limit exceeded. Please wait before uploading more files.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `upload_${req.user._id}` : `upload_${req.ip}`;
  }
});

// Video uploads - very strict limits
const videoUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 video uploads per hour
  message: {
    success: false,
    message: 'Video upload rate limit exceeded. Please wait before uploading more videos.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `video_upload_${req.user._id}` : `video_upload_${req.ip}`;
  }
});


// ================================
// MESSAGING & COMMUNICATION
// ================================

// Message sending - moderate limits
const messagingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 messages per window
  message: {
    success: false,
    message: 'Messaging rate limit exceeded. Please wait before sending more messages.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `message_${req.user._id}` : `message_${req.ip}`;
  }
});

// Notification operations
const notificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 notification requests per window
  message: {
    success: false,
    message: 'Notification rate limit exceeded. Please wait before making more requests.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `notification_${req.user._id}` : `notification_${req.ip}`;
  }
});


module.exports = {
  courseCreationLimiter,
  courseUpdateLimiter,
  courseEnrollmentLimiter,
  lessonCreationLimiter,
  fileUploadLimiter,
  videoUploadLimiter,
  messagingLimiter,
  notificationLimiter
};
