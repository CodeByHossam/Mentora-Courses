/**
 * Course Routes
 *
 * Handles all course-related endpoints including CRUD operations,
 * enrollment, ratings, and course management features.
 *
 * Route Categories:
 * - Public routes: Course browsing and statistics
 * - Protected routes: Course management, enrollment, ratings
 * - Admin routes: Course administration and status management
 *
 * Security Features:
 * - Role-based access control (admin, instructor, student)
 * - Input validation and sanitization
 * - File upload handling for course images
 * - Optional authentication for enhanced features
 *
 * @author Mentora Team
 * @version 1.0.0
 */

const express = require("express");
const router = express.Router();

// Import middleware for file uploads
const upload = require("../middleware/upload");

// Import course controller functions
const {
  getAllCourses, // Get all courses (including unpublished) - Admin only
  getCourses, // Get published courses with filtering/pagination
  getCourse, // Get single course details
  createCourse, // Create new course
  updateCourse, // Update existing course
  deleteCourse, // Delete course
  enrollInCourse, // Enroll user in course
  getCourseStats, // Get course statistics
  getInstructorCourses, // Get courses by instructor
  getEnrolledCourses, // Get user's enrolled courses
  rateCourse, // Rate a course
  likeCourse, // Like/unlike a course
  getCourseRatingInfo, // Get course rating information
  updateCourseStatus, // Update course status (published/draft)
  getCourseStudents, // Get enrolled students for a course
} = require("../controllers/courseController");

// Import authentication and validation middleware
const { protect, authorize } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const { sanitizeInput } = require("../middleware/sanitizeMiddleware");
const courseValidation = require("../validations/courseValidation");

// Import specific rate limiters
const {
  generalReadLimiter,
  apiReadLimiter,
  courseCreationLimiter,
  courseUpdateLimiter,
  courseEnrollmentLimiter,
  searchLimiter,
  adminLimiter,
  fileUploadLimiter,
} = require("../middleware/advancedRateLimit");

// Import course model for utility routes
const Course = require("../models/Course");

/* ========================================================================
   PUBLIC ROUTES - No authentication required
   ======================================================================== */

/**
 * @route   GET /api/courses/stats
 * @desc    Get course statistics (total courses, categories, etc.)
 * @access  Public
 * @returns { success, message, data: { totalCourses, totalInstructors, etc. } }
 *
 * Features:
 * - Returns platform-wide course statistics
 * - Used for dashboard and analytics
 */
router.get("/stats", apiReadLimiter, getCourseStats);

/**
 * @route   GET /api/courses
 * @desc    Get published courses with filtering and pagination
 * @access  Public
 * @query   { search?, category?, level?, sort?, limit?, page?, minPrice?, maxPrice?, instructorId? }
 * @returns { success, message, data: courses[], meta: pagination }
 *
 * Features:
 * - Search courses by title/description
 * - Filter by category, level, price range, instructor
 * - Sort by various criteria (newest, rating, price)
 * - Paginated results
 * - Only shows published courses to public
 */
router.get("/", searchLimiter, getCourses);

/* ========================================================================
   PROTECTED ROUTES - Authentication required
   ======================================================================== */

/**
 * @route   GET /api/courses/all-courses
 * @desc    Get all courses including unpublished ones
 * @access  Private (Admin only)
 * @headers Authorization: Bearer <token>
 * @returns { success, message, data: courses[] }
 *
 * Features:
 * - Admin-only access to all courses
 * - Includes draft and unpublished courses
 * - Used for course management dashboard
 */
router.get(
  "/all-courses",
  protect, // Require authentication
  authorize(["admin"]), // Admin access only
  adminLimiter, // Admin rate limiting
  getAllCourses
);

/**
 * @route   GET /api/courses/instructor/:instructorId
 * @desc    Get courses created by specific instructor
 * @access  Private (Instructor/Admin)
 * @headers Authorization: Bearer <token>
 * @params  instructorId - ID of the instructor
 * @returns { success, message, data: courses[] }
 *
 * Features:
 * - Get courses by instructor ID
 * - Instructors can view their own courses
 * - Admins can view any instructor's courses
 */
router.get(
  "/instructor/:instructorId",
  protect, // Require authentication
  authorize(["instructor", "admin"]), // Instructor or Admin access
  apiReadLimiter, // API read rate limiting
  getInstructorCourses
);

/**
 * @route   GET /api/courses/user/enrolled
 * @desc    Get courses user is enrolled in
 * @access  Private (Student/Admin)
 * @headers Authorization: Bearer <token>
 * @returns { success, message, data: courses[] }
 *
 * Features:
 * - Returns user's enrolled courses
 * - Includes enrollment progress
 * - Student and admin access
 */
router.get(
  "/user/enrolled",
  protect, // Require authentication
  authorize(["student", "admin"]), // Student or Admin access
  apiReadLimiter, // API read rate limiting
  getEnrolledCourses
);

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll user in a course
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @params  id - Course ID to enroll in
 * @returns { success, message, data: enrollment }
 *
 * Features:
 * - Enrolls authenticated user in course
 * - Checks course availability and prerequisites
 * - Prevents duplicate enrollments
 */
router.post("/:id/enroll", protect, courseEnrollmentLimiter, enrollInCourse);

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private (Admin/Instructor)
 * @headers Authorization: Bearer <token>
 * @body    { title, description, category, level, price, etc. }
 * @file    Optional course image upload
 * @returns { success, message, data: course }
 *
 * Features:
 * - Creates new course
 * - Uploads course image to Cloudinary
 * - Validates course data
 * - Sets creator as instructor
 */
router.post(
  "/",
  protect, // Require authentication
  authorize(["admin", "instructor"]), // Admin or Instructor access
  courseCreationLimiter, // Course creation rate limiting
  upload.single("imageFile"), // Handle image upload
  sanitizeInput({ allowHtmlFields: ["description"] }),
  validate(courseValidation.create), // Validate input
  createCourse // Execute creation logic
);

/**
 * @route   PUT /api/courses/:id
 * @desc    Update an existing course
 * @access  Private (Admin/Instructor - own courses only)
 * @headers Authorization: Bearer <token>
 * @params  id - Course ID to update
 * @body    { title?, description?, category?, level?, price?, etc. }
 * @returns { success, message, data: course }
 *
 * Features:
 * - Updates course information
 * - Validates ownership (instructors can only edit their courses)
 * - Admins can edit any course
 */
router.put(
  "/:id",
  protect, // Require authentication
  authorize(["admin", "instructor"]), // Admin or Instructor access
  courseUpdateLimiter, // Course update rate limiting
  sanitizeInput({ allowHtmlFields: ["description"] }),
  validate(courseValidation.update), // Validate input
  updateCourse // Execute update logic
);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete a course
 * @access  Private (Admin/Instructor - own courses only)
 * @headers Authorization: Bearer <token>
 * @params  id - Course ID to delete
 * @returns { success, message }
 *
 * Features:
 * - Soft delete course (marks as deleted)
 * - Validates ownership
 * - Handles cleanup of related data
 */
router.delete(
  "/:id",
  protect, // Require authentication
  authorize(["admin", "instructor"]), // Admin or Instructor access
  deleteCourse // Execute deletion logic
);

/**
 * @route   PATCH /api/courses/:id/status
 * @desc    Update course publication status
 * @access  Private (Admin/Instructor - own courses only)
 * @headers Authorization: Bearer <token>
 * @params  id - Course ID to update
 * @body    { status: 'published' | 'draft' }
 * @returns { success, message, data: course }
 *
 * Features:
 * - Toggle course between published and draft
 * - Published courses are visible to public
 * - Draft courses are only visible to creator/admin
 */
router.patch(
  "/:id/status",
  protect, // Require authentication
  authorize(["admin", "instructor"]), // Admin or Instructor access
  courseUpdateLimiter, // Course update rate limiting
  updateCourseStatus // Execute status update logic
);

/* ========================================================================
   RATING & INTERACTION ROUTES
   ======================================================================== */
/**
 * @route   POST /api/courses/:id/rate
 * @desc    Rate a course (1-5 stars)
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @params  id - Course ID to rate
 * @body    { rating: number (1-5), review?: string }
 * @returns { success, message, data: rating }
 *
 * Features:
 * - Submit course rating and optional review
 * - Prevents duplicate ratings from same user
 * - Updates course average rating
 */
router.post("/:id/rate", protect, rateCourse);

/**
 * @route   POST /api/courses/:id/like
 * @desc    Like or unlike a course
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @params  id - Course ID to like/unlike
 * @returns { success, message, data: { liked: boolean, likesCount: number } }
 *
 * Features:
 * - Toggle like status for course
 * - Updates course like count
 * - Returns updated like status
 */
router.post("/:id/like", protect, likeCourse);

/**
 * Helper middleware to attach user info if token is provided
 * Used for routes that benefit from user context but don't require authentication
 */
const attachUserIfAvailable = (req, res, next) => {
  // If authorization header exists, validate the token
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  // Otherwise, continue without user context
  next();
};

/**
 * @route   GET /api/courses/:id/rating-info
 * @desc    Get course rating information
 * @access  Public (enhanced with user data if authenticated)
 * @headers Authorization: Bearer <token> (optional)
 * @params  id - Course ID
 * @returns { success, message, data: { averageRating, totalRatings, userRating?, etc. } }
 *
 * Features:
 * - Returns course rating statistics
 * - If user is authenticated, includes their rating
 * - Public access for basic rating info
 */
router.get("/:id/rating-info", attachUserIfAvailable, getCourseRatingInfo);

/* ========================================================================
   UTILITY ROUTES
   ======================================================================== */

/**
 * @route   GET /api/courses/check/:courseId
 * @desc    Check if course exists (utility route)
 * @access  Public
 * @params  courseId - Course ID to check
 * @returns { exists: boolean, course?: object }
 *
 * Features:
 * - Quick course existence check
 * - Returns basic course info if exists
 * - Used for validation in other services
 */
router.get("/check/:courseId", async (req, res) => {
  try {
    // Find course by ID
    const course = await Course.findById(req.params.courseId);

    // Return 404 if course not found
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Return success with course existence confirmation
    res.json({ exists: true, course });
  } catch (error) {
    // Handle any database or validation errors
    res.status(500).json({ message: error.message });
  }
});

/* ========================================================================
   DYNAMIC ROUTES - Must be last to avoid conflicts
   ======================================================================== */

/**
 * @route   GET /api/courses/:courseId/students
 * @desc    Get enrolled students for a specific course
 * @access  Private (Admin and Instructor)
 * @params  courseId - Course ID
 * @returns { success, message, data: { course, students } }
 *
 * Features:
 * - Returns course details and enrolled students list
 * - Admin and instructor access for student management and grading
 * - Includes student profile information and enrollment dates
 */
router.get(
  "/:courseId/students",
  protect,
  authorize(["admin", "instructor"]),
  getCourseStudents
);

/**
 * @route   GET /api/courses/:id
 * @desc    Get single course details
 * @access  Public
 * @params  id - Course ID
 * @returns { success, message, data: course }
 *
 * Features:
 * - Returns detailed course information
 * - Includes instructor info, lessons, ratings
 * - Public access for course browsing
 * - Must be last route to avoid parameter conflicts
 */
router.get("/:id", getCourse);

module.exports = router;
