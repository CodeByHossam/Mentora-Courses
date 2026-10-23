// routes/adminFeePaymentRoutes.js
/**
 * Admin Fee Payment Routes
 * 
 * Handles routing for instructor admin fee payments
 * - Instructor payment submissions with receipts
 * - Admin verification and approval workflow
 * - File upload handling for receipts
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');
const { 
  submitAdminFeePayment,
  getInstructorPayments,
  getOutstandingAdminFees,
  cancelAdminFeePayment,
  getPendingPayments,
  getAllAdminFeePayments,
  getAdminFeePaymentStats,
  verifyPayment,
  approvePayment,
  rejectPayment
} = require('../controllers/adminFeePaymentController');

// Rate limiting for payment operations
const rateLimit = require('express-rate-limit');

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 payment submissions per windowMs
  message: {
    success: false,
    message: 'Too many payment submissions, please try again later'
  }
});

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // limit each IP to 100 admin requests per windowMs
  message: {
    success: false,
    message: 'Too many admin requests, please try again later'
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs for receipts
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'), false);
    }
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file is allowed.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

/**
 * 👨‍🏫 INSTRUCTOR ADMIN FEE PAYMENT ROUTES
 */

// Submit admin fee payment with receipt
router.post('/instructor/submit', 
  protect, 
  authorize(['instructor']),
  paymentLimiter,
  upload.single('receipt'),
  handleMulterError,
  submitAdminFeePayment
);

// Get instructor's admin fee payments
router.get('/instructor/my-payments', 
  protect, 
  authorize(['instructor']),
  getInstructorPayments
);

// Get instructor's outstanding admin fees
router.get('/instructor/outstanding-fees', 
  protect, 
  authorize(['instructor']),
  getOutstandingAdminFees
);

// Cancel admin fee payment (only pending/under_review)
router.patch('/instructor/:paymentId/cancel', 
  protect, 
  authorize(['instructor']),
  cancelAdminFeePayment
);

/**
 * 👨‍💼 ADMIN MANAGEMENT ROUTES
 */

// Get all pending admin fee payments (Admin only)
router.get('/admin/pending', 
  protect, 
  authorize(['admin']),
  adminLimiter,
  (req, res, next) => {
    console.log('🔍 ADMIN FEE PAYMENT ROUTE HIT: /admin/pending');
    console.log('🔍 Full URL:', req.originalUrl);
    next();
  },
  getPendingPayments
);

// Get all admin fee payments (Admin only)
router.get('/admin/all', 
  protect, 
  authorize(['admin']),
  adminLimiter,
  getAllAdminFeePayments
);

// Get admin fee payment statistics (Admin only)
router.get('/admin/stats', 
  protect, 
  authorize(['admin']),
  adminLimiter,
  getAdminFeePaymentStats
);

// Verify admin fee payment (Admin only)
router.patch('/admin/:paymentId/verify', 
  protect, 
  authorize(['admin']),
  adminLimiter,
  verifyPayment
);

// Approve admin fee payment (Admin only)
router.patch('/admin/:paymentId/approve', 
  protect, 
  authorize(['admin']),
  adminLimiter,
  approvePayment
);

// Reject admin fee payment (Admin only)
router.patch('/admin/:paymentId/reject', 
  protect, 
  authorize(['admin']),
  adminLimiter,
  rejectPayment
);

module.exports = router;
