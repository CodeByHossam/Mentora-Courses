const logger = require('../../utils/logger');
const Grade = require("../../models/Grade");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Test = require("../../models/Test");
const { validationResult } = require("express-validator");

/**
 * GRADE MANAGEMENT CONTROLLER
 *
 * Handles all grading operations including:
 * - Final course grades
 * - Individual test/assignment grades
 * - Grade calculations and statistics
 * - Student grade viewing
 */

// @desc    Create or update a final grade for a student
// @route   POST /api/grades/final
// @access  Private (Instructor only)

const createFinalGrade = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { studentId, courseId, percentage, Comment, feedback } = req.body;
    const instructorId = req.user.id;

    // Verify instructor owns the course
    const course = await Course.findOne({
      _id: courseId,
      instructor: instructorId,
    });
    if (!course) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to grade this course",
      });
    }

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if final grade already exists
    let grade = await Grade.findOne({
      studentId,
      courseId,
      gradeType: "final_grade",
    });

    if (grade) {
      // Update existing grade
      grade.finalGrade.percentage = percentage;
      grade.Comment = Comment || grade.Comment;
      grade.feedback = feedback || grade.feedback;
      grade.status = "published";
      grade.lastModified = new Date();
      await grade.save();
    } else {
      // Create new grade
      grade = new Grade({
        studentId,
        courseId,
        instructorId,
        gradeType: "final_grade",
        finalGrade: {
          percentage,
        },
        Comment,
        feedback,
        status: "published",
      });
      await grade.save();
    }

    // Populate grade with student and course info
    await grade.populate([
      { path: "studentId", select: "name email profilePicture" },
      { path: "courseId", select: "title" },
    ]);

    res.status(200).json({
      success: true,
      message: "Final grade saved successfully",
      data: {
        grade,
        letterGrade: grade.finalGrade.letter,
        gpa: grade.finalGrade.gpa,
      },
    });
  } catch (error) {
    logger.error("Create final grade error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save final grade",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Create or update a test grade for a student
// @route   POST /api/grades/test
// @access  Private (Instructor only)


const deleteGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;
    const instructorId = req.user.id;

    // Find the grade
    const grade = await Grade.findById(gradeId);
    if (!grade) {
      return res.status(404).json({
        success: false,
        message: "Grade not found",
      });
    }

    // Verify instructor owns the grade
    if (grade.instructorId.toString() !== instructorId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this grade",
      });
    }

    await Grade.findByIdAndDelete(gradeId);

    res.status(200).json({
      success: true,
      message: "Grade deleted successfully",
    });
  } catch (error) {
    logger.error("Delete grade error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete grade",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get all tests for a course (for grading form)
// @route   GET /api/grades/course/:courseId/tests
// @access  Private (Instructor only)


module.exports = {
  createFinalGrade,
  deleteGrade
};
