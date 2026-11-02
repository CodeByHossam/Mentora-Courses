// Grade queries for a student. Split from gradeQueryController.js; bodies unchanged.

const logger = require('../../utils/logger');
const Grade = require("../../models/Grade");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Test = require("../../models/Test");
const { validationResult } = require("express-validator");

const getStudentGrades = async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Get student's grades for the course
    const grades = await Grade.find({
      studentId,
      courseId,
      status: "published",
      isVisible: true,
    })
      .populate("courseId", "title")
      .populate("instructorId", "name")
      .sort({ gradedAt: -1 });

    // Get course summary
    const summary = await Grade.getStudentCourseSummary(studentId, courseId);

    res.status(200).json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          instructor: course.instructor,
        },
        grades,
        summary,
        finalGrade: summary.finalGrade,
        testGrades: summary.testGrades,
        testAverage: summary.testAverage,
        totalTests: summary.totalTests,
      },
    });
  } catch (error) {
    logger.error("Get student grades error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve grades",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get all grades for a student across all courses
// @route   GET /api/grades/student
// @access  Private (Student only)

const getAllStudentGrades = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get all grades for the student
    const grades = await Grade.find({
      studentId,
      status: "published",
      isVisible: true,
    })
      .populate("courseId", "title")
      .populate("instructorId", "name")
      .sort({ courseId: 1, gradedAt: -1 });

    // Group grades by course
    const courseGrades = {};
    grades.forEach((grade) => {
      const courseId = grade.courseId._id.toString();
      if (!courseGrades[courseId]) {
        courseGrades[courseId] = {
          course: grade.courseId,
          instructor: grade.instructorId,
          finalGrade: null,
          testGrades: [],
          summary: null,
        };
      }

      if (grade.gradeType === "final_grade") {
        courseGrades[courseId].finalGrade = grade;
      } else if (grade.gradeType === "test_grade") {
        courseGrades[courseId].testGrades.push(grade);
      }
    });

    // Calculate summaries and GPA
    let totalGradePoints = 0;
    let totalCredits = 0;

    for (const courseId in courseGrades) {
      const summary = await Grade.getStudentCourseSummary(studentId, courseId);
      courseGrades[courseId].summary = summary;

      // Calculate GPA (assuming each course is worth 3 credits)
      if (summary.finalGrade) {
        totalGradePoints += summary.finalGrade.finalGrade.gpa * 3;
        totalCredits += 3;
      }
    }

    const overallGPA =
      totalCredits > 0
        ? Math.round((totalGradePoints / totalCredits) * 100) / 100
        : 0;

    res.status(200).json({
      success: true,
      data: {
        courseGrades: Object.values(courseGrades),
        overallGPA,
        totalCourses: Object.keys(courseGrades).length,
        totalCredits,
      },
    });
  } catch (error) {
    logger.error("Get all student grades error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve grades",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Delete a grade
// @route   DELETE /api/grades/:gradeId
// @access  Private (Instructor only)


module.exports = {
  getStudentGrades,
  getAllStudentGrades
};
