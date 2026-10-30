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
const getCourses = asyncHandler(async (req, res) => {
  try {
    // Extract and validate query parameters
    const {
      search,
      category,
      level,
      sort,
      limit = 20,
      page = 1,
      minPrice,
      maxPrice,
      instructorId,
    } = req.query;

    // Build base query with role-based visibility
    const query = buildVisibilityQuery(req.user);

    // Apply search filters
    const filteredQuery = await applySearchFilters(query, {
      search,
      category,
      level,
      instructorId,
      minPrice,
      maxPrice,
    });

    // Validate and normalize pagination parameters
    const paginationOptions = validatePaginationParams(limit, page);
    const sortCriteria = buildSortCriteria(sort);

    // Execute parallel queries for data and count
    const [courses, totalCount] = await Promise.all([
      Course.find(filteredQuery)
        .sort(sortCriteria)
        .skip((paginationOptions.page - 1) * paginationOptions.limit)
        .limit(paginationOptions.limit)
        .populate("instructor", "name email avatar")
        .populate("category", "name description")
        .lean(),
      Course.countDocuments(query),
    ]);

    // Return formatted response
    return sendSuccess(res, courses, "Courses retrieved successfully", 200, {
      total: totalCount,
      page: paginationOptions.page,
      pages: Math.ceil(totalCount / paginationOptions.limit),
      limit: paginationOptions.limit,
      hasNextPage:
        paginationOptions.page <
        Math.ceil(totalCount / paginationOptions.limit),
      hasPrevPage: paginationOptions.page > 1,
    });
  } catch (error) {
    logger.error("Error fetching courses", { error: error.message });
    return sendError(res, "Failed to retrieve courses", 500, error.message);
  }
});

/**
 * Build visibility query based on user role
 * Determines which courses a user can see based on their role and enrollment status
 */
const buildVisibilityQuery = (user) => {
  if (!user) {
    // Public users: only published courses
    return { status: "published" };
  }

  const userRole = user.role?.toLowerCase();

  switch (userRole) {
    case "student":
      // Students: published courses + archived courses they're enrolled in
      return {
        $or: [
          { status: "published" },
          { status: "archived", enrolledStudents: user._id },
        ],
      };

    case "instructor":
      // Instructors: all their own courses + published courses from others
      return {
        $or: [
          { instructor: user._id },
          { status: "published", instructor: { $ne: user._id } },
        ],
      };

    case "admin":
      // Admins: see all courses regardless of status
      return {};

    default:
      // Default: only published courses
      return { status: "published" };
  }
};

/**
 * Apply search and filter criteria to the query
 */
const applySearchFilters = async (query, filters) => {
  const { search, category, level, instructorId, minPrice, maxPrice } = filters;

  // Text search across title and description
  if (search && search.trim()) {
    query.$text = { $search: search.trim() };
  }

  // Category filter by name
  if (category && category !== "All") {
    const categoryDoc = await Category.findOne({ name: category }).select(
      "_id"
    );
    query.category = categoryDoc ? categoryDoc._id : null;
  }

  // Level filter
  if (level && ["Beginner", "Intermediate", "Advanced"].includes(level)) {
    query.level = level;
  }

  // Instructor filter
  if (instructorId && isValidObjectId(instructorId)) {
    query.instructor = instructorId;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice && !isNaN(minPrice)) query.price.$gte = Number(minPrice);
    if (maxPrice && !isNaN(maxPrice)) query.price.$lte = Number(maxPrice);
  }

  return query;
};

/**
 * Validate and normalize pagination parameters
 */
const validatePaginationParams = (limit, page) => {
  const normalizedLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const normalizedPage = Math.max(1, Number(page) || 1);

  return {
    limit: normalizedLimit,
    page: normalizedPage,
  };
};

/* =========================================================
   GET /api/courses/:id
   Public — single course
========================================================= */
const getCourse = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID format" });
    }

    const courseDoc = await Course.findById(id)
      .populate("instructor", "name email")
      .populate("category", "name description")
      .populate("enrolledStudents", "name email")
      .populate({ path: "lessons" }); // details inside lessons

    if (!courseDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Course not found" });
    }

    // Status-based access control for individual course
    if (!req.user) {
      // Public users: only published courses
      if (courseDoc.status !== "published") {
        if (courseDoc.status === "draft") {
          return res.status(403).json({
            success: false,
            message:
              "This course is still in draft mode and not available to the public yet",
            courseStatus: "draft",
          });
        }
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }
    } else if (req.user.role.toLowerCase() === "student") {
      // Students: published courses + archived courses they're enrolled in
      const isEnrolled = courseDoc.enrolledStudents.some(
        (student) => student._id.toString() === req.user._id.toString()
      );
      if (courseDoc.status === "draft") {
        return res.status(403).json({
          success: false,
          message:
            "This course is still in draft mode and not available to students yet",
          courseStatus: "draft",
        });
      }
      if (courseDoc.status === "archived" && !isEnrolled) {
        return res.status(403).json({
          success: false,
          message:
            "This course has been archived and is only available to enrolled students",
          courseStatus: "archived",
        });
      }
    } else if (req.user.role === "instructor") {
      // Instructors: all their own courses + published courses from others
      const isOwner =
        courseDoc.instructor._id.toString() === req.user._id.toString();
      if (!isOwner && courseDoc.status !== "published") {
        if (courseDoc.status === "draft") {
          return res.status(403).json({
            success: false,
            message:
              "This course is still in draft mode and only available to its instructor",
            courseStatus: "draft",
          });
        }
        return res
          .status(404)
          .json({ success: false, message: "Course not found" });
      }
    }
    // Admins can access all courses regardless of status

    const course = courseDoc.toObject({ virtuals: true });

    const ratingInfo = {
      averageRating: course.averageRating,
      ratingsCount: course.ratingsCount,
      likesCount: course.likesCount,
    };

    res.json({
      success: true,
      message: "Course fetched successfully",
      data: { ...course, ratingInfo },
    });
  } catch (err) {
    logger.error("getCourse error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error while fetching course" });
  }
});

/* =========================================================
   POST /api/courses
   Private (Instructor/Admin) — Create
   Supports: file upload (req.file) OR direct imageUrl
   If file present => use Cloudinary; imageUrl will be ignored.
========================================================= */

module.exports = {
  getCourses,
  getCourse,
};
