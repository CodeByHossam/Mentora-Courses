const logger = require('../utils/logger');
const Course = require("../models/Course");
const Lesson = require("../models/lessonModel");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
  getResourceType,
} = require("../utils/cloudinary");
const videoService = require("../services/videoService");
// Removed responseHandler import - using direct JSON responses

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
const addLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    let { title, description, duration, content, order, text } = req.body;

    // Parse and validate duration
    duration = Number(duration);
    if (!duration || isNaN(duration) || duration <= 0) {
      return res.status(400).json({
        message:
          "Lesson duration (minutes) is required and must be a positive number.",
      });
    }

    let imageUrl = "";
    let videoRef = null;
    let pdfUrl = "";

    // Upload image if provided
    if (req.files?.image?.[0]) {
      const imageBuffer = req.files.image[0].buffer;
      const imageResourceType = getResourceType(req.files.image[0].mimetype);
      const imageUpload = await uploadToCloudinary(
        imageBuffer,
        "lessons/images",
        imageResourceType
      );
      imageUrl = imageUpload.secure_url;
    }

    // Upload video if provided (store reference, not URL)
    if (req.files?.video?.[0]) {
      const videoBuffer = req.files.video[0].buffer;
      const videoResourceType = getResourceType(req.files.video[0].mimetype);
      videoRef = await videoService.uploadVideo(
        videoBuffer,
        "lessons/videos",
        videoResourceType
      );
    }

    // Upload PDF if provided
    if (req.files?.pdf?.[0]) {
      const pdfBuffer = req.files.pdf[0].buffer;
      const pdfUpload = await uploadToCloudinary(
        pdfBuffer,
        "lessons/pdfs",
        "raw"
      );
      pdfUrl = pdfUpload.secure_url;
    }

    const newLesson = await Lesson.create({
      course: course._id,
      title,
      description,
      duration,
      image: imageUrl,
      videoRef,
      content,
      order,
      text,
      pdfUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      data: newLesson,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------------
// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Private/Instructor
// ----------------------------------------------------------
const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Handle file uploads if present (FormData)
    let imageUrl = lesson.image;
    let videoRef = lesson.videoRef;

    if (req.files?.image?.[0]) {
      const imageBuffer = req.files.image[0].buffer;
      const imageResourceType = getResourceType(req.files.image[0].mimetype);
      const imageUpload = await uploadToCloudinary(
        imageBuffer,
        "lessons/images",
        imageResourceType
      );
      imageUrl = imageUpload.secure_url;
    }
    if (req.files?.video?.[0]) {
      // Delete old video if exists
      if (lesson.videoRef?.publicId) {
        await videoService.deleteVideo(lesson.videoRef.publicId);
      }

      const videoBuffer = req.files.video[0].buffer;
      const videoResourceType = getResourceType(req.files.video[0].mimetype);
      videoRef = await videoService.uploadVideo(
        videoBuffer,
        "lessons/videos",
        videoResourceType
      );
    }

    // Build update object
    const updateFields = {
      title: req.body.title ?? lesson.title,
      description: req.body.description ?? lesson.description,
      duration: req.body.duration ?? lesson.duration,
      content: req.body.content ?? lesson.content,
      order: req.body.order ?? lesson.order,
      image: imageUrl,
      videoRef: videoRef,
    };

    const updatedLesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      data: updatedLesson,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------------
// @desc    Delete lesson + media (image, video, PDF) from Cloudinary
// @route   DELETE /api/lessons/:id
// @access  Private/Instructor
// ----------------------------------------------------------
const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Delete image
    const imageInfo = extractCloudinaryFileInfo(lesson.image);
    if (imageInfo?.publicId) {
      await deleteFromCloudinary(imageInfo.publicId, imageInfo.resourceType);
    }

    // Delete video using video service
    if (lesson.videoRef?.publicId) {
      await videoService.deleteVideo(lesson.videoRef.publicId);
    }

    // Delete PDF
    const pdfInfo = extractCloudinaryFileInfo(lesson.pdfUrl);
    if (pdfInfo?.publicId) {
      await deleteFromCloudinary(pdfInfo.publicId, pdfInfo.resourceType);
    }

    // Delete lesson from DB
    await Lesson.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Lesson and its media deleted successfully",
    });
  } catch (error) {
    logger.error("❌ Delete lesson error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------------------------------------------
// Export controller functions
// ----------------------------------------------------------
module.exports = {
  addLesson,
  getLessons,
  getLesson,
  updateLesson,
  deleteLesson,
  getCourseLessons,
};
