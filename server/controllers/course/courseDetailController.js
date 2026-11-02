const mongoose = require("mongoose");
const isValidObjectId = mongoose.isValidObjectId;
const asyncHandler = require("express-async-handler");
const Course = require("../../models/Course");
const Lesson = require("../../models/lessonModel");
const Comment = require("../../models/Comment");
const Attachment = require("../../models/Attachment");
const Test = require("../../models/Test");
const Category = require("../../models/Category");
const User = require("../../models/User");
const { sendSuccess, sendError } = require("../../utils/apiResponse");
const logger = require("../../utils/logger");

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
  getCourse
};
