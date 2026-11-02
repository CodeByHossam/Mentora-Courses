// Student submissions and instructor grading. Split from testController.js; bodies unchanged.

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

const submitTestAnswer = async (req, res, next) => {
  try {
    const { courseId, testId } = req.params;
    const user = req.user;

    if (!req.file) {
      throw new ValidationError("Answer file is required");
    }

    await validateCourseAccess(courseId, user);

    const test = await Test.findById(testId);
    if (!test) {
      throw new NotFoundError("Test not found");
    }

    if (test.course.toString() !== courseId) {
      throw new ValidationError("Test does not belong to this course");
    }

    let fileKey;
    try {
      fileKey = await uploadFile(req.file, "answers");
    } catch (err) {
      throw new ValidationError("Failed to upload answer file");
    }

    // Check if submission already exists by this student for this test
    let submission = await TestAnswer.findOne({
      test: testId,
      student: user._id,
    });

    if (submission) {
      // Delete old file from S3 if exists
      if (submission.answerFileUrl) {
        try {
          await deleteFile(submission.answerFileUrl);
        } catch (err) {
          logger.error("Failed to delete old answer file from S3:", err);
        }
      }

      submission.answerFileUrl = fileKey;
      submission.submittedAt = new Date();
    } else {
      // Create new submission
      submission = new TestAnswer({
        test: testId,
        student: user._id,
        answerFileUrl: fileKey,
        submittedAt: new Date(),
      });
    }

    await submission.save();
    await submission.populate("student", "name profilePicture");

    res.status(201).json({
      success: true,
      message: "Test answer submitted successfully.",
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

const gradeTestSubmission = async (req, res, next) => {
  try {
    const { courseId, testId, submissionId } = req.params;
    const { grade, feedback } = req.body;
    const user = req.user;

    await validateCourseAccess(courseId, user, true);

    const test = await Test.findById(testId);
    if (!test) throw new NotFoundError("Test not found");
    if (test.course.toString() !== courseId)
      throw new ValidationError("Test does not belong to this course");

    const submission = await TestAnswer.findById(submissionId);
    if (!submission) throw new NotFoundError("Submission not found");
    if (submission.test.toString() !== testId)
      throw new ValidationError("Submission does not belong to this test");

    if (grade !== undefined) submission.grade = grade;
    if (feedback !== undefined) submission.feedback = feedback;
    submission.gradedAt = new Date();

    await submission.save();

    res.status(200).json({
      success: true,
      message: "Test submission graded successfully.",
      data: submission,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTestAnswer = async (req, res, next) => {
  try {
    const { courseId, testId, submissionId } = req.params;
    const user = req.user;
    const isAdmin = user.role === "admin";

    await validateCourseAccess(courseId, user);

    const test = await Test.findById(testId);
    if (!test) throw new NotFoundError("Test not found");
    if (test.course.toString() !== courseId)
      throw new ValidationError("Test does not belong to this course");

    const submission = await TestAnswer.findById(submissionId);
    if (!submission) throw new NotFoundError("Submission not found");
    if (submission.test.toString() !== testId)
      throw new ValidationError("Submission does not belong to this test");

    // Only the student who submitted or admin can delete
    if (!isAdmin && submission.student.toString() !== user._id.toString()) {
      throw new AuthorizationError("Not authorized to delete this answer");
    }

    // Delete answer file from S3
    if (submission.answerFileUrl) {
      try {
        await deleteFile(submission.answerFileUrl);
      } catch (err) {
        logger.error("Failed to delete answer file from S3:", err);
      }
    }

    await submission.deleteOne();

    res.status(200).json({
      success: true,
      message: "Answer deleted successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitTestAnswer,
  gradeTestSubmission,
  deleteTestAnswer
};
