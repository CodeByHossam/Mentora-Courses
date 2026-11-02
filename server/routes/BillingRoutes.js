const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // Import upload middleware at the top
const {
  getBillingAccount,
  getAdminBillingAccount,

  payoutInstructorCommission,
  processInstructorPayout,
  getBillingTransactions,
  getCourseGiftCard,
  getGiftCardBalance,
  payWithGiftCard,
  claimGiftCard,
} = require("../controllers/billing");

const {
  getPendingDirectTransfers,
} = require("../controllers/payment");

const BillingTransaction = require("../models/BillingTransaction");

/**
 * Specialized Billing Routes
 *
 * Routes for the new specialized billing system with role-based accounts
 */

// Apply authentication to all routes
router.use(protect);

/**
 * @route   GET /api/specialized-billing/account
 * @desc    Get billing account based on user role
 * @access  Private (All authenticated users)
 */
router.get("/account", getBillingAccount);

/**
 * @route   GET /api/specialized-billing/summary
 * @desc    Get comprehensive billing summary
 * @access  Private (All authenticated users)
 */
// /summary route removed - no backing controller

/**
 * @route   GET /api/specialized-billing/admin/dashboard
 * @desc    Get admin financial dashboard
 * @access  Private (Admin only)
 */
// /admin/dashboard route removed - no backing controller

/**
 * @route   POST /api/specialized-billing/admin/payout/:instructorId
 * @desc    Payout instructor commissions
 * @access  Private (Admin only)
 */
router.post("/admin/payout/:instructorId", admin, payoutInstructorCommission);

/**
 * @route   POST /api/billing/admin/process-instructor-payout
 * @desc    Process instructor payout with receipt upload (new simplified system)
 * @access  Private (Admin only)
 */
router.post("/admin/process-instructor-payout", admin, upload.single("receipt"), processInstructorPayout);
/**
 * @route   GET /api/specialized-billing/admin/account
 * @desc    Get admin billing account and earnings
 * @access  Private (Admin only)
 */
router.get("/admin/account", admin, getAdminBillingAccount);

/**
 * @route   GET /api/billing/admin/pending-transfers
 * @desc    Get pending direct transfer payments for admin
 * @access  Private (Admin only)
 */
router.get("/admin/pending-transfers", admin, getPendingDirectTransfers);

/**
 * @route   GET /api/billing/transactions
 * @desc    Get billing transactions with pagination
 * @access  Private (All authenticated users)
 */
router.get("/transactions", getBillingTransactions);
/**
 * @route   POST /api/billing/process-course-payment
 * @desc    Process course payment with billing integration
 * @access  Private (Student/Instructor/Admin)
 */
// /process-course-payment route removed - no backing controller

/**
 * @route   POST /api/billing/admin-fee-payment
 * @desc    Submit admin fee payment with receipt upload
 * @access  Private (Students/Instructors)
 */
// /admin-fee-payment route removed - no backing controller

/**
 * @route   GET /api/billing/admin/pending-fee-payments
 * @desc    Get pending admin fee payments for approval
 * @access  Private (Admin only)
 */
// /admin/pending-fee-payments route removed - no backing controller

/**
 * @route   PUT /api/billing/admin/approve-fee-payment/:transactionId
 * @desc    Approve or reject admin fee payment
 * @access  Private (Admin only)
 */
// /admin/approve-fee-payment route removed - no backing controller

// ============================================================================
// 🎁 GIFT CARD ROUTES
// ============================================================================

/* Gift card routes removed

/**
 * @route   GET /api/billing/my-gift-cards
 * @desc    Get user's gift cards
 * @access  Private
 */
// /my-gift-cards route removed - no backing controller

/**
 * @route   GET /api/billing/course-gift-card/:courseId
 * @desc    Get user's gift card for specific course
 * @access  Private
 */
router.get("/course-gift-card/:courseId", protect, getCourseGiftCard);
/**
 * @route   GET /api/billing/gift-card-balance
 * @desc    Get user's total gift card balance (excluding course-specific cards)
 * @access  Private
 */
router.get("/gift-card-balance", protect, getGiftCardBalance);
/**
 * @route   POST /api/billing/pay-with-gift-card
 * @desc    Pay for course using gift card balance
 * @access  Private
 */
router.post("/pay-with-gift-card", protect, payWithGiftCard);
/**
 * @route   DELETE /api/billing/admin/gift-card/:id
 * @desc    Delete gift card (Admin only)
 * @access  Private (Admin only)
 */

/**
 * @route   POST /api/billing/claim-gift-card/:id
 * @desc    Claim gift card and add to pending commissions (Instructor only)
 * @access  Private
 */
router.post("/claim-gift-card/:id", protect, claimGiftCard);
/**
 * @route   GET /api/billing/admin/reconciliation
 * @desc    Get financial reconciliation report (Admin only)
 * @access  Private (Admin only)
 */
// /admin/reconciliation route removed - no backing controller

/**
 * @route   GET /api/billing/summary/admin
 * @desc    Simplified admin financial summary (Phase 1)
 * @access  Private (Admin only)
 */
router.get("/summary/admin", admin, async (req, res) => {
  const { getAdminFinancialSummary } = require("../controllers/billing");
  return getAdminFinancialSummary(req, res);
});

/**
 * @route   GET /api/billing/summary/student
 * @desc    Simplified student financial summary (Phase 1)
 * @access  Private
 */
router.get("/summary/student", async (req, res) => {
  const { getStudentFinancialSummary } = require("../controllers/billing");
  return getStudentFinancialSummary(req, res);
});

/**
 * @route   GET /api/billing/summary/instructor
 * @desc    Simplified instructor financial summary (Phase 1)
 * @access  Private
 */
router.get("/summary/instructor", async (req, res) => {
  const { getInstructorFinancialSummary } = require("../controllers/billing");
  return getInstructorFinancialSummary(req, res);
});

module.exports = router;
