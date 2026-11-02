const logger = require('../../utils/logger');
const Course = require("../../models/Course");
const Lesson = require("../../models/lessonModel");
const videoService = require("../../services/videoService");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  getResourceType,
} = require("../../utils/cloudinary");

// ----------------------------------------------------------
// Helper: Extract Cloudinary publicId and determine resourceType
// ----------------------------------------------------------
const extractCloudinaryFileInfo = (url) => {
  if (!url) return null;

  const match = url.match(/upload\/(?:v\d+\/)?(.+)\.([a-z0-9]+)$/i);
  if (!match) {
    logger.warn("❌ Could not extract file info from Cloudinary URL:", url);
    return null;
  }

  const publicId = match[1]; // Cloudinary asset ID without extension
  const ext = match[2].toLowerCase(); // file extension

  let resourceType = "image";
  if (["mp4", "mov", "avi"].includes(ext)) resourceType = "video";
  else if (["pdf", "doc", "docx"].includes(ext)) resourceType = "raw"; // PDFs handled as raw

  return { publicId, resourceType };
};

// ----------------------------------------------------------
// @desc    Get all lessons
// @route   GET /api/lessons
// @access  Private/Instructor
// ----------------------------------------------------------
const getLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({}).lean();
    res.status(200).json({
      success: true,
      message: "Lessons retrieved successfully",
      data: lessons,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------------
// @desc    Get single lesson by ID
// @route   GET /api/lessons/:id
// @access  Private/Instructor
// ----------------------------------------------------------
const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res
        .status(404)
        .json({ success: false, message: "Lesson not found", data: null });
    }
    res.status(200).json({
      success: true,
      message: "Lesson retrieved successfully",
      data: lesson,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------------
// @desc    Get all lessons for a specific course
// @route   GET /api/lessons/course/:courseId
// @access  Private/Instructor
// ----------------------------------------------------------
const getCourseLessons = async (req, res) => {
  try {
    const courseId = req.params.courseId;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });
    res.status(200).json({
      success: true,
      message: "Course lessons retrieved successfully",
      data: lessons,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------------
// @desc    Add new lesson with optional image/video/pdf
// @route   POST /api/lessons/:courseId
// @access  Private/Instructor
// ----------------------------------------------------------

module.exports = {
  getLessons,
  getLesson,
  getCourseLessons
};
