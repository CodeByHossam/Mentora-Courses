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
const getCourseStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Course.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $addFields: {
          categoryName: { $arrayElemAt: ["$categoryInfo.name", 0] },
        },
      },
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          totalStudents: { $sum: { $ifNull: ["$students", 0] } },
          averageRating: { $avg: { $ifNull: ["$rating", 0] } }, // adjust if rating field exists
          coursesByCategory: {
            $push: {
              category: "$categoryName",
            },
          },
        },
      },
    ]);

    // count per category
    let byCategory = {};
    if (stats[0]?.coursesByCategory?.length) {
      for (const c of stats[0].coursesByCategory) {
        if (!c?.category) continue;
        byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      }
    }

    res.json({
      success: true,
      data: {
        totalCourses: stats[0]?.totalCourses || 0,
        totalStudents: stats[0]?.totalStudents || 0,
        averageRating: stats[0]?.averageRating || 0,
        coursesByCategory: byCategory,
      },
    });
  } catch (err) {
    logger.error("getCourseStats error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching course statistics" });
  }
});

/* =========================================================
   GET /api/courses/instructor/:instructorId
   Private (Instructor/Admin) — instructor’s courses
========================================================= */

module.exports = { getCourseStats };
