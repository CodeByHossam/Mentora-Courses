// Test authoring: create, edit and delete tests. Split from testController.js; bodies unchanged.

const logger = require('../../utils/logger');
const Test = require("../../models/Test");
const TestAnswer = require("../../models/TestAnswer");
const validateCourseAccess = require("../../middleware/validateCourseAccess");
const { uploadFile, getFile, deleteFile } = require("../../utils/aws");
const {
  NotFoundError,
  AuthorizationError,
  ValidationError,
} = require("../../utils/errors");

// ----------------------
// GET all interactions (Comment, tests+submissions, attachments)
// ----------------------
// ----------------------

const addTest = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, dueDate, lessonId, testType, totalPoints } =
      req.body;
    const user = req.user;

    if (!title || title.trim().length < 3) {
      throw new ValidationError("Test title must be at least 3 characters");
    }
    if (!req.file) {
      throw new ValidationError("Test file is required");
    }
    if (!testType || !["progress", "final"].includes(testType)) {
      throw new ValidationError(
        "Test type must be either 'progress' or 'final'"
      );
    }
    if (
      !totalPoints ||
      isNaN(totalPoints) ||
      totalPoints < 1 ||
      totalPoints > 1000
    ) {
      throw new ValidationError(
        "Total points must be a number between 1 and 1000"
      );
    }
    // Optional: validate dueDate format early
    if (dueDate && Number.isNaN(Date.parse(dueDate))) {
      throw new ValidationError("Invalid due date");
    }

    await validateCourseAccess(courseId, user, true);

    let fileKey; // <-- hoist to outer scope
    try {
      const { key } = await uploadFile(req.file, "tests"); // uploadFile returns { key }
      fileKey = key;
      logger.info("S3 fileKey:", fileKey);
    } catch (err) {
      logger.error("S3 upload failed:", err);
      throw new ValidationError("Failed to upload test file");
    }

    const test = await Test.create({
      course: courseId,
      instructor: user._id,
      title: title.trim(),
      description: description?.trim() || undefined,
      testType: testType,
      totalPoints: parseInt(totalPoints),
      fileUrl: fileKey,
      dueDate: dueDate ? new Date(dueDate) : null,
      lesson: lessonId || null,
    });

    await test.populate("instructor", "name profilePicture");

    res.status(201).json({
      success: true,
      message: "Test added successfully.",
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

const editTest = async (req, res, next) => {
  try {
    const { courseId, testId } = req.params;
    const { title, description, dueDate, lessonId } = req.body;
    const user = req.user;

    if (!title || title.trim().length < 3) {
      throw new ValidationError("Test title must be at least 3 characters");
    }

    await validateCourseAccess(courseId, user);

    const test = await Test.findById(testId);
    if (!test) {
      throw new NotFoundError("Test not found");
    }

    if (test.course.toString() !== courseId) {
      throw new ValidationError("Test does not belong to this course");
    }

    if (test.instructor.toString() !== user._id.toString()) {
      throw new AuthorizationError("Not authorized to edit this test");
    }

    // Handle file upload if provided
    let fileKey = test.fileUrl;
    if (req.file) {
      try {
        // Upload new file to S3
        const { key } = await uploadFile(req.file, "tests");

        // Delete old file from S3
        if (test.fileUrl) {
          try {
            await deleteFile(test.fileUrl);
          } catch (err) {
            logger.error("Failed to delete old test file from S3:", err);
          }
        }

        fileKey = key;
      } catch (err) {
        throw new ValidationError("Failed to upload test file");
      }
    }

    // Update test
    test.title = title.trim();
    test.description = description?.trim();
    test.fileUrl = fileKey; // save S3 key
    test.dueDate = dueDate ? new Date(dueDate) : null;
    test.lesson = lessonId || null;

    // Ensure totalPoints is set (for backward compatibility with tests created before this field was required)
    if (!test.totalPoints) {
      test.totalPoints = 100; // Default value
    }

    await test.save();
    await test.populate("instructor", "name profilePicture");

    res.status(200).json({
      success: true,
      message: "Test updated successfully.",
      data: test,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTest = async (req, res, next) => {
  try {
    const { courseId, testId } = req.params;
    const user = req.user;

    await validateCourseAccess(courseId, user, true);

    const test = await Test.findById(testId);
    if (!test) {
      throw new NotFoundError("Test not found");
    }

    if (test.course.toString() !== courseId) {
      throw new ValidationError("Test does not belong to this course");
    }

    if (
      test.instructor.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      throw new AuthorizationError("Not authorized to delete this test");
    }

    // Delete file from S3 if exists
    if (test.fileUrl) {
      try {
        await deleteFile(test.fileUrl); // your util handles extracting the key + deleting
      } catch (err) {
        logger.error("Failed to delete test file from S3:", err);
      }
    }

    // Delete test answers linked to this test
    await TestAnswer.deleteMany({ test: testId });

    await test.deleteOne();

    res.status(200).json({
      success: true,
      message: "Test deleted successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload answer key for a test
// @route   POST /api/courses/:courseId/tests/:testId/answer-key
// @access  Private (Instructor only)


module.exports = {
  addTest,
  editTest,
  deleteTest
};
