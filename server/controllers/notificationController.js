const Notification = require("../models/Notification");
const { validationResult } = require("express-validator");

/**
 * Get user notifications
 * @route GET /api/notifications
 * @access Private
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, isRead } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    if (type) options.type = type;
    if (isRead !== undefined) options.isRead = isRead === "true";

    const notifications = await Notification.getUserNotifications(
      userId,
      options
    );
    const totalCount = await Notification.countDocuments({
      recipient: userId,
      ...(type && { type }),
      ...(isRead !== undefined && { isRead: isRead === "true" }),
    });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: parseInt(page) * parseInt(limit) < totalCount,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

/**
 * Get unread notification count
 * @route GET /api/notifications/unread-count
 * @access Private
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Debug: Log user info and check notifications
    console.log("🔔 getUnreadCount - userId:", userId);
    console.log("🔔 getUnreadCount - user role:", req.user.role);

    // Get all notifications for this user to debug
    const allNotifications = await Notification.find({ recipient: userId });
    const unreadNotifications = await Notification.find({
      recipient: userId,
      isRead: false,
    });

    console.log("🔔 Total notifications for user:", allNotifications.length);
    console.log(
      "🔔 Unread notifications for user:",
      unreadNotifications.length
    );
    console.log(
      "🔔 Unread notifications:",
      unreadNotifications.map((n) => ({
        title: n.title,
        isRead: n.isRead,
        type: n.type,
        createdAt: n.createdAt,
      }))
    );

    const unreadCount = await Notification.getUnreadCount(userId);

    console.log("🔔 Final unreadCount:", unreadCount);

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Error getting unread count",
      error: error.message,
    });
  }
};

/**
 * Mark notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Only the recipient can mark as read
    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/mark-all-read
 * @access Private
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking all notifications as read",
      error: error.message,
    });
  }
};

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Only the recipient can delete
    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message,
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
