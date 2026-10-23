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
const isValidObjectId = (id) => {
  return id && mongoose.Types.ObjectId.isValid(id);
};

/**
 * Normalize various input types to boolean values
 * Handles string representations of boolean values commonly used in forms
 * @param {*} value - The value to normalize to boolean
 * @returns {boolean} Normalized boolean value
 */
const normalizeBooleanValue = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const truthyValues = ["1", "true", "yes", "on"];
    return truthyValues.includes(value.toLowerCase());
  }
  return false;
};

/**
 * Parse and normalize topics from various input formats
 * Handles both array and comma-separated string inputs
 * @param {string|Array} topics - Topics as string or array
 * @returns {Array<string>} Array of cleaned topic strings
 */
const parseAndNormalizeTopics = (topics) => {
  if (!topics) return [];

  if (Array.isArray(topics)) {
    return topics.map((topic) => String(topic).trim()).filter(Boolean);
  }

  return String(topics)
    .split(",")
    .map((topic) => topic.trim())
    .filter(Boolean);
};

/**
 * Build MongoDB sort object based on sort parameter
 * Provides consistent sorting options for course queries
 * @param {string} sortBy - Sort parameter from query
 * @returns {Object} MongoDB sort object
 */
const buildSortCriteria = (sortBy) => {
  const sortOptions = {
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    rating: { rating: -1, createdAt: -1 },
    students: { students: -1, createdAt: -1 },
    title: { title: 1 },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
  };

  return sortOptions[sortBy] || { createdAt: -1 };
};

/**
 * Extract Cloudinary public ID from a URL
 * Parses Cloudinary URLs to extract the public ID for resource management
 * @param {string} url - The Cloudinary URL to parse
 * @returns {string|null} The extracted public ID or null if parsing fails
 *
 * @example
 * // Input: "https://res.cloudinary.com/demo/image/upload/v1234567890/folder/sample.jpg"
 * // Output: "folder/sample"
 */
const extractCloudinaryPublicId = (url) => {
  if (!url || typeof url !== "string") return null;

  try {
    const cloudinaryPattern = /upload\/(?:v\d+\/)?(.+?)\.[^/.]+$/;
    const match = url.match(cloudinaryPattern);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error extracting public ID from URL:", url, error.message);
    return null;
  }
};

/**
 * Determine Cloudinary resource type from file extension
 * Maps file extensions to appropriate Cloudinary resource types for proper handling
 * @param {string} fileExtension - The file extension (with or without dot)
 * @returns {string} The Cloudinary resource type ('image', 'video', or 'raw')
 */
const getCloudinaryResourceType = (fileExtension) => {
  if (!fileExtension) return "raw";

  const extension = String(fileExtension).toLowerCase().replace(".", "");

  // Image file types
  const imageTypes = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "svg",
    "tiff",
    "ico",
  ];
  if (imageTypes.includes(extension)) return "image";

  // Video file types
  const videoTypes = ["mp4", "mov", "avi", "wmv", "flv", "webm", "mkv", "m4v"];
  if (videoTypes.includes(extension)) return "video";

  // Audio file types (Cloudinary treats audio as 'video' resource type)
  const audioTypes = ["mp3", "wav", "ogg", "aac", "m4a", "flac"];
  if (audioTypes.includes(extension)) return "video";

  // Document and other file types default to 'raw'
  return "raw";
};

/* =========================================================
   COURSE CONTROLLERS
   
   Main controller functions for course CRUD operations
   and course management features.
========================================================= */

/**
 * Get courses with filtering, searching, and pagination
 *
 * @route   GET /api/courses
 * @access  Public (with role-based visibility)
 * @desc    Retrieve courses with advanced filtering options including:
 *          - Text search across title and description
 *          - Category and level filtering
 *          - Price range filtering
 *          - Instructor-specific filtering
 *          - Role-based visibility (public, student, instructor, admin)
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
    res.json({
      success: true,
      message: "Courses retrieved successfully",
      data: courses,
      meta: {
        total: totalCount,
        page: paginationOptions.page,
        pages: Math.ceil(totalCount / paginationOptions.limit),
        limit: paginationOptions.limit,
        hasNextPage:
          paginationOptions.page <
          Math.ceil(totalCount / paginationOptions.limit),
        hasPrevPage: paginationOptions.page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve courses",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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
    console.error("getCourse error:", err);
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
    console.error("createCourse error:", err);
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
const updateCourse = asyncHandler(async (req, res) => {
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

    // Auth: owner or admin
    const isOwner = course.instructor.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this course",
      });
    }

    const updates = { ...req.body };

    // If category provided as name, map to id
    if (updates.category && typeof updates.category === "string") {
      // accept category name or id
      if (isValidObjectId(updates.category)) {
        // leave as ObjectId
      } else {
        const catDoc = await Category.findOne({ name: updates.category });
        if (!catDoc)
          return res
            .status(400)
            .json({ success: false, message: "Invalid category" });
        updates.category = catDoc._id;
      }
    }

    // Normalize topics
    if (updates.topics !== undefined) {
      updates.topics = parseTopics(updates.topics);
    }

    // Handle image replacement
    if (req.file) {
      const resourceType = getResourceType(req.file.mimetype);
      const uploadRes = await uploadToCloudinary(
        req.file.buffer,
        "courses",
        resourceType
      );

      // delete old only if we own it
      if (course.imagePublicId) {
        try {
          await deleteFromCloudinary(course.imagePublicId, "image");
        } catch (e) {
          console.warn("Failed to delete old course image:", e?.message || e);
        }
      }

      updates.imageUrl = uploadRes.secure_url;
      updates.imagePublicId = uploadRes.public_id;
    } else if (updates.imageUrl) {
      // If user sets a direct URL (no file), and we previously owned a Cloudinary image, consider keeping publicId
      // But if they switch to an external URL, we should clear imagePublicId (we don't own/cleanup external).
      // Only delete old cloudinary image if they intentionally replaced with an external URL different from current one.
      if (updates.imageUrl !== course.imageUrl && course.imagePublicId) {
        try {
          await deleteFromCloudinary(course.imagePublicId, "image");
        } catch (e) {
          console.warn("Failed to delete old course image:", e?.message || e);
        }
        updates.imagePublicId = null;
      }
    }

    Object.assign(course, updates);
    const saved = await course.save();

    const populated = await Course.findById(saved._id)
      .populate("category", "name description")
      .populate("instructor", "name email");

    res.json({
      success: true,
      message: "Course updated successfully",
      data: populated,
    });
  } catch (err) {
    console.error("updateCourse error:", err);
    res.status(500).json({ success: false, message: "Error updating course" });
  }
});

/* =========================================================
   DELETE /api/courses/:id
   Private (Instructor/Admin) — Delete
   Cleans up:
     - Course image (Cloudinary if owned)
     - Attachments (Cloudinary by type)
     - Lessons & their media (image/video)
     - Category counters, user references
========================================================= */
const deleteCourse = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    const course = await Course.findById(id)
      .populate("enrolledStudents", "name email")
      .populate("instructor", "name email");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Authorization check
    const isOwner =
      course.instructor._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this course",
      });
    }

    // 🚨 SECURE DELETION - RELATIONSHIP VALIDATION
    const validationErrors = [];

    // Check enrolled students
    if (course.enrolledStudents && course.enrolledStudents.length > 0) {
      validationErrors.push(
        `Cannot delete course with ${course.enrolledStudents.length} enrolled students`
      );
    }

    // Check active live sessions
    const LiveSession = require("../models/LiveSession");
    const activeSessions = await LiveSession.find({
      course: id,
      status: { $in: ["scheduled", "live"] },
    });
    if (activeSessions.length > 0) {
      validationErrors.push(
        `Cannot delete course with ${activeSessions.length} active live sessions`
      );
    }

    // Check pending payments
    const Payment = require("../models/Payment");
    const pendingPayments = await Payment.find({
      course: id,
      status: { $in: ["pending", "processing"] },
    });
    if (pendingPayments.length > 0) {
      validationErrors.push(
        `Cannot delete course with ${pendingPayments.length} pending payments`
      );
    }

    // Check active tests
    const Test = require("../models/Test");
    const activeTests = await Test.find({
      course: id,
      isActive: true,
    });
    if (activeTests.length > 0) {
      validationErrors.push(
        `Cannot delete course with ${activeTests.length} active tests`
      );
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Course deletion blocked due to active relationships",
        errors: validationErrors,
        canForceDelete: req.user.role === "admin", // Only admin can force delete
      });
    }

    // 🗑️ SAFE DELETION PROCESS
    // Remove from instructor's created courses and related arrays
    await User.findByIdAndUpdate(course.instructor._id, {
      $pull: {
        createdCourses: course._id,
        liveSessions: { $in: course.liveSessions || [] },
        tests: { $in: course.tests || [] },
        Comment: { $in: course.Comment || [] },
        payments: { $in: course.payments || [] },
      },
    });

    // Remove from all enrolled students' arrays
    if (course.enrolledStudents && course.enrolledStudents.length > 0) {
      await User.updateMany(
        { _id: { $in: course.enrolledStudents } },
        {
          $pull: {
            enrolledCourses: course._id,
            liveSessions: { $in: course.liveSessions || [] },
            tests: { $in: course.tests || [] },
            Comment: { $in: course.Comment || [] },
            payments: { $in: course.payments || [] },
          },
        }
      );
    }

    // Remove from category
    await Category.findByIdAndUpdate(course.category, {
      $pull: { courses: course._id },
      $inc: { courseCount: -1 },
    });

    // Delete related data (safe to delete as course has no enrolled students)
    const Comment = require("../models/Comment");
    await Comment.deleteMany({ course: course._id });
    await Test.deleteMany({ course: course._id });

    const Grade = require("../models/Grade");
    await Grade.deleteMany({ course: course._id });

    await LiveSession.deleteMany({ course: course._id });

    const EnrollmentRequest = require("../models/EnrollmentRequest");
    await EnrollmentRequest.deleteMany({ course: course._id });

    // Delete lessons and their media (Cloudinary)
    const { deleteFromCloudinary } = require("../utils/cloudinary");
    const videoService = require("../services/videoService");
    const lessons = await Lesson.find({ course: course._id });
    
    for (const lesson of lessons) {
      // Delete lesson image from Cloudinary
      if (lesson.image) {
        try {
          const imageMatch = lesson.image.match(/\/upload\/(?:v\d+\/)?(.+?)\.([a-z0-9]+)/i);
          if (imageMatch && imageMatch[1]) {
            await deleteFromCloudinary(imageMatch[1], 'image');
          }
        } catch (error) {
          console.error(`Failed to delete lesson image: ${error.message}`);
        }
      }
      
      // Delete lesson video from Cloudinary
      if (lesson.videoRef?.publicId) {
        try {
          await videoService.deleteVideo(lesson.videoRef.publicId);
        } catch (error) {
          console.error(`Failed to delete lesson video: ${error.message}`);
        }
      }
      
      // Delete lesson PDF from Cloudinary
      if (lesson.pdfUrl) {
        try {
          const pdfMatch = lesson.pdfUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.([a-z0-9]+)/i);
          if (pdfMatch && pdfMatch[1]) {
            await deleteFromCloudinary(pdfMatch[1], 'raw');
          }
        } catch (error) {
          console.error(`Failed to delete lesson PDF: ${error.message}`);
        }
      }
    }
    
    await Lesson.deleteMany({ course: course._id });

    // Delete attachments and their S3 files
    const { deleteFile } = require("../utils/aws");
    const attachments = await Attachment.find({ course: course._id });
    
    for (const attachment of attachments) {
      if (attachment.fileUrl) {
        try {
          await deleteFile(attachment.fileUrl);
        } catch (error) {
          console.error(`Failed to delete attachment from S3: ${error.message}`);
        }
      }
    }
    
    await Attachment.deleteMany({ course: course._id });

    // Delete course image from Cloudinary
    if (course.image) {
      try {
        const imageMatch = course.image.match(/\/upload\/(?:v\d+\/)?(.+?)\.([a-z0-9]+)/i);
        if (imageMatch && imageMatch[1]) {
          await deleteFromCloudinary(imageMatch[1], 'image');
        }
      } catch (error) {
        console.error(`Failed to delete course image: ${error.message}`);
      }
    }

    // Delete the course
    await Course.findByIdAndDelete(course._id);

    console.log(
      `🗑️ Course "${course.title}" deleted by ${req.user.role} ${req.user.name}`
    );

    res.json({
      success: true,
      message: "Course deleted successfully",
      deletedCourse: {
        id: course._id,
        title: course.title,
        instructor: course.instructor.name,
      },
    });
  } catch (error) {
    console.error("❌ Course deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete course",
      error: error.message,
    });
  }
});

/* =========================================================
   POST /api/courses/:id/enroll
   Private — Enroll (student)
========================================================= */
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
    console.error("enrollInCourse error:", err);
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
    console.error("getCourseStats error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching course statistics" });
  }
});

/* =========================================================
   GET /api/courses/instructor/:instructorId
   Private (Instructor/Admin) — instructor’s courses
========================================================= */
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
    console.error("getInstructorCourses error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching instructor courses" });
  }
});

/* =========================================================
   GET /api/courses/user/enrolled
   Private (Student) — user’s enrolled courses
========================================================= */
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
    console.error("getEnrolledCourses error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching enrolled courses" });
  }
});

/* =========================================================
   POST /api/courses/:id/rate
   Private — rate 1..5 (must be enrolled)
========================================================= */
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
    console.error("rateCourse error:", err);
    res.status(500).json({ success: false, message: "Error rating course" });
  }
});

/* =========================================================
   POST /api/courses/:id/like
   Private — toggle like
   Policy: allow if enrolled OR (instructor/admin)
========================================================= */
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
    console.error("likeCourse error:", err);
    res.status(500).json({ success: false, message: "Error liking course" });
  }
});

/* =========================================================
   GET /api/courses/:id/rating-info
   Private (user rating) / Public (average/likes)
========================================================= */
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
    console.error("getCourseRatingInfo error:", err);
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
    console.error("updateCourseStatus error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error updating course status" });
  }
});
// get all course for admin even unpublished one
const getAllCourses = asyncHandler(async (req, res) => {
  try {
    const courses = await Course.find().populate("instructor", "name email");
    res.json({ success: true, data: courses });
  } catch (err) {
    console.error("getAllCourses error:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching all courses" });
  }
});

/**
 * Get Course Students
 * @desc    Get all enrolled students for a specific course
 * @route   GET /api/courses/:courseId/students
 * @access  Private (Admin and Instructor)
 */
const getCourseStudents = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.isValidObjectId(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    const course = await Course.findById(courseId)
      .populate({
        path: "enrolledStudents",
        select: "name email avatar isActive createdAt",
        options: { sort: { createdAt: -1 } },
      })
      .populate("instructor", "name email")
      .populate("category", "name")
      .select(
        "title description status createdAt enrolledStudents instructor category"
      );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if instructor is accessing their own course
    if (
      req.user.role === "instructor" &&
      course.instructor._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Instructors can only view students from their own courses",
      });
    }

    // Transform enrolled students data to include enrollment date
    const studentsWithEnrollmentDate = course.enrolledStudents.map(
      (student) => ({
        _id: student._id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        isActive: student.isActive,
        enrolledAt: student.createdAt, // Using user creation date as fallback
      })
    );

    res.json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          status: course.status,
          createdAt: course.createdAt,
          instructor: course.instructor,
          category: course.category,
        },
        students: studentsWithEnrollmentDate,
      },
    });
  } catch (err) {
    console.error("getCourseStudents error:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching course students",
    });
  }
});

/* =========================================================
   Exports
========================================================= */
module.exports = {
  getAllCourses,
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getCourseStats,
  getInstructorCourses,
  getEnrolledCourses,
  rateCourse,
  likeCourse,
  getCourseRatingInfo,
  updateCourseStatus,
  getCourseStudents,
};
