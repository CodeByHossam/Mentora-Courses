/**
 * Enrollment Request Routes
 * 
 * Handles all enrollment request endpoints including admin notes functionality.
 * Students can create requests, admins can manage them and add notes.
 * 
 * Route Categories:
 * - Student routes: Create and view own requests
 * - Admin routes: Manage all requests, add/delete notes, approve/reject
 * 
 * Security Features:
 * - Role-based access control (student, admin)
 * - Request validation and sanitization
 * - Admin note management with attribution
 * 
 * @author Mentora Team
 * @version 2.0.0
 */

const express = require("express");
const router = express.Router();

// Import enrollment request controller functions
const {
  createEnrollmentRequest,    // Create new enrollment request
  getEnrollmentRequests,      // Get all requests (admin)
  getEnrollmentRequest,       // Get single request with notes
  updateEnrollmentRequest,    // Update request status
  getUserEnrollmentRequests,  // Get user's own requests
  getInstructorEnrollmentRequests, // Get instructor's course requests
  deleteEnrollmentRequest,    // Delete request
  addAdminNote,              // Add admin note to request
  editAdminNote,             // Edit admin note
  deleteAdminNote,           // Delete admin note
  getReceiptUrl,             // Generate fresh signed URL for receipt
} = require("../controllers/enrollmentRequestController");

// Import authentication middleware
const { protect, authorize } = require("../middleware/authMiddleware");

// Import upload middleware for bank transfer proof
const upload = require("../middleware/upload");

// Import rate limiters
const {
  courseEnrollmentLimiter,
  apiReadLimiter,
  adminLimiter,
  messagingLimiter
} = require("../middleware/advancedRateLimit");

/* ========================================================================
   STUDENT ROUTES - Student access only
   ======================================================================== */

/**
 * @route   POST /api/enrollment-requests
 * @desc    Create new enrollment request
 * @access  Private (Student only)
 * @body    { courseId, paymentMethod?, transferredAmount?, bankName?, referenceNumber?, transferDate? }
 * @file    bankTransferProof (optional - required if paymentMethod is direct_transfer)
 * @returns { success, message, data: enrollmentRequest }
 * 
 * Features:
 * - Creates enrollment request for specified course
 * - Supports direct bank transfer with proof upload
 * - Prevents duplicate requests for same course
 * - Checks if already enrolled in course
 */
router.post("/", protect, authorize(["student"]), courseEnrollmentLimiter, upload.single('bankTransferProof'), createEnrollmentRequest);

/**
 * @route   GET /api/enrollment-requests/user
 * @desc    Get current user's enrollment requests
 * @access  Private (Student only)
 * @returns { success, message, data: enrollmentRequests[] }
 * 
 * Features:
 * - Returns user's own enrollment requests
 * - Includes course information
 * - Sorted by creation date (newest first)
 */
router.get("/user", protect, authorize(["student"]), apiReadLimiter, getUserEnrollmentRequests);

/**
 * @route   GET /api/enrollment-requests/instructor
 * @desc    Get instructor's course enrollment requests
 * @access  Private (Instructor only)
 * @returns { success, message, data: enrollmentRequests[] }
 * 
 * Features:
 * - Returns enrollment requests for instructor's courses
 * - Includes student and course information
 * - Includes admin notes
 * - Sorted by creation date (newest first)
 */
router.get("/instructor", protect, authorize(["instructor"]), apiReadLimiter, getInstructorEnrollmentRequests);

/* ========================================================================
   ADMIN ROUTES - Admin access only
   ======================================================================== */

/**
 * @route   GET /api/enrollment-requests
 * @desc    Get all enrollment requests
 * @access  Private (Admin only)
 * @returns { success, message, data: enrollmentRequests[] }
 * 
 * Features:
 * - Returns all enrollment requests with populated data
 * - Includes student, course, and admin notes information
 * - Sorted by creation date (newest first)
 */
router.get("/", protect, authorize(["admin"]), adminLimiter, getEnrollmentRequests);

/**
 * @route   GET /api/enrollment-requests/:id
 * @desc    Get single enrollment request with all notes
 * @access  Private (Admin only)
 * @params  id - Enrollment request ID
 * @returns { success, message, data: enrollmentRequest }
 * 
 * Features:
 * - Returns detailed enrollment request information
 * - Includes all admin notes with timestamps and admin info
 * - Populated student and course data
 */
router.get("/:id", protect, authorize(["admin"]), adminLimiter, getEnrollmentRequest);

/**
 * @route   PATCH /api/enrollment-requests/:id
 * @desc    Update enrollment request status
 * @access  Private (Admin and Instructor)
 * @params  id - Enrollment request ID
 * @body    { status, adminNote? }
 * @returns { success, message, data: enrollmentRequest }
 * 
 * Features:
 * - Updates request status (pending, approved, rejected)
 * - Handles course enrollment when approved
 * - Updates user's enrolled courses
 * - Optional legacy admin note field
 * - Instructors can only update requests for their own courses
 */
router.patch("/:id", protect, authorize(["admin", "instructor"]), adminLimiter, updateEnrollmentRequest);

/**
 * @route   DELETE /api/enrollment-requests/:id
 * @desc    Delete enrollment request
 * @access  Private (Admin only)
 * @params  id - Enrollment request ID
 * @returns { success, message }
 * 
 * Features:
 * - Permanently deletes enrollment request
 * - Admin-only access for cleanup
 */
router.delete("/:id", protect, authorize(["admin"]), adminLimiter, deleteEnrollmentRequest);

/* ========================================================================
   ADMIN NOTES ROUTES - Admin note management
   ======================================================================== */

/**
 * @route   POST /api/enrollment-requests/:id/notes
 * @desc    Add admin note to enrollment request
 * @access  Private (Admin and Instructor)
 * @params  id - Enrollment request ID
 * @body    { note }
 * @returns { success, message, data: enrollmentRequest }
 * 
 * Features:
 * - Adds note with admin/instructor attribution and timestamp
 * - Can be added regardless of request status
 * - Note content validation (max 1000 characters)
 * - Returns updated request with all notes
 * - Instructors can only add notes to their own course requests
 */
router.post("/:id/notes", protect, authorize(["admin", "instructor"]), messagingLimiter, addAdminNote);

/**
 * @route   PUT /api/enrollment-requests/:id/notes/:noteId
 * @desc    Edit specific admin note
 * @access  Private (Admin and Instructor)
 * @params  id - Enrollment request ID
 * @params  noteId - Note ID to edit
 * @body    { note }
 * @returns { success, message, data: enrollmentRequest }
 * 
 * Features:
 * - Edits specific admin note content
 * - Security check: users can only edit their own notes
 * - Note validation (max 1000 characters)
 * - Returns updated request with edited note
 * - Instructors can only edit notes on their own course requests
 */
router.put("/:id/notes/:noteId", protect, authorize(["admin", "instructor"]), messagingLimiter, editAdminNote);

/**
 * @route   DELETE /api/enrollment-requests/:id/notes/:noteId
 * @desc    Delete specific admin note
 * @access  Private (Admin and Instructor)
 * @params  id - Enrollment request ID
 * @params  noteId - Note ID to delete
 * @returns { success, message, data: enrollmentRequest }
 * 
 * Features:
 * - Deletes specific admin note
 * - Security check: users can only delete their own notes
 * - Returns updated request without deleted note
 * - Instructors can only delete notes on their own course requests
 */
router.delete("/:id/notes/:noteId", protect, authorize(["admin", "instructor"]), messagingLimiter, deleteAdminNote);

/**
 * @route   GET /api/enrollment-requests/:id/receipt
 * @desc    Generate fresh signed URL for bank transfer receipt
 * @access  Private (Admin and Instructor)
 * @params  id - Enrollment request ID
 * @returns { success, message, data: { url, fileName, expiresIn } }
 * 
 * Features:
 * - Generates fresh signed URL for S3 receipt access
 * - 1 hour expiry time for security
 * - Instructors can only access receipts for their own course requests
 * - Handles expired URL regeneration
 */
router.get("/:id/receipt", protect, authorize(["admin", "instructor"]), apiReadLimiter, getReceiptUrl);

module.exports = router;
