// routes/refundRoutes.js
/**
 * Refund Request Routes
 * 
 * Handles routing for refund requests from students and instructors
 * - Student course refund requests
 * - Instructor admin fee refund requests
 * - Admin approval/rejection workflow
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  createStudentRefund,
  getStudentRefunds,
  createInstructorRefund,
  getInstructorRefunds,
  getPendingRefunds,
  getAllRefunds,
  getRefundStats,
  getRefundDetails,
  cancelRefund,
  approveRefund,
  rejectRefund
} = require('../controllers/refundController');
const {authorize} = require('../middleware/authMiddleware');
const upload  = require('../middleware/upload');

// Rate limiting for refund operations
const rateLimit = require('express-rate-limit');

const refundLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many refund requests, please try again later'
  }
});

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    success: false,
    message: 'Too many admin requests, please try again later'
  }
});

/**
 * 🎓 STUDENT REFUND ROUTES
 */

// Create student course refund request
router.post('/student/create', 
  protect, 
  authorize(['student', 'admin']),
  refundLimiter,
  createStudentRefund
);

// Get student refund requests
router.get('/student/my-refunds', 
  protect, 
  authorize(['student', 'admin']),
  getStudentRefunds
);

/**
 * 👨‍🏫 INSTRUCTOR REFUND ROUTES
 */

// Create instructor refund request with optional supporting documents
router.post('/instructor/admin-fee-refund', 
  protect, 
  authorize(['instructor', 'admin']),
  refundLimiter,
  upload.array('supportingDocuments', 5),
  createInstructorRefund
);

// Get instructor refund requests
router.get('/instructor/my-refunds', 
  protect, 
  authorize(['instructor', 'admin']),
  getInstructorRefunds
);

/**
 * 👨‍💼 ADMIN REFUND MANAGEMENT ROUTES
 */
router.get('/admin/pending', 
  protect, 
  authorize(['admin']),
  adminLimiter,
  getPendingRefunds
);

// Approve refund request (Admin only) - with optional receipt upload
router.patch('/admin/:refundId/approve', 
  protect, 
  authorize(['admin']),
  adminLimiter,
  upload.single('receipt'), // Optional file upload for gift card receipt
  approveRefund
);

// Reject refund request (Admin only)
router.patch('/admin/:refundId/reject', 
  protect, 
  authorize(['admin']),
  adminLimiter,
  rejectRefund
);

// Get all refund requests (Admin only)
router.get('/admin/all', 
  protect, 
  authorize(['admin']),
  adminLimiter,
  getAllRefunds
);

// Get refund statistics (Admin only)
router.get('/admin/stats', 
  protect, 
  authorize(['admin']),
  adminLimiter,
  getRefundStats
);

// Get refund details by ID
router.get('/:refundId', 
  protect, 
  authorize(['student', 'instructor', 'admin']),
  getRefundDetails
);

// Cancel refund request
router.patch('/:refundId/cancel', 
  protect, 
  authorize(['student', 'instructor', 'admin']),
  cancelRefund
);

module.exports = router;
