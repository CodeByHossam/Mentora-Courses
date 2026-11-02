const logger = require('../../utils/logger');
const Comment = require("../../models/Comment");
const Test = require("../../models/Test");
const TestAnswer = require("../../models/TestAnswer");
const Attachment = require("../../models/Attachment");
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

exports.getCourseInteractions = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    await validateCourseAccess(courseId, user);

    // Comment
    const Comment = await Comment.find({ course: courseId })
      .populate("user", "name email role profilePicture")
      .sort({ createdAt: -1 });

    const tests = await Test.find({ course: courseId })
      .populate("instructor", "name profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    const testsWithSignedUrls = await Promise.all(
      tests.map(async (test) => {
        let signedUrl = null;
        let answerKeySignedUrl = null;

        if (test.fileUrl) {
          try {
            signedUrl = await getFile(test.fileUrl, 300);
          } catch (err) {
            logger.error(
              "Failed to generate signed URL for test:",
              test._id,
              err
            );
          }
        }

        if (test.answerKey) {
          try {
            answerKeySignedUrl = await getFile(test.answerKey, 300);
          } catch (err) {
            logger.error(
              "Failed to generate signed URL for answer key:",
              test._id,
              err
            );
          }
        }

        return { ...test, signedUrl, answerKeySignedUrl };
      })
    );

    const testsWithSubmissions = await Promise.all(
      testsWithSignedUrls.map(async (test) => {
        const submissions = await TestAnswer.find({ test: test._id })
          .populate("student", "name profilePicture")
          .sort({ submittedAt: -1 });

        // Add signed URL to submissions
        const submissionsWithSignedUrls = await Promise.all(
          submissions.map(async (sub) => {
            let signedUrl = null;
            if (sub.answerFileUrl) {
              try {
                signedUrl = await getFile(sub.answerFileUrl, 300);
              } catch (err) {
                logger.error(
                  "Failed to generate signed URL for submission:",
                  sub._id,
                  err
                );
              }
            }
            return { ...sub.toObject(), signedUrl };
          })
        );

        return { ...test, submissions: submissionsWithSignedUrls };
      })
    );

    // Attachments
    const attachments = await Attachment.find({ course: courseId })
      .populate("uploadedBy", "name profilePicture")
      .sort({ createdAt: -1 })
      .lean();

    const attachmentsWithSignedUrls = await Promise.all(
      attachments.map(async (attachment) => {
        let signedUrl = null;
        if (attachment.fileUrl) {
          try {
            signedUrl = await getFile(attachment.fileUrl, 300);
          } catch (err) {
            logger.error(
              "Failed to generate signed URL for attachment:",
              attachment._id,
              err
            );
          }
        }
        return { ...attachment, signedUrl };
      })
    );

    res.status(200).json({
      success: true,
      message: "Course interactions fetched successfully.",
      data: {
        Comment,
        tests: testsWithSubmissions,
        attachments: attachmentsWithSignedUrls,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------
// Comment CRUD
// ----------------------

