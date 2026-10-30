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
const updateCourseStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID format" });
    }

    if (!["draft", "published", "archived"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: draft, published, archived",
      });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Auth check - only instructor who owns the course or admin can update status
    const isOwner = course.instructor.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this course status",
      });
    }

    // Update status
    course.status = status;
    await course.save();

    // Populate the updated course for response
    const populated = await Course.findById(course._id)
      .populate("instructor", "name email")
      .populate("category", "name")
      .populate("lessons");

    res.json({
      success: true,
      message: `Course status updated to ${status}`,
      data: populated,
    });
  } catch (err) {
    logger.error("updateCourseStatus error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error updating course status" });
  }
});
// get all course for admin even unpublished one

module.exports = { updateCourseStatus };
