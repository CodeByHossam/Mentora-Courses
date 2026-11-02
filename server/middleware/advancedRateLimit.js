const {
  generalReadLimiter,
  apiReadLimiter,
  videoStreamLimiter,
  searchLimiter,
} = require('./rateLimitsRead');
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
} = require('./rateLimitsAuth');
const {
  courseCreationLimiter,
  courseUpdateLimiter,
  courseEnrollmentLimiter,
  lessonCreationLimiter,
  fileUploadLimiter,
  videoUploadLimiter,
  messagingLimiter,
  notificationLimiter,
} = require('./rateLimitsWrite');
const {
  paymentLimiter,
  billingLimiter,
  adminLimiter,
  webhookLimiter,
} = require('./rateLimitsSensitive');

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
  webhookLimiter,
};
