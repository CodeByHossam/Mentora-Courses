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
const likeCourse = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID format" });
    }

    const course = await Course.findById(id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    const enrolled = course.enrolledStudents
      .map(String)
      .includes(String(req.user._id));
    const privileged =
      req.user.role === "instructor" || req.user.role === "admin";
    if (!enrolled && !privileged) {
      return res.status(403).json({
        success: false,
        message:
          "You must be enrolled (or instructor/admin) to like this course",
      });
    }

    const idx = course.likes.findIndex(
      (l) => l.user.toString() === req.user._id.toString()
    );
    let liked = false;
    if (idx > -1) {
      course.likes.splice(idx, 1);
      liked = false;
    } else {
      course.likes.push({ user: req.user._id });
      liked = true;
    }
    await course.save();

    res.json({ success: true, likesCount: course.likesCount, liked });
  } catch (err) {
    logger.error("likeCourse error:", err);
    res.status(500).json({ success: false, message: "Error liking course" });
  }
});

/* =========================================================
   GET /api/courses/:id/rating-info
   Private (user rating) / Public (average/likes)
========================================================= */

module.exports = { likeCourse };
