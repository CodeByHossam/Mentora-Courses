const express = require("express");
const router = express.Router();
const {
  getConversations,
  getConversation,
  sendMessage,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages,
  getStudentInstructors,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");
const { body } = require("express-validator");

// Import specific rate limiters
const {
  messagingLimiter,
  apiReadLimiter,
  searchLimiter
} = require("../middleware/advancedRateLimit");

// Validation middleware for sending messages
const validateMessage = [
  body("receiverId")
    .notEmpty()
    .withMessage("Receiver ID is required")
    .isMongoId()
    .withMessage("Invalid receiver ID"),
  body("subject")
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage("Subject must be between 1 and 200 characters"),
  body("content")
    .notEmpty()
    .withMessage("Message content is required")
    .isLength({ min: 1, max: 5000 })
    .withMessage("Message content must be between 1 and 5000 characters"),
  body("courseId")
    .optional()
    .isMongoId()
    .withMessage("Invalid course ID"),
  body("messageType")
    .optional()
    .isIn(["general", "course_related", "assignment", "grade", "technical_support"])
    .withMessage("Invalid message type"),
  body("priority")
    .optional()
    .isIn(["low", "normal", "high", "urgent"])
    .withMessage("Invalid priority level"),
  body("parentMessageId")
    .optional()
    .isMongoId()
    .withMessage("Invalid parent message ID"),
];

/**
 * @route   GET /api/messages/conversations
 * @desc    Get user's conversations
 * @access  Private
 */
router.get("/conversations", protect, apiReadLimiter, getConversations);

/**
 * @route   GET /api/messages/instructors
 * @desc    Get student's instructors for starting conversations
 * @access  Private (Students only)
 */
router.get("/instructors", protect, apiReadLimiter, getStudentInstructors);

/**
 * @route   GET /api/messages/unread-count
 * @desc    Get unread message count
 * @access  Private
 */
router.get("/unread-count", protect, apiReadLimiter, getUnreadCount);

/**
 * @route   GET /api/messages/search
 * @desc    Search messages
 * @access  Private
 */
router.get("/search", protect, searchLimiter, searchMessages);

/**
 * @route   GET /api/messages/conversation/:userId
 * @desc    Get conversation between current user and specified user
 * @access  Private
 */
router.get("/conversation/:userId", protect, apiReadLimiter, getConversation);

/**
 * @route   POST /api/messages
 * @desc    Send a new message
 * @access  Private
 */
router.post(
  "/",
  protect,
  messagingLimiter,
  validateMessage,
  sendMessage
);

/**
 * @route   PUT /api/messages/:id/read
 * @desc    Mark message as read
 * @access  Private
 */
router.put("/:id/read", protect, apiReadLimiter, markAsRead);

/**
 * @route   DELETE /api/messages/:id
 * @desc    Delete message for user
 * @access  Private
 */
router.delete("/:id", protect, messagingLimiter, deleteMessage);

module.exports = router;
