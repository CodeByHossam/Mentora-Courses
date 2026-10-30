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
const rateCourse = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID format" });
    }
    const ratingVal = Number(value);
    if (!ratingVal || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating value must be between 1 and 5",
      });
    }

    const course = await Course.findById(id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });

    // Must be enrolled or be admin
    const enrolled = course.enrolledStudents
      .map(String)
      .includes(String(req.user._id));
    const isAdmin = req.user.role === "admin";
    if (!enrolled && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You must be enrolled to rate this course",
      });
    }

    const existing = course.ratings.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (existing) existing.value = ratingVal;
    else course.ratings.push({ user: req.user._id, value: ratingVal });

    await course.save();

    res.json({
      success: true,
      averageRating: course.averageRating,
      userRating: ratingVal,
    });
  } catch (err) {
    logger.error("rateCourse error:", err);
    res.status(500).json({ success: false, message: "Error rating course" });
  }
});

/* =========================================================
   POST /api/courses/:id/like
   Private — toggle like
   Policy: allow if enrolled OR (instructor/admin)
========================================================= */

module.exports = { rateCourse };
