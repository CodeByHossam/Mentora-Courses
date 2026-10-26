const logger = require('../utils/logger');
const Message = require("../models/Message");
const User = require("../models/User");
const Course = require("../models/Course");
const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");

/**
 * Get user's conversations
 * @route GET /api/messages/conversations
 * @access Private
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    logger.info("🔍 DEBUG: getConversations called");
    logger.info("📋 User ID:", userId);
    logger.info("📋 User ID type:", typeof userId);

    // Check if there are any messages for this user
    const allMessages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }],
      isDeleted: false,
    }).limit(5);

    logger.info("📨 Found messages for user:", allMessages.length);
    allMessages.forEach((msg) => {
      logger.info(
        `  - Message: ${msg._id}, Sender: ${msg.sender}, Receiver: ${msg.receiver}`
      );
    });

    const conversations = await Message.getUserConversations(userId);

    logger.info("💬 Conversations result:", conversations.length);
    logger.info(
      "💬 Conversations data:",
      JSON.stringify(conversations, null, 2)
    );

    res.status(200).json({
      success: true,
      data: conversations,
      count: conversations.length,
    });
  } catch (error) {
    logger.error("❌ Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching conversations",
      error: error.message,
    });
  }
};

/**
 * Get student's instructors for starting conversations
 * @route GET /api/messages/instructors
 * @access Private (Students only)
 */
const getStudentInstructors = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only students can access this endpoint
    if (userRole !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can access this endpoint",
      });
    }

    // Find all courses where the user is enrolled as a student
    const courses = await Course.find({ enrolledStudents: userId })
      .populate("instructor", "name email")
      .select("title instructor");

    // Extract unique instructors
    const instructorsMap = new Map();
    courses.forEach((course) => {
      if (
        course.instructor &&
        !instructorsMap.has(course.instructor._id.toString())
      ) {
        instructorsMap.set(course.instructor._id.toString(), {
          _id: course.instructor._id,
          name: course.instructor.name,
          email: course.instructor.email,
          courses: [],
        });
      }
      if (course.instructor) {
        instructorsMap.get(course.instructor._id.toString()).courses.push({
          _id: course._id,
          title: course.title,
        });
      }
    });

    const instructors = Array.from(instructorsMap.values());

    res.status(200).json({
      success: true,
      data: instructors,
      count: instructors.length,
    });
  } catch (error) {
    logger.error("Error fetching student instructors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching instructors",
      error: error.message,
    });
  }
};

/**
 * Get conversation between two users
 * @route GET /api/messages/conversation/:userId
 * @access Private
 */
const getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;
    const { courseId } = req.query;

    // Verify the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If courseId is provided, verify access
    if (courseId) {
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      // Check if user has access to the course
      const hasAccess =
        course.instructor.toString() === currentUserId ||
        course.enrolledStudents.includes(currentUserId) ||
        req.user.role === "admin";

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this course",
        });
      }
    }

    const messages = await Message.getConversation(
      currentUserId,
      userId,
      courseId
    );

    // Mark unread messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length,
    });
  } catch (error) {
    logger.error("Error fetching conversation:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching conversation",
      error: error.message,
    });
  }
};

/**
 * Send a new message
 * @route POST /api/messages
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
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      isRead: false,
      isDeleted: false,
      deletedBy: { $not: { $elemMatch: { user: userId } } },
    });

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    logger.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Error getting unread count",
      error: error.message,
    });
  }
};

/**
 * Search messages
 * @route GET /api/messages/search
 * @access Private
 */
const searchMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q, courseId, messageType } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const searchQuery = {
      $or: [{ sender: userId }, { receiver: userId }],
      isDeleted: false,
      deletedBy: { $not: { $elemMatch: { user: userId } } },
      $text: { $search: q },
    };

    if (courseId) {
      searchQuery.course = courseId;
    }

    if (messageType) {
      searchQuery.messageType = messageType;
    }

    const messages = await Message.find(searchQuery)
      .populate("sender", "name email role")
      .populate("receiver", "name email role")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length,
    });
  } catch (error) {
    logger.error("Error searching messages:", error);
    res.status(500).json({
      success: false,
      message: "Error searching messages",
      error: error.message,
    });
  }
};

module.exports = {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages,
  getStudentInstructors,
};
