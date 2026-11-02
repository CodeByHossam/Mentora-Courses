const logger = require('../../utils/logger');
const Message = require("../../models/Message");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Notification = require("../../models/Notification");
const { validationResult } = require("express-validator");

/**
 * Get user's conversations
 * @route GET /api/messages/conversations
 * @access Private
 */

const sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const senderId = req.user.id;
    const {
      receiverId,
      courseId,
      subject,
      content,
      messageType,
      priority,
      parentMessageId,
    } = req.body;

    // Provide default subject for replies if not provided
    const messageSubject = subject || "Re: Message";

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    // Enforce messaging rules
    const sender = req.user;
    if (sender.role === "student") {
      // Students can only message instructors and admins
      if (receiver.role !== "instructor" && receiver.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Students can only send messages to instructors or admins",
        });
      }

      // Verify student is enrolled in at least one course with this instructor (not required for admin)
      if (receiver.role === "instructor") {
        const enrolledCourse = await Course.findOne({
          instructor: receiverId,
          enrolledStudents: senderId,
        });

        if (!enrolledCourse) {
          return res.status(403).json({
            success: false,
            message:
              "You can only message instructors of courses you are enrolled in",
          });
        }
      }
    } else if (sender.role === "instructor") {
      // Instructors can message students (enrolled in their courses) and admins
      if (receiver.role === "student") {
        // Verify student is enrolled in instructor's course
        const enrolledCourse = await Course.findOne({
          instructor: senderId,
          enrolledStudents: receiverId,
        });

        if (!enrolledCourse) {
          return res.status(403).json({
            success: false,
            message: "You can only message students enrolled in your courses",
          });
        }
      } else if (receiver.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Instructors can only send messages to students or admins",
        });
      }
    }
    // Admins can message anyone (no restrictions)

    // Verify course if provided
    let course = null;
    if (courseId) {
      course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      // Check if both users have access to the course
      const senderHasAccess =
        course.instructor.toString() === senderId ||
        course.enrolledStudents.includes(senderId) ||
        req.user.role === "admin";

      const receiverHasAccess =
        course.instructor.toString() === receiverId ||
        course.enrolledStudents.includes(receiverId) ||
        receiver.role === "admin";

      if (!senderHasAccess || !receiverHasAccess) {
        return res.status(403).json({
          success: false,
          message: "One or both users don't have access to this course",
        });
      }
    }

    // Create message (no file attachments, just text in database)
    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      course: courseId || null,
      subject: messageSubject,
      content,
      messageType: messageType || "general",
      priority: priority || "normal",
      parentMessage: parentMessageId || null,
    });

    await message.save();

    // Populate the message for response
    await message.populate([
      { path: "sender", select: "name email role" },
      { path: "receiver", select: "name email role" },
      { path: "course", select: "title" },
    ]);

    // Create notification for the receiver
    try {
      await Notification.createMessageNotification({
        _id: message._id,
        sender: message.sender,
        receiver: message.receiver,
        subject: message.subject,
        course: message.course,
        priority: message.priority,
      });
    } catch (notificationError) {
      logger.error("Failed to create notification:", notificationError);
      // Don't fail the message sending if notification creation fails
    }

    res.status(201).json({
      success: true,
      data: message,
      message: "Message sent successfully",
    });
  } catch (error) {
    logger.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
};

/**
 * Mark message as read
 * @route PUT /api/messages/:id/read
 * @access Private
 */

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only receiver can mark as read
    if (message.receiver.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only mark your own messages as read",
      });
    }

    await message.markAsRead(userId);

    res.status(200).json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    logger.error("Error marking message as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking message as read",
      error: error.message,
    });
  }
};

/**
 * Delete message for user
 * @route DELETE /api/messages/:id
 * @access Private
 */

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only sender or receiver can delete
    if (
      message.sender.toString() !== userId &&
      message.receiver.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages",
      });
    }

    await message.deleteForUser(userId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting message",
      error: error.message,
    });
  }
};

/**
 * Get unread message count
 * @route GET /api/messages/unread-count
 * @access Private
 */

module.exports = {
  sendMessage,
  markAsRead,
  deleteMessage
};
