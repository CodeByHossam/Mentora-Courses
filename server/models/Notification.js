const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Some notifications might be system-generated
    },
    type: {
      type: String,
      enum: [
        "message", 
        "course_enrollment", 
        "assignment_graded", 
        "live_session", 
        "payment", 
        "course_update",
        "gift_card",
        "refund",
        "system"
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    actionUrl: {
      type: String, // URL to navigate when notification is clicked
      required: false,
    },
    relatedModel: {
      type: String, // e.g., "Message", "Course", "Payment"
      required: false,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    expiresAt: {
      type: Date,
      required: false, // Some notifications might expire
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ type: 1, recipient: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark notification as read
NotificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create message notification
NotificationSchema.statics.createMessageNotification = async function(messageData) {
  const { sender, receiver, subject, course } = messageData;
  
  const courseText = course ? ` in ${course.title}` : "";
  
  return this.create({
    recipient: receiver._id,
    sender: sender._id,
    type: "message",
    title: `New message from ${sender.name}`,
    message: `${sender.name} sent you a message: "${subject}"${courseText}`,
    actionUrl: `/student/messages`,
    relatedModel: "Message",
    relatedId: messageData._id,
    priority: messageData.priority || "normal",
  });
};

// Static method to get user notifications with pagination
NotificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { page = 1, limit = 20, type, isRead } = options;
  
  const query = { recipient: userId };
  
  if (type) query.type = type;
  if (typeof isRead === "boolean") query.isRead = isRead;
  
  return this.find(query)
    .populate("sender", "name email")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .lean();
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
  });
};

module.exports = mongoose.model("Notification", NotificationSchema);
