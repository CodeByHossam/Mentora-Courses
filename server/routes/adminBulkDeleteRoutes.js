/**
 * Admin Bulk Deletion Routes
 *
 * Secure routes for bulk deletion operations with proper authentication,
 * authorization, and rate limiting to prevent abuse.
 */

const express = require("express");
const router = express.Router();

// Middleware
const { protect, authorize } = require("../middleware/authMiddleware");
const rateLimit = require("express-rate-limit");

// Controllers
const {
  getDeletionStatistics,
  bulkDeleteComment,
  bulkDeleteTests,
  bulkDeleteNotifications,
  bulkDeleteMessages,
  bulkDeleteLiveSessions,
  bulkDeleteCertificates,
  bulkDeleteEnrollmentRequests,
  protectedModelDeletion,
  bulkDeleteAllNonCritical,
  // Sensitive deletions
  bulkDeletePayments,
  bulkDeleteBillingTransactions,
  bulkDeleteGiftCards,
  bulkDeleteAdminFeePayments,
} = require("../controllers/adminBulkDeleteController");

// Rate limiting for deletion operations
const deletionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each admin to 10 deletion operations per windowMs
  message: {
    success: false,
    message:
      "Too many deletion requests. Please wait 15 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for nuclear option
const nuclearRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1, // Only 1 nuclear deletion per hour
  message: {
    success: false,
    message: "Nuclear deletion can only be performed once per hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   GET /api/admin/bulk-delete/statistics
 * @desc    Get deletion statistics for all models
 * @access  Private (Admin only)
 */
router.get("/statistics", protect, authorize(["admin"]), getDeletionStatistics);

/**
 * @route   DELETE /api/admin/bulk-delete/Comment
 * @desc    Bulk delete all Comment
 * @access  Private (Admin only)
 */
router.delete(
  "/Comment",
  protect,
  authorize(["admin"]),
  deletionRateLimit,
  bulkDeleteComment
);

/**
 * @route   DELETE /api/admin/bulk-delete/tests
 * @desc    Bulk delete all tests and grades
 * @access  Private (Admin only)
 */
router.delete(
  "/tests",
  protect,
  authorize(["admin"]),
  deletionRateLimit,
  bulkDeleteTests
);

/**
 * @route   DELETE /api/admin/bulk-delete/notifications
 * @desc    Bulk delete all notifications
 * @access  Private (Admin only)
 */
router.delete(
  "/notifications",
  protect,
  authorize(["admin"]),
  deletionRateLimit,
  bulkDeleteNotifications
);

/**
 * @route   DELETE /api/admin/bulk-delete/messages
 * @desc    Bulk delete all messages
 * @access  Private (Admin only)
 */
router.delete(
  "/messages",
  protect,
  authorize(["admin"]),
  deletionRateLimit,
  bulkDeleteMessages
);

/**
 * @route   DELETE /api/admin/bulk-delete/live-sessions
 * @desc    Bulk delete live sessions (completed by default)
 * @access  Private (Admin only)
 */
router.delete(
  "/live-sessions",
  protect,
  authorize(["admin"]),
  deletionRateLimit,
  bulkDeleteLiveSessions
);

/**
 * @route   DELETE /api/admin/bulk-delete/certificates
 * @desc    Bulk delete all certificates
 * @access  Private (Admin only)
 */
router.delete(
  "/certificates",
  protect,
  authorize(["admin"]),
  deletionRateLimit,
  bulkDeleteCertificates
);

/**
 * @route   DELETE /api/admin/bulk-delete/enrollment-requests
 * @desc    Bulk delete enrollment requests (processed by default)
 * @access  Private (Admin only)
 */
router.delete(
  "/enrollment-requests",
  protect,
  authorize(["admin"]),
  deletionRateLimit,
  bulkDeleteEnrollmentRequests
);

/**
 * @route   DELETE /api/admin/bulk-delete/payments
 * @desc    Bulk delete all payment records (sensitive)
 * @access  Private (Admin only)
 */
router.delete(
  "/payments",
  protect,
  authorize(["admin"]),
  deletionRateLimit,
  bulkDeletePayments
);

/**
 * @route   DELETE /api/admin/bulk-delete/billing-transactions
 * @desc    Bulk delete all billing transactions (sensitive)
 * @access  Private (Admin only)
 */
router.delete(
  "/billing-transactions",
  protect,
  authorize(["admin"]),
  deletionRateLimit,
  bulkDeleteBillingTransactions
);

/**
 * @route   DELETE /api/admin/bulk-delete/gift-cards
 * @desc    Bulk delete all gift cards (sensitive)
 * @access  Private (Admin only)
 */
router.delete(
  "/gift-cards",
  protect,
  authorize(["admin"]),
  deletionRateLimit,
  bulkDeleteGiftCards
);

/**
 * @route   DELETE /api/admin/bulk-delete/admin-fee-payments
 * @desc    Bulk delete all admin fee payment records (sensitive)
 * @access  Private (Admin only)
 */
router.delete(
  "/admin-fee-payments",
  protect,
  authorize(["admin"]),
  deletionRateLimit,
  bulkDeleteAdminFeePayments
);

/**
 * @route   DELETE /api/admin/bulk-delete/protected/:modelType
 * @desc    Attempt to delete protected models (returns error)
 * @access  Private (Admin only)
 */
router.delete(
  "/protected/:modelType",
  protect,
  authorize(["admin"]),
  protectedModelDeletion
);

/**
 * @route   DELETE /api/admin/bulk-delete/nuclear
 * @desc    Nuclear option - delete all non-critical data
 * @access  Private (Admin only)
 */
router.delete(
  "/nuclear",
  protect,
  authorize(["admin"]),
  nuclearRateLimit,
  bulkDeleteAllNonCritical
);

module.exports = router;
