const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  createPayment,
  getStudentPayments,
  deletePayment,
  updatePayment,
  getPaymentStats,
  getPaymentReports,
  getPaymentBreakdown,
  initiatePayment,
  verifyPayment,
  handleDirectTransfer,
  approveDirectTransferPayment,
  getAllPayments,
  getUserPayments,
  getUserBills,
  getUserPaymentsAndBills,
  getPendingDirectTransfers,
  // new instructor endpoints
  getInstructorPendingTransfers,
  instructorApproveDirectTransfer,
  // new billing endpoints
  initiateCreditPayment,
  getUserBillingSummary,
  processAnnualFeesEndpoint,
  createCreditPaymentMiddleware,
  checkPaymentStatus,
  getPaymentReceipt
  // processAdminFeePayment,
  // uploadAdminFeeReceipt
} = require("../controllers/paymentController");
const { protect, admin } = require("../middleware/authMiddleware");
const {
  validatePaymentInitiation,
  validateDirectTransfer,
  validatePaymentApproval,
  validateLegacyPaymentCreation,
  validatePaymentUpdate,
  validatePaymentQuery,
  validateObjectIdParam
} = require("../middleware/paymentValidation");
// Import specific rate limiters
const {
  paymentLimiter,
  billingLimiter,
  apiReadLimiter,
  adminLimiter,
  fileUploadLimiter
} = require("../middleware/advancedRateLimit");
const { paymentErrorHandler, logPaymentOperation } = require("../middleware/paymentErrorHandler");
const { paymentCSRFProtection, setCSRFToken, getCSRFToken } = require("../middleware/csrfProtection");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs for receipts
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed for receipts'), false);
    }
  }
});

// CSRF token endpoint
router.get("/csrf-token", protect, getCSRFToken);

router.post("/initiate", protect, paymentCSRFProtection, logPaymentOperation('initiate'), paymentLimiter, validatePaymentInitiation, initiatePayment);
// Removed card/PayPal flows: keep backward-compatible 410 responses
const gonePayment = (req, res) => res.status(410).json({
  success: false,
  message: "Card/PayPal payment is not available. Please contact your instructor.",
});
router.post("/stripe/confirm", protect, gonePayment);
router.post("/paypal/confirm", protect, gonePayment);
router.post("/:id/check-stripe-status", protect, gonePayment);
router.get("/debug/pending-stripe", protect, admin, gonePayment);
router.post('/direct-transfer', protect, upload.single('receipt'), handleDirectTransfer);

router.post('/:id/approve', protect, admin, paymentCSRFProtection, logPaymentOperation('admin_approve'), adminLimiter, validatePaymentApproval, approveDirectTransferPayment);

// User-specific routes with rate limiting
router.get("/my-payments", protect, apiReadLimiter, getUserPayments);
router.get("/my-bills", protect, billingLimiter, getUserBills);
router.get("/user/bills", protect, billingLimiter, getUserPaymentsAndBills);
// New billing system routes
router.post("/credits/initiate", protect, createCreditPaymentMiddleware(), paymentCSRFProtection, logPaymentOperation('credit_initiate'), paymentLimiter, initiateCreditPayment);
router.get("/billing-summary", protect, billingLimiter, getUserBillingSummary);

// Admin-specific routes with rate limiting
router.get("/admin/pending-transfers", protect, admin, adminLimiter, getPendingDirectTransfers);
// Instructor-specific
router.get("/instructor/pending-transfers", protect, apiReadLimiter, getInstructorPendingTransfers);
router.post("/:id/instructor-approve", protect, logPaymentOperation('instructor_approve'), paymentLimiter, validatePaymentApproval, instructorApproveDirectTransfer);

// Legacy admin routes with validation and rate limiting
router
  .route("/")
  .post(protect, admin, adminLimiter, validateLegacyPaymentCreation, createPayment)
  .get(protect, admin, adminLimiter, validatePaymentQuery, getAllPayments);

router.route("/student/:id").get(protect, apiReadLimiter, validateObjectIdParam, getStudentPayments);
router.route("/stats").get(protect, admin, adminLimiter, getPaymentStats);
router.route("/reports").get(protect, admin, adminLimiter, getPaymentReports);
router.route("/breakdown/:courseId").get(protect, apiReadLimiter, validateObjectIdParam, getPaymentBreakdown);

// Payment status check routes
router.post("/:id/check-status", protect, apiReadLimiter, validateObjectIdParam, checkPaymentStatus);

// Payment receipt route
router.get("/:id/receipt", protect, apiReadLimiter, validateObjectIdParam, getPaymentReceipt);

// Debug route for finding pending Stripe payments

// Admin billing management routes
router.post("/process-annual-fees", protect, admin, adminLimiter, processAnnualFeesEndpoint);

// Admin fee payment routes - temporarily disabled until functions are properly exported
// router.post("/admin-fee-payment", protect, paymentRateLimiters.write, processAdminFeePayment);
// router.post("/admin-fee-payment/:paymentId/receipt", protect, upload.single('receipt'), uploadAdminFeeReceipt);

router.route("/:id")
  .put(protect, admin, adminLimiter, validatePaymentUpdate, updatePayment)
  .delete(protect, admin, adminLimiter, validateObjectIdParam, deletePayment);

// Apply payment error handler to all routes
router.use(paymentErrorHandler);



module.exports = router;
