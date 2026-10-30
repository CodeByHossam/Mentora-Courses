/**
 * Course Update Controller
 *
 * Handles course update and deletion operations.
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
const parseTopics = require("../../utils/parseTopics");

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

    const isOwner = course.instructor.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this course",
      });
    }

    const updates = { ...req.body };

    if (updates.category && typeof updates.category === "string") {
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

    if (updates.topics !== undefined) {
      updates.topics = parseTopics(updates.topics);
    }

    if (req.file) {
      const resourceType = getResourceType(req.file.mimetype);
      const uploadRes = await uploadToCloudinary(
        req.file.buffer,
        "courses",
        resourceType
      );

      if (course.imagePublicId) {
        try {
          await deleteFromCloudinary(course.imagePublicId, "image");
        } catch (e) {
          logger.warn("Failed to delete old course image:", e?.message || e);
        }
      }

      updates.imageUrl = uploadRes.secure_url;
      updates.imagePublicId = uploadRes.public_id;
    } else if (updates.imageUrl) {
      if (updates.imageUrl !== course.imageUrl && course.imagePublicId) {
        try {
          await deleteFromCloudinary(course.imagePublicId, "image");
        } catch (e) {
          logger.warn("Failed to delete old course image:", e?.message || e);
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
    logger.error("updateCourse error:", err);
    res.status(500).json({ success: false, message: "Error updating course" });
  }
});

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

    const isOwner =
      course.instructor._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this course",
      });
    }

    const validationErrors = [];

    if (course.enrolledStudents && course.enrolledStudents.length > 0) {
      validationErrors.push(
        `Cannot delete course with ${course.enrolledStudents.length} enrolled students`
      );
    }

    const LiveSession = require("../../models/LiveSession");
    const activeSessions = await LiveSession.find({
      course: id,
      status: { $in: ["scheduled", "live"] },
    });
    if (activeSessions.length > 0) {
      validationErrors.push(
        `Cannot delete course with ${activeSessions.length} active live sessions`
      );
    }

    const Payment = require("../../models/Payment");
    const pendingPayments = await Payment.find({
      course: id,
      status: { $in: ["pending", "processing"] },
    });
    if (pendingPayments.length > 0) {
      validationErrors.push(
        `Cannot delete course with ${pendingPayments.length} pending payments`
      );
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete course due to existing relationships",
        errors: validationErrors,
      });
    }

    await Test.deleteMany({ course: course._id });
    await Comment.deleteMany({ course: course._id });
    await Attachment.deleteMany({ course: course._id });

    const EnrollmentRequest = require("../../models/EnrollmentRequest");
    await EnrollmentRequest.deleteMany({ course: course._id });

    const lessons = await Lesson.find({ course: course._id });
    for (const lesson of lessons) {
      if (lesson.image) {
        try {
          const imageMatch = lesson.image.match(/\/upload\/(?:v\d+\/)?(.+?)\.([a-z0-9]+)/i);
          if (imageMatch && imageMatch[1]) {
            await deleteFromCloudinary(imageMatch[1], "image");
          }
        } catch (error) {
          logger.error(`Failed to delete lesson image: ${error.message}`);
        }
      }
      if (lesson.videoRef?.publicId) {
        try {
          const videoService = require("../../services/videoService");
          await videoService.deleteVideo(lesson.videoRef.publicId);
        } catch (error) {
          logger.error(`Failed to delete lesson video: ${error.message}`);
        }
      }
      if (lesson.pdfUrl) {
        try {
          const pdfMatch = lesson.pdfUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.([a-z0-9]+)/i);
          if (pdfMatch && pdfMatch[1]) {
            await deleteFromCloudinary(pdfMatch[1], "raw");
          }
        } catch (error) {
          logger.error(`Failed to delete lesson PDF: ${error.message}`);
        }
      }
    }
    await Lesson.deleteMany({ course: course._id });

    const { deleteFile } = require("../../utils/aws");
    const attachments = await Attachment.find({ course: course._id });
    for (const attachment of attachments) {
      if (attachment.fileUrl) {
        try {
          await deleteFile(attachment.fileUrl);
        } catch (error) {
          logger.error(`Failed to delete attachment from S3: ${error.message}`);
        }
      }
    }
    await Attachment.deleteMany({ course: course._id });

    if (course.image) {
      try {
        const imageMatch = course.image.match(/\/upload\/(?:v\d+\/)?(.+?)\.([a-z0-9]+)/i);
        if (imageMatch && imageMatch[1]) {
          await deleteFromCloudinary(imageMatch[1], "image");
        }
      } catch (error) {
        logger.error(`Failed to delete course image: ${error.message}`);
      }
    }

    await Course.findByIdAndDelete(course._id);

    logger.info(
      `Course "${course.title}" deleted by ${req.user.role} ${req.user.name}`
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
    logger.error("Course deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete course",
      error: error.message,
    });
  }
});

module.exports = {
  updateCourse,
  deleteCourse,
};
