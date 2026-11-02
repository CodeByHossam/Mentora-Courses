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

