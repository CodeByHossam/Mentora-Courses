const logger = require('../utils/logger');
const Grade = require("../models/Grade");
const User = require("../models/User");
const Course = require("../models/Course");
const Test = require("../models/Test");
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
const createTestGrade = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      studentId,
      courseId,
      testId,
      totalPoints,
      earnedPoints,
      Comment,
      feedback,
    } = req.body;
    const instructorId = req.user.id;

    // Debug logging
    logger.info("Create test grade request body:", {
      studentId,
      courseId,
      testId,
      totalPoints: totalPoints,
      earnedPoints: earnedPoints,
      totalPointsType: typeof totalPoints,
      earnedPointsType: typeof earnedPoints,
    });

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

    // Verify test exists and belongs to the course
    const test = await Test.findOne({
      _id: testId,
      course: courseId,
      instructor: instructorId,
    });
    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Test not found or does not belong to this course",
      });
    }

    // Convert to numbers if they're strings
    const totalPointsNum = Number(totalPoints);
    const earnedPointsNum = Number(earnedPoints);

    // Validate points
    if (isNaN(totalPointsNum) || isNaN(earnedPointsNum)) {
      return res.status(400).json({
        success: false,
        message: "Total points and earned points must be valid numbers",
      });
    }

    if (earnedPointsNum > totalPointsNum) {
      return res.status(400).json({
        success: false,
        message: "Earned points cannot exceed total points",
      });
    }

    // Check if test grade already exists
    let grade = await Grade.findOne({
      studentId,
      courseId,
      gradeType: "test_grade",
      "testGrade.testId": testId,
    });

    if (grade) {
      // Update existing test grade
      grade.testGrade.totalPoints = totalPointsNum;
      grade.testGrade.earnedPoints = earnedPointsNum;

      // Calculate percentage manually
      const percentage =
        totalPointsNum > 0
          ? Math.round((earnedPointsNum / totalPointsNum) * 100 * 100) / 100
          : 0;
      grade.testGrade.percentage = percentage;

      grade.Comment = Comment || grade.Comment;
      grade.feedback = feedback || grade.feedback;
      grade.status = "published";
      grade.lastModified = new Date();
      await grade.save();
    } else {
      // Calculate percentage manually before creating the grade
      const percentage =
        totalPointsNum > 0
          ? Math.round((earnedPointsNum / totalPointsNum) * 100 * 100) / 100
          : 0;

      logger.info("Manually calculated percentage:", percentage);

      // Create new test grade
      grade = new Grade({
        studentId,
        courseId,
        instructorId,
        gradeType: "test_grade",
        testGrade: {
          testId,
          testName: test.title,
          testType: test.testType,
          totalPoints: totalPointsNum,
          earnedPoints: earnedPointsNum,
          percentage: percentage,
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
      message: "Test grade saved successfully",
      data: {
        grade,
        calculatedPercentage: grade.calculatedPercentage,
      },
    });
  } catch (error) {
    logger.error("Create test grade error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save test grade",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// @desc    Get all grades for a course (Instructor view)
// @route   GET /api/grades/course/:courseId
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
  createFinalGrade,
  createTestGrade,
  getCourseGrades,
  getCourseTests,
  getStudentGrades,
  getAllStudentGrades,
  deleteGrade,
};
