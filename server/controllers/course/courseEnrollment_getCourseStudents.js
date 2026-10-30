/**
 * Course Controller
 *
 * Handles all course-related operations including CRUD operations,
 * course management, enrollment, ratings, and file uploads.
 *
 * Features:
 * - Course creation, updating, and deletion
 * - Course search and filtering with pagination
 * - Student enrollment management
 * - Course ratings and likes system
 * - File upload handling for course images and attachments
 * - Comprehensive error handling and validation
 */

const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

// Models
const Course = require("../../models/Course");
const Lesson = require("../../models/lessonModel");
const Comment = require("../../models/Comment");
const Attachment = require("../../models/Attachment");
const Test = require("../../models/Test");
const Category = require("../../models/Category");
const User = require("../../models/User");

// Utilities
const {
  deleteFromCloudinary,
  uploadToCloudinary,
  getResourceType,
} = require("../../utils/cloudinary");
const { sendSuccess, sendError } = require("../../utils/apiResponse");
const logger = require("../../utils/logger");

/* =========================================================
   HELPER FUNCTIONS

   Utility functions for data validation, transformation,
   and common operations used throughout the controller.
========================================================= */

/**
 * Validate if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid ObjectId, false otherwise
 */
const getCourseStudents = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return sendError(res, "Invalid course ID format", 400);
    }

    const course = await Course.findById(courseId)
      .populate({
        path: "enrolledStudents",
        select: "name email avatar isActive createdAt",
        options: { sort: { createdAt: -1 } },
      })
      .populate("instructor", "name email")
      .populate("category", "name")
      .select(
        "title description status createdAt enrolledStudents instructor category"
      )
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if instructor is accessing their own course
    if (
      req.user.role === "instructor" &&
      course.instructor._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Instructors can only view students from their own courses",
      });
    }

    // Transform enrolled students data to include enrollment date
    const studentsWithEnrollmentDate = course.enrolledStudents.map(
      (student) => ({
        _id: student._id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        isActive: student.isActive,
        enrolledAt: student.createdAt, // Using user creation date as fallback
      })
    );

    return sendSuccess(res, {
      course: {
        _id: course._id,
        title: course.title,
        description: course.description,
        status: course.status,
        createdAt: course.createdAt,
        instructor: course.instructor,
        category: course.category,
      },
      students: studentsWithEnrollmentDate,
    }, "Course students retrieved");
  } catch (err) {
    logger.error("getCourseStudents error", { error: err.message });
    return sendError(res, "Error fetching course students", 500);
  }
});

/* =========================================================
   Exports
========================================================= */

module.exports = { getCourseStudents };
