const Comment = require("../models/Comment");
const Test = require("../models/Test");
const TestAnswer = require("../models/TestAnswer");
const Attachment = require("../models/Attachment");
const validateCourseAccess = require("../middleware/validateCourseAccess");
const { uploadFile, getFile, deleteFile } = require("../utils/aws");

const {
  NotFoundError,
  AuthorizationError,
  ValidationError,
} = require("../utils/errors");

// ----------------------
// GET all interactions (Comment, tests+submissions, attachments)
// ----------------------
// ----------------------
// GET all interactions (Comment, tests+submissions, attachments)
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
            console.error(
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
            console.error(
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
                console.error(
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
            console.error(
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
exports.addComment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { content, lessonId, parentCommentId } = req.body;
    const user = req.user;

    if (!content || content.trim().length < 1) {
      throw new ValidationError("Comment content is required");
    }

    await validateCourseAccess(courseId, user);

    const commentData = {
      course: courseId,
      user: user._id,
      content: content.trim(),
      lesson: lessonId || null,
    };

    // If this is a reply to another comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        throw new NotFoundError("Parent comment not found");
      }
      if (parentComment.course.toString() !== courseId) {
        throw new ValidationError(
          "Parent comment does not belong to this course"
        );
      }

      // Add reply to parent comment
      parentComment.responses.push({
        content: content.trim(),
        user: user._id,
      });

      await parentComment.save();
      await parentComment.populate("user", "name email profilePicture");
      await parentComment.populate(
        "responses.user",
        "name email profilePicture"
      );

      res.status(201).json({
        success: true,
        message: "Reply added successfully.",
        data: parentComment,
      });
    } else {
      // Create new comment
      const newComment = await Comment.create(commentData);
      await newComment.populate("user", "name email profilePicture");

      res.status(201).json({
        success: true,
        message: "Comment added successfully.",
        data: newComment,
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.editComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content, replyId } = req.body;
    const user = req.user;

    if (!content || content.trim().length < 1) {
      throw new ValidationError("Comment content is required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new NotFoundError("Comment not found");
    }

    // If editing a reply
    if (replyId) {
      const reply = comment.responses.id(replyId);
      if (!reply) {
        throw new NotFoundError("Reply not found");
      }

      if (reply.user.toString() !== user._id.toString()) {
        throw new AuthorizationError("Not authorized to edit this reply");
      }

      reply.content = content.trim();
      reply.edited = true;
      reply.editedAt = new Date();
    } else {
      // Editing main comment
      if (comment.user.toString() !== user._id.toString()) {
        throw new AuthorizationError("Not authorized to edit this comment");
      }

      comment.content = content.trim();
      comment.edited = true;
      comment.editedAt = new Date();
    }

    await comment.save();
    await comment.populate("user", "name profilePicture");
    await comment.populate("responses.user", "name profilePicture");

    res.status(200).json({
      success: true,
      message: replyId
        ? "Reply edited successfully."
        : "Comment edited successfully.",
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @description Delete a comment or a reply
 * @route DELETE /api/Comment/:commentId?replyId=:replyId
 * @access Private
 * @param {string} commentId The id of the comment to delete
 * @param {string} [replyId] The id of the reply to delete (optional)
 * @returns {object} A JSON response with a success message and the deleted comment/reply data
 */
exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { replyId } = req.query;
    const user = req.user;
    const isAdmin = user.role === "admin";

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new NotFoundError("Comment not found");
    }

    // If deleting a reply
    if (replyId) {
      const reply = comment.responses.id(replyId);
      if (!reply) {
        throw new NotFoundError("Reply not found");
      }

      if (!isAdmin && reply.user.toString() !== user._id.toString()) {
        throw new AuthorizationError("Not authorized to delete this reply");
      }

      comment.responses.pull(replyId);
    } else {
      // Deleting main comment
      if (!isAdmin && comment.user.toString() !== user._id.toString()) {
        throw new AuthorizationError("Not authorized to delete this comment");
      }

      await comment.deleteOne();
    }

    if (replyId) {
      await comment.save();
      await comment.populate("user", "name profilePicture");
      await comment.populate("responses.user", "name profilePicture");

      res.status(200).json({
        success: true,
        message: "Reply deleted successfully.",
        data: comment,
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Comment deleted successfully.",
        data: null,
      });
    }
  } catch (error) {
    next(error);
  }
};

// ----------------------
// TESTS CRUD
// ----------------------
exports.addTest = async (req, res, next) => {
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
      console.log("S3 fileKey:", fileKey);
    } catch (err) {
      console.error("S3 upload failed:", err);
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

exports.editTest = async (req, res, next) => {
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
            console.error("Failed to delete old test file from S3:", err);
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

exports.deleteTest = async (req, res, next) => {
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
        console.error("Failed to delete test file from S3:", err);
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
exports.uploadAnswerKey = async (req, res, next) => {
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
        console.error("Failed to delete old answer key from S3:", err);
      }
    }

    let fileKey;
    try {
      const { key } = await uploadFile(req.file, "answer-keys");
      fileKey = key;
      console.log("Answer key S3 fileKey:", fileKey);
    } catch (err) {
      console.error("S3 upload failed:", err);
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
exports.downloadAnswerKey = async (req, res, next) => {
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
      const Grade = require("../models/Grade");
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
exports.submitTestAnswer = async (req, res, next) => {
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
          console.error("Failed to delete old answer file from S3:", err);
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

exports.gradeTestSubmission = async (req, res, next) => {
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

exports.deleteTestAnswer = async (req, res, next) => {
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
        console.error("Failed to delete answer file from S3:", err);
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

// ----------------------
// ATTACHMENTS CRUD
// ----------------------
// Helper function to determine file type from filename and mimetype
function getFileTypeFromName(filename, mimetype) {
  if (!filename || !mimetype) return "unknown";

  // Get file extension
  const ext = filename.split(".").pop().toLowerCase();

  // Common file types mapping
  const typeMap = {
    // Images
    jpg: "image",
    jpeg: "image",
    png: "image",
    gif: "image",
    svg: "image",
    // Documents
    pdf: "document",
    doc: "document",
    docx: "document",
    txt: "document",
    // Videos
    mp4: "video",
    avi: "video",
    mov: "video",
    wmv: "video",
    // Audio
    mp3: "audio",
    wav: "audio",
    ogg: "audio",
    // Archives
    zip: "archive",
    rar: "archive",
    "7z": "archive",
    // Spreadsheets
    xls: "spreadsheet",
    xlsx: "spreadsheet",
    csv: "spreadsheet",
    // Presentations
    ppt: "presentation",
    pptx: "presentation",
  };

  // First try to get type from extension
  if (typeMap[ext]) {
    return typeMap[ext];
  }

  // If extension not found, try to determine from mimetype
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  if (mimetype.includes("pdf")) return "document";
  if (mimetype.includes("document")) return "document";
  if (mimetype.includes("sheet")) return "spreadsheet";
  if (mimetype.includes("presentation")) return "presentation";

  return "unknown";
}

exports.addAttachment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, lessonId } = req.body;
    const user = req.user;

    if (!req.file) throw new ValidationError("File is required");
    await validateCourseAccess(courseId, user);

    let fileKey;
    try {
      const { key } = await uploadFile(req.file, "attachments");
      fileKey = key;
    } catch (err) {
      console.error("S3 upload failed:", err);
      throw new ValidationError("Failed to upload file");
    }

    const attachmentData = {
      title: title || req.file.originalname,
      description: description?.trim(),
      lesson: lessonId || null,
      fileUrl: fileKey,
      fileSize: req.file.size,
      uploadedBy: user._id,
      course: courseId,
    };

    const newAttachment = await Attachment.create(attachmentData);
    await newAttachment.populate("uploadedBy", "name profilePicture");

    res.status(201).json({
      success: true,
      message: "Attachment added successfully.",
      data: newAttachment,
    });
  } catch (error) {
    next(error);
  }
};

exports.editAttachment = async (req, res, next) => {
  try {
    const { courseId, attachmentId } = req.params;
    const { title, description, lessonId } = req.body;
    const user = req.user;

    await validateCourseAccess(courseId, user);

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) throw new NotFoundError("Attachment not found");
    if (attachment.course.toString() !== courseId)
      throw new ValidationError("Attachment does not belong to this course");

    if (
      attachment.uploadedBy.toString() !== user._id.toString() &&
      user.role !== "admin"
    )
      throw new AuthorizationError("Not authorized to edit this attachment");

    let fileUrl = attachment.fileUrl;
    let fileType = attachment.fileType;
    let fileSize = attachment.fileSize;

    if (req.file) {
      try {
        const uploadResult = await uploadFile(req.file, "attachments");

        if (attachment.fileUrl) {
          try {
            await deleteFile(attachment.fileUrl);
          } catch (err) {
            console.error("Failed to delete old attachment:", err);
          }
        }

        fileUrl = uploadResult.key;
        fileType = getFileTypeFromName(
          req.file.originalname,
          req.file.mimetype
        );
        fileSize = req.file.size;
      } catch (err) {
        throw new ValidationError("Failed to upload file");
      }
    }

    attachment.title = title || attachment.title;
    attachment.description = description?.trim();
    attachment.lesson = lessonId || null;
    attachment.fileUrl = fileUrl;
    attachment.fileType = fileType;
    attachment.fileSize = fileSize;

    await attachment.save();
    await attachment.populate("uploadedBy", "name profilePicture");

    res.status(200).json({
      success: true,
      message: "Attachment updated successfully.",
      data: attachment,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeAttachment = async (req, res, next) => {
  try {
    const { courseId, attachmentId } = req.params;
    const user = req.user;
    const isAdmin = user.role === "admin";

    await validateCourseAccess(courseId, user);

    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) throw new NotFoundError("Attachment not found");
    if (attachment.course.toString() !== courseId)
      throw new ValidationError("Attachment does not belong to this course");

    if (!isAdmin && attachment.uploadedBy.toString() !== user._id.toString())
      throw new AuthorizationError("Not authorized to delete this attachment");

    if (attachment.fileUrl) {
      try {
        await deleteFile(attachment.fileUrl);
      } catch (err) {
        console.error("Failed to delete attachment:", err);
      }
    }

    await attachment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Attachment removed successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllAttachments = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    await validateCourseAccess(courseId, req.user);

    const attachments = await Attachment.find({ course: courseId }).populate(
      "uploadedBy",
      "name profilePicture"
    );

    const attachmentsWithSignedUrls = await Promise.all(
      attachments.map(async (attachment) => {
        let signedUrl = null;
        if (attachment.fileUrl) {
          try {
            signedUrl = await getFile(attachment.fileUrl, 300);
          } catch (err) {
            console.error("Failed to generate signed URL:", err);
          }
        }
        return { ...attachment.toObject(), signedUrl };
      })
    );

    res.status(200).json({
      success: true,
      message: "Attachments fetched successfully.",
      data: attachmentsWithSignedUrls,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAttachment = async (req, res, next) => {
  try {
    const { courseId, attachmentId } = req.params;
    await validateCourseAccess(courseId, req.user);

    const attachment = await Attachment.findById(attachmentId).populate(
      "uploadedBy",
      "name profilePicture"
    );

    if (!attachment) throw new NotFoundError("Attachment not found");

    let signedUrl = null;
    if (attachment.fileUrl) {
      try {
        signedUrl = await getFile(attachment.fileUrl, 300);
      } catch (err) {
        console.error("Failed to generate signed URL:", err);
      }
    }

    res.status(200).json({
      success: true,
      message: "Attachment fetched successfully.",
      data: { ...attachment.toObject(), signedUrl },
    });
  } catch (error) {
    next(error);
  }
};
