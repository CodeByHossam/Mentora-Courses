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
const getCourseRatingInfo = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
        data: null,
      });
    }

    const course = await Course.findById(id);
    if (!course)
      return res
        .status(404)
        .json({ success: false, message: "Course not found", data: null });

    let userRating = null;
    let liked = false;

    if (req.user?._id) {
      const found = course.ratings.find(
        (r) => r.user.toString() === req.user._id.toString()
      );
      userRating = found ? found.value : null;
      liked = course.likes.some(
        (l) => l.user.toString() === req.user._id.toString()
      );
    }

    const ratingInfo = {
      averageRating: course.averageRating,
      ratingsCount: course.ratingsCount,
      likesCount: course.likesCount,
      userRating,
      liked,
    };

    res.json({
      success: true,
      message: "Course rating info fetched successfully",
      data: ratingInfo,
    });
  } catch (err) {
    logger.error("getCourseRatingInfo error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching rating info",
      data: null,
    });
  }
});

/* =========================================================
   PATCH /api/courses/:id/status
   Private (Instructor/Admin) — Update course status
========================================================= */

module.exports = { getCourseRatingInfo };
