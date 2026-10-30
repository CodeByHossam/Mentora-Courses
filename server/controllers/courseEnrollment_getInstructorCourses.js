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
const isValidObjectId = mongoose.isValidObjectId;
const asyncHandler = require("express-async-handler");

// Models
const Course = require("../models/Course");
const Lesson = require("../models/lessonModel");
const Comment = require("../models/Comment");
const Attachment = require("../models/Attachment");
const Test = require("../models/Test");
const Category = require("../models/Category");
const User = require("../models/User");

// Utilities
const {
  deleteFromCloudinary,
  uploadToCloudinary,
  getResourceType,
} = require("../utils/cloudinary");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const logger = require("../utils/logger");

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
const getInstructorCourses = asyncHandler(async (req, res) => {
  try {
    const { instructorId } = req.params;
    if (!isValidObjectId(instructorId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid instructor ID format" });
    }

    // If caller is an instructor, they can only view their own
    if (
      req.user.role === "instructor" &&
      req.user._id.toString() !== instructorId
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these courses",
      });
    }

    const courses = await Course.find({ instructor: instructorId })
      .populate("instructor", "name email")
      .populate("category", "name description");

    res.json({ success: true, data: courses });
  } catch (err) {
    logger.error("getInstructorCourses error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching instructor courses" });
  }
});

/* =========================================================
   GET /api/courses/user/enrolled
   Private (Student) — user’s enrolled courses
========================================================= */

module.exports = { getInstructorCourses };
