// Grade queries for a course (grades + tests). Split from gradeQueryController.js; bodies unchanged.

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

const getCourseGrades = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.id;
    logger.info(
      "Getting grades for course:",
      courseId,
      "instructor:",
      instructorId
    );

    // Verify instructor owns the course
    const course = await Course.findOne({
      _id: courseId,
      instructor: instructorId,
    });
    if (!course) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view grades for this course",
      });
    }

    // Get all enrolled students for this course
    const enrolledStudents = course.enrolledStudents || [];
    logger.info("Enrolled students:", enrolledStudents.length);

    // Get all grades for the course
    const grades = await Grade.find({ courseId, status: "published" })
      .populate("studentId", "name email profilePicture")
      .populate("courseId", "title")
      .sort({ "studentId.name": 1, gradeType: 1 });

    logger.info("Found grades:", grades.length);

    // Group grades by student
    const studentGrades = {};

    // First, create entries for all enrolled students (even those without grades)
    for (const studentId of enrolledStudents) {
      const student = await User.findById(studentId).select(
        "name email profilePicture"
      );
      if (student) {
        studentGrades[studentId.toString()] = {
          student: student,
          finalGrade: null,
          testGrades: [],
          summary: null,
        };
      }
    }

    // Then, add grades to the appropriate students
    grades.forEach((grade) => {
      const studentId = grade.studentId._id.toString();
      if (!studentGrades[studentId]) {
        // Student has grades but isn't in enrolled list (edge case)
        studentGrades[studentId] = {
          student: grade.studentId,
          finalGrade: null,
          testGrades: [],
          summary: null,
        };
      }

      if (grade.gradeType === "final_grade") {
        studentGrades[studentId].finalGrade = grade;
      } else if (grade.gradeType === "test_grade") {
        studentGrades[studentId].testGrades.push(grade);
      }
    });

    // Calculate summaries for each student
    for (const studentId in studentGrades) {
      try {
        const summary = await Grade.getStudentCourseSummary(
          studentId,
          courseId
        );
        studentGrades[studentId].summary = summary;
      } catch (summaryError) {
        logger.error(
          "Error calculating summary for student:",
          studentId,
          summaryError
        );
        studentGrades[studentId].summary = {
          finalGrade: null,
          testGrades: [],
          testAverage: null,
          totalTests: 0,
        };
      }
    }

    // Get course statistics
    let statistics = [];
    try {
      statistics = await Grade.getCourseStatistics(courseId);
    } catch (statsError) {
      logger.error("Error getting course statistics:", statsError);
      statistics = [];
    }

    res.status(200).json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
        },
        studentGrades: Object.values(studentGrades),
        statistics,
        totalStudents: Object.keys(studentGrades).length,
      },
    });
  } catch (error) {
    logger.error("Get course grades error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve course grades",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get student's grades for a course (Student view)
// @route   GET /api/grades/student/:courseId
// @access  Private (Student only)


const getCourseTests = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user.id;

    // Verify instructor owns the course
    const course = await Course.findOne({
      _id: courseId,
      instructor: instructorId,
    });
    if (!course) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view tests for this course",
      });
    }

    // Get all tests for the course
    const tests = await Test.find({
      course: courseId,
      instructor: instructorId,
    })
      .select("_id title testType description dueDate createdAt")
      .sort({ createdAt: -1 });

    // Separate tests by type
    const progressTests = tests.filter((test) => test.testType === "progress");
    const finalTests = tests.filter((test) => test.testType === "final");

    res.status(200).json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
        },
        tests,
        progressTests,
        finalTests,
        totalTests: tests.length,
        totalProgressTests: progressTests.length,
        totalFinalTests: finalTests.length,
      },
    });
  } catch (error) {
    logger.error("Get course tests error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve course tests",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};


module.exports = {
  getCourseGrades,
  getCourseTests
};
