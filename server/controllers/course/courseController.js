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
const createCourse = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      category, // this is ObjectId string now
      level,
      price,
      duration,
      topics, // could be JSON string or array
      imageUrl,
    } = req.body;
    // Basic required fields
    const missing = [];
    if (!title) missing.push("title");
    if (!description) missing.push("description");
    if (!category) missing.push("category");
    if (!level) missing.push("level");
    if (price === undefined) missing.push("price");
    if (duration === undefined) missing.push("duration");
    if (!topics) missing.push("topics");
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    // Validate category by ID (since you’re passing ObjectId string now)
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid category" });
    }

    // Validate level
    const VALID_LEVELS = ["Beginner", "Intermediate", "Advanced"];
    if (!VALID_LEVELS.includes(level)) {
      return res.status(400).json({ success: false, message: "Invalid level" });
    }

    // Unique title check
    const existedCourse = await Course.findOne({ title });
    if (existedCourse) {
      return res.status(400).json({
        success: false,
        message: "A course with the same title already exists",
      });
    }

    // Parse topics safely
    let parsedTopics = [];
    try {
      if (Array.isArray(topics)) {
        parsedTopics = topics;
      } else if (typeof topics === "string") {
        if (topics.trim().startsWith("[")) {
          parsedTopics = JSON.parse(topics);
        } else {
          parsedTopics = topics.split(",").map((t) => t.trim());
        }
      }
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Invalid topics format" });
    }

    // Handle image
    let finalImageUrl = "";
    let finalImagePublicId = null;
    if (req.file) {
      const resourceType = getResourceType(req.file.mimetype);
      const uploadRes = await uploadToCloudinary(
        req.file.buffer,
        "courses",
        resourceType
      );
      finalImageUrl = uploadRes.secure_url;
      finalImagePublicId = uploadRes.public_id;
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
    } else {
      return res.status(400).json({
        success: false,
        message: "Provide either an image file or an imageUrl",
      });
    }

    const course = await Course.create({
      title,
      description,
      category: categoryDoc._id,
      level,
      price: Number(price),
      duration: Number(duration),
      topics: parsedTopics,
      imageUrl: finalImageUrl,
      imagePublicId: finalImagePublicId,
      instructor: req.user._id,
    });

    // Track on user and category
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { createdCourses: course._id },
    });
    categoryDoc.courses.push(course._id);
    categoryDoc.courseCount = Math.max(0, (categoryDoc.courseCount || 0) + 1);
    await categoryDoc.save();

    const populated = await Course.findById(course._id)
      .populate("category", "name description")
      .populate("instructor", "name email");

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: populated,
    });
  } catch (err) {
    logger.error("createCourse error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Error creating course",
    });
  }
});

/* =========================================================
   PUT /api/courses/:id
   Private (Instructor/Admin) — Update
   Supports: new file upload (replaces previous Cloudinary image) OR imageUrl
   If new file uploaded, old Cloudinary image (if owned) is deleted.
========================================================= */



module.exports = {
  createCourse,
  ...require('../courseQueryController'),
  ...require('./courseUpdateController'),
  ...require('./courseEnrollmentController'),
};
