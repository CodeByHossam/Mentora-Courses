const logger = require('../../utils/logger');
const Grade = require("../../models/Grade");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Test = require("../../models/Test");
const { validationResult } = require("express-validator");

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


module.exports = {
  createTestGrade
};
