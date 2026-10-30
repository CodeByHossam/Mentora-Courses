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
const getEnrolledCourses = asyncHandler(async (req, res) => {
  try {
    if (!req.user?._id) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const courses = await Course.find({ enrolledStudents: req.user._id })
      .populate("instructor", "name email")
      .populate("category", "name description")
      .lean();

    res.json({ success: true, data: courses });
  } catch (err) {
    logger.error("getEnrolledCourses error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching enrolled courses" });
  }
});

/* =========================================================
   POST /api/courses/:id/rate
   Private — rate 1..5 (must be enrolled)
========================================================= */

module.exports = { getEnrolledCourses };
