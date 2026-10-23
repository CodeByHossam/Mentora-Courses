const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
  protect,
  instructor,
  student,
} = require("../middleware/authMiddleware");
const {
  createFinalGrade,
  createTestGrade,
  getCourseGrades,
  getCourseTests,
  getStudentGrades,
  getAllStudentGrades,
  deleteGrade,
} = require("../controllers/gradeController");

/**
 * GRADE MANAGEMENT ROUTES
 *
 * Handles all grading operations for the Mentora platform
 */

// Validation middleware
const validateFinalGrade = [
  body("studentId").isMongoId().withMessage("Valid student ID is required"),
  body("courseId").isMongoId().withMessage("Valid course ID is required"),
  body("percentage")
    .isFloat({ min: 0, max: 100 })
    .withMessage("Percentage must be between 0 and 100"),
  body("Comment")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Comment must be less than 1000 characters"),
  body("feedback")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Feedback must be less than 2000 characters"),
];

const validateTestGrade = [
  body("studentId").isMongoId().withMessage("Valid student ID is required"),
  body("courseId").isMongoId().withMessage("Valid course ID is required"),
  body("testId").isMongoId().withMessage("Valid test ID is required"),
  body("totalPoints")
    .isFloat({ min: 0 })
    .withMessage("Total points must be a positive number"),
  body("earnedPoints")
    .isFloat({ min: 0 })
    .withMessage("Earned points must be a positive number"),
  body("Comment")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Comment must be less than 1000 characters"),
  body("feedback")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Feedback must be less than 2000 characters"),
];

// INSTRUCTOR ROUTES

/**
 * @route   POST /api/grades/final
 * @desc    Create or update final grade for a student
 * @access  Private (Instructor only)
 */
router.post(
  "/final",
  protect,
  instructor,
  validateFinalGrade,
  createFinalGrade
);

/**
 * @route   POST /api/grades/test
 * @desc    Create or update test grade for a student
 * @access  Private (Instructor only)
 */
router.post("/test", protect, instructor, validateTestGrade, createTestGrade);

/**
 * @route   GET /api/grades/course/:courseId
 * @desc    Get all grades for a course (instructor view)
 * @access  Private (Instructor only)
 */
router.get("/course/:courseId", protect, instructor, getCourseGrades);

/**
 * @route   GET /api/grades/course/:courseId/tests
 * @desc    Get all tests for a course (for grading form)
 * @access  Private (Instructor only)
 */
router.get("/course/:courseId/tests", protect, instructor, getCourseTests);

/**
 * @route   DELETE /api/grades/:gradeId
 * @desc    Delete a grade
 * @access  Private (Instructor only)
 */
router.delete("/:gradeId", protect, instructor, deleteGrade);

// STUDENT ROUTES

/**
 * @route   GET /api/grades/student/:courseId
 * @desc    Get student's grades for a specific course
 * @access  Private (Student only)
 */
router.get("/student/:courseId", protect, student, getStudentGrades);

/**
 * @route   GET /api/grades/student
 * @desc    Get all grades for a student across all courses
 * @access  Private (Student only)
 */
router.get("/student", protect, student, getAllStudentGrades);

module.exports = router;
