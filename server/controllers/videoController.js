const logger = require('../utils/logger');
const asyncHandler = require("express-async-handler");
const Lesson = require("../models/lessonModel");
const Course = require("../models/Course");
const videoService = require("../services/videoService");

// Helper functions for consistent responses
const successResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message, statusCode = 400, data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};

/**
 * @desc    Generate temporary video streaming URL
 * @route   POST /api/videos/stream/:lessonId
 * @access  Private (Enrolled students + Instructors)
 */
const generateStreamingUrl = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const { quality = "auto" } = req.body;
  const userId = req.user._id.toString();

  // Get lesson and verify access
  const lesson = await Lesson.findById(lessonId).populate("course");
  if (!lesson) {
    return errorResponse(res, "Lesson not found", 404);
  }

  // Check if user has access to this lesson
  const course = lesson.course;
  const isInstructor = course.instructor.toString() === userId;
  const isEnrolled = course.enrolledStudents.includes(userId);
  const isAdmin = req.user.role === "admin";

  if (!isInstructor && !isEnrolled && !isAdmin) {
    return errorResponse(
      res,
      "Access denied: You must be enrolled in this course",
      403
    );
  }

  // Debug: Log lesson video info
  logger.info("🔍 Lesson video check:", {
    lessonId,
    hasVideoRef: !!lesson.videoRef,
    publicId: lesson.videoRef?.publicId,
    videoRefStructure: lesson.videoRef,
  });

  // Check if lesson has video
  if (!lesson.videoRef?.publicId) {
    return errorResponse(
      res,
      "No video available for this lesson. Please contact your instructor to upload the video content.",
      404
    );
  }

  try {
    // Enhanced security options
    const securityOptions = {
      userAgent: req.headers["user-agent"],
      referrer: req.headers.referer || req.headers.referrer,
      ipAddress: req.ip || req.connection.remoteAddress,
      courseId: course._id.toString(),
    };

    let streamingData;

    if (quality === "adaptive") {
      // Generate multiple quality URLs for adaptive streaming
      streamingData = videoService.generateAdaptiveStreamingUrls(
        lesson.videoRef.publicId,
        userId,
        lessonId,
        securityOptions
      );
    } else {
      // Generate single quality URL with security options
      streamingData = videoService.generateTempVideoUrl(
        lesson.videoRef.publicId,
        userId,
        lessonId,
        2, // 2 hour expiry
        securityOptions
      );
    }

    // Get video metadata
    const metadata = videoService.getVideoMetadata(lesson.videoRef);

    // Log video access for security monitoring
    logger.info(
      `🎥 Video access: User ${userId} (${req.user.email}) accessing lesson ${lessonId} from ${req.ip}`
    );

    return successResponse(res, "Streaming URL generated successfully", {
      ...streamingData,
      metadata,
      lessonTitle: lesson.title,
      // Security notice
      notice:
        "This content is protected by digital rights management. Unauthorized distribution is prohibited.",
    });
  } catch (error) {
    logger.error("Video streaming URL generation error:", error);
    return errorResponse(res, "Failed to generate streaming URL", 500);
  }
});

/**
 * @desc    Verify video access token
 * @route   POST /api/videos/verify
 * @access  Private
 */
const verifyVideoAccess = asyncHandler(async (req, res) => {
  const { token, lessonId } = req.body;
  const userId = req.user._id.toString();

  if (!token || !lessonId) {
    return errorResponse(res, "Token and lesson ID are required", 400);
  }

  try {
    const decoded = videoService.verifyVideoAccess(token, userId, lessonId);

    return successResponse(res, "Video access verified", {
      valid: true,
      expiresAt: new Date(decoded.exp * 1000),
      lessonId: decoded.lessonId,
    });
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
});

/**
 * @desc    Get video metadata without URL
 * @route   GET /api/videos/metadata/:lessonId
 * @access  Private (Enrolled students + Instructors)
 */
const getVideoMetadata = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user._id.toString();

  const lesson = await Lesson.findById(lessonId).populate("course");
  if (!lesson) {
    return errorResponse(res, "Lesson not found", 404);
  }

  // Verify access
  const course = lesson.course;
  const isInstructor = course.instructor.toString() === userId;
  const isEnrolled = course.enrolledStudents.includes(userId);

  if (!isInstructor && !isEnrolled) {
    return errorResponse(res, "Access denied", 403);
  }

  if (!lesson.videoRef?.publicId) {
    return successResponse(res, "No video available", { hasVideo: false });
  }

  const metadata = videoService.getVideoMetadata(lesson.videoRef);

  return successResponse(res, "Video metadata retrieved", metadata);
});

/**
 * @desc    Debug lesson video info
 * @route   GET /api/videos/debug/:lessonId
 * @access  Private (Admin/Instructor)
 */
const debugLessonVideo = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const userId = req.user._id.toString();

  try {
    const lesson = await Lesson.findById(lessonId).populate("course");
    if (!lesson) {
      return errorResponse(res, "Lesson not found", 404);
    }

    // Check if user has permission to debug (admin or instructor)
    const course = lesson.course;
    const isInstructor = course.instructor.toString() === userId;
    const isAdmin = req.user.role === "admin";

    if (!isInstructor && !isAdmin) {
      return errorResponse(
        res,
        "Access denied: Admin or instructor access required",
        403
      );
    }

    // Collect debug information
    const debugInfo = {
      lessonId: lesson._id,
      lessonTitle: lesson.title,
      courseId: course._id,
      courseTitle: course.title,
      videoRef: lesson.videoRef,
      hasVideoRef: !!lesson.videoRef,
      hasPublicId: !!lesson.videoRef?.publicId,
      videoRefStructure: lesson.videoRef ? Object.keys(lesson.videoRef) : null,
      // Check for old video fields
      oldVideoFields: {
        video: lesson.video || null,
        videoUrl: lesson.videoUrl || null,
      },
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
    };

    return successResponse(res, "Debug information retrieved", debugInfo);
  } catch (error) {
    logger.error("Debug lesson video error:", error);
    return errorResponse(res, "Failed to retrieve debug information", 500);
  }
});

module.exports = {
  generateStreamingUrl,
  verifyVideoAccess,
  getVideoMetadata,
  debugLessonVideo,
};
