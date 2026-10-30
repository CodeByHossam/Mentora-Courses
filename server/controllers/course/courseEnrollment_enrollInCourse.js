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
const enrollInCourse = asyncHandler(async (req, res) => {
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

    const already = course.enrolledStudents
      .map(String)
      .includes(String(req.user._id));
    if (already) {
      return res
        .status(400)
        .json({ success: false, message: "Already enrolled in this course" });
    }

    course.enrolledStudents.push(req.user._id);
    course.students = (course.students || 0) + 1;
    await course.save();

    const populated = await Course.findById(course._id)
      .populate("instructor", "name email")
      .populate("category", "name description");

    res.json({
      success: true,
      message: "Successfully enrolled in course",
      data: {
        _id: populated._id,
        title: populated.title,
        description: populated.description,
        price: populated.price,
        duration: populated.duration,
        level: populated.level,
        imageUrl: populated.imageUrl,
        instructor: populated.instructor,
      },
    });
  } catch (err) {
    logger.error("enrollInCourse error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Error enrolling in course",
    });
  }
});

/* =========================================================
   GET /api/courses/stats
   Public — aggregate stats
========================================================= */

module.exports = { enrollInCourse };
