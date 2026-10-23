const rateLimit = require('express-rate-limit');

/**
 * Advanced Rate Limiting System for Mentora
 * Categorized by operation type and sensitivity level
 */

// ================================
// READ OPERATIONS (GET Requests)
// ================================

// General content browsing - most permissive
const generalReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    retryAfter: 15 * 60 // 15 minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `user_${req.user._id}` : req.ip;
  }
});

// API data fetching - moderate limits
const apiReadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 300, // 300 requests per window
  message: {
    success: false,
    message: 'API rate limit exceeded. Please wait before making more requests.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `api_read_${req.user._id}` : `api_read_${req.ip}`;
  }
});

// Video streaming - special limits for bandwidth management
const videoStreamLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 video requests per window
  message: {
    success: false,
    message: 'Video streaming rate limit exceeded. Please wait before requesting more videos.',
    retryAfter: 10 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `video_${req.user._id}` : `video_${req.ip}`;
  }
});

// ================================
// AUTHENTICATION OPERATIONS
// ================================

// Login attempts - strict limits for security
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use email if provided, otherwise IP
    return req.body?.email ? `login_${req.body.email}` : `login_${req.ip}`;
  },
  skipSuccessfulRequests: true // Don't count successful logins
});

// Registration attempts - moderate limits
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again in 1 hour.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email ? `register_${req.body.email}` : `register_${req.ip}`;
  }
});

// Password reset attempts
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in 1 hour.',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body?.email ? `reset_${req.body.email}` : `reset_${req.ip}`;
  }
});

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
// PAYMENT OPERATIONS
// ================================

// Payment processing - strict limits for security
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment attempts per window
  message: {
    success: false,
    message: 'Payment rate limit exceeded. Please wait before making another payment.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `payment_${req.user._id}` : `payment_${req.ip}`;
  }
});

// Billing operations - moderate limits
const billingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // 50 billing requests per window
  message: {
    success: false,
    message: 'Billing rate limit exceeded. Please wait before making more billing requests.',
    retryAfter: 10 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `billing_${req.user._id}` : `billing_${req.ip}`;
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

// ================================
// ADMIN OPERATIONS
// ================================

// Admin operations - higher limits for admin users
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 admin requests per window
  message: {
    success: false,
    message: 'Admin rate limit exceeded. Please wait before making more requests.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `admin_${req.user._id}` : `admin_${req.ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for super admin
    return req.user && req.user.role === 'super_admin';
  }
});

// ================================
// SEARCH & FILTERING
// ================================

// Search operations - moderate limits
const searchLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // 100 search requests per window
  message: {
    success: false,
    message: 'Search rate limit exceeded. Please wait before making more searches.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `search_${req.user._id}` : `search_${req.ip}`;
  }
});

// ================================
// WEBHOOK OPERATIONS
// ================================

// Webhook processing - strict limits for security
const webhookLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 webhook requests per window
  message: {
    success: false,
    message: 'Webhook rate limit exceeded.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use webhook source if available
    return req.headers['x-webhook-source'] || req.ip;
  }
});

// ================================
// EXPORT ALL LIMITERS
// ================================

module.exports = {
  // Read operations
  generalReadLimiter,
  apiReadLimiter,
  videoStreamLimiter,
  
  // Authentication
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  
  // Content creation
  courseCreationLimiter,
  courseUpdateLimiter,
  courseEnrollmentLimiter,
  lessonCreationLimiter,
  
  // Financial operations
  paymentLimiter,
  billingLimiter,
  
  // File operations
  fileUploadLimiter,
  videoUploadLimiter,
  
  // Communication
  messagingLimiter,
  notificationLimiter,
  
  // Admin operations
  adminLimiter,
  
  // Search operations
  searchLimiter,
  
  // Webhook operations
  webhookLimiter
};
