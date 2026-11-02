// Test answer-key upload and download. Split from testController.js; bodies unchanged.

const Test = require("../../models/Test");
const validateCourseAccess = require("../../middleware/validateCourseAccess");
const { uploadFile, getFile, deleteFile } = require("../../utils/aws");
const {
  NotFoundError,
  AuthorizationError,
  ValidationError,
} = require("../../utils/errors");

const uploadAnswerKey = async (req, res, next) => {
  try {
    const { courseId, testId } = req.params;
    const user = req.user;

    if (!req.file) {
      throw new ValidationError("Answer key file is required");
    }

    await validateCourseAccess(courseId, user, true);

    const test = await Test.findById(testId);
    if (!test) {
      throw new NotFoundError("Test not found");
    }

    if (test.course.toString() !== courseId) {
      throw new ValidationError("Test does not belong to this course");
    }

    if (test.instructor.toString() !== user._id.toString()) {
      throw new AuthorizationError(
        "Not authorized to upload answer key for this test"
      );
    }

    // Delete old answer key if exists
    if (test.answerKey) {
      try {
        await deleteFile(test.answerKey);
      } catch (err) {
        logger.error("Failed to delete old answer key from S3:", err);
      }
    }

    let fileKey;
    try {
      const { key } = await uploadFile(req.file, "answer-keys");
      fileKey = key;
      logger.info("Answer key S3 fileKey:", fileKey);
    } catch (err) {
      logger.error("S3 upload failed:", err);
      throw new ValidationError("Failed to upload answer key file");
    }

    // Update test with answer key
    test.answerKey = fileKey;

    // Ensure totalPoints is set (for backward compatibility with tests created before this field was required)
    if (!test.totalPoints) {
      test.totalPoints = 100; // Default value
    }

    await test.save();

    res.status(200).json({
      success: true,
      message: "Answer key uploaded successfully.",
      data: {
        testId: test._id,
        answerKey: fileKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download answer key for a test
// @route   GET /api/course-interactions/:courseId/tests/:testId/answer-key/download
// @access  Private (Instructor and Students with grades)

const downloadAnswerKey = async (req, res, next) => {
  try {
    const { courseId, testId } = req.params;
    const user = req.user;

    await validateCourseAccess(courseId, user);

    const test = await Test.findById(testId);
    if (!test) {
      throw new NotFoundError("Test not found");
    }

    if (test.course.toString() !== courseId) {
      throw new ValidationError("Test does not belong to this course");
    }

    if (!test.answerKey) {
      return res.status(404).json({
        success: false,
        message: "Answer key not found for this test",
      });
    }

    // Check permissions
    if (user.role === "instructor") {
      // Instructors can download if they own the course
      if (test.instructor.toString() !== user._id.toString()) {
        throw new AuthorizationError(
          "Not authorized to download answer key for this test"
        );
      }
    } else if (user.role === "student") {
      // Students can download only if they have a grade for this test
      const Grade = require("../../models/Grade");
      const studentGrade = await Grade.findOne({
        studentId: user._id,
        courseId,
        gradeType: "test_grade",
        "testGrade.testId": testId,
        status: "published",
      });

      if (!studentGrade) {
        return res.status(403).json({
          success: false,
          message:
            "You must complete and receive a grade for this test before downloading the answer key",
        });
      }
    } else {
      throw new AuthorizationError("Not authorized to download answer key");
    }

    // Generate download URL
    const downloadUrl = `/api/files/${test.answerKey}`;

    res.json({
      success: true,
      message: "Answer key download URL generated",
      data: {
        downloadUrl,
        fileName: `answer-key-${test.title}.pdf`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------
// TEST ANSWERS CRUD
// ----------------------


module.exports = {
  uploadAnswerKey,
  downloadAnswerKey
};
