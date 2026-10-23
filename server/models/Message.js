const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false, // Optional - messages can be general or course-specific
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [5000, "Message content cannot exceed 5000 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null, // For reply threads
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    messageType: {
      type: String,
      enum: ["general", "course_related", "assignment", "grade", "technical_support"],
      default: "general",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      deletedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ course: 1, createdAt: -1 });
MessageSchema.index({ isRead: 1, receiver: 1 });
MessageSchema.index({ parentMessage: 1 });

// Virtual for reply count
MessageSchema.virtual("replyCount", {
  ref: "Message",
  localField: "_id",
  foreignField: "parentMessage",
  count: true,
});

// Method to mark message as read
MessageSchema.methods.markAsRead = function(userId) {
  if (this.receiver.toString() === userId.toString()) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  throw new Error("Only the receiver can mark the message as read");
};

// Method to soft delete message for a user
MessageSchema.methods.deleteForUser = function(userId) {
  const existingDeletion = this.deletedBy.find(
    deletion => deletion.user.toString() === userId.toString()
  );
  
  if (!existingDeletion) {
    this.deletedBy.push({
      user: userId,
      deletedAt: new Date(),
    });
  }
  
  // If both sender and receiver have deleted, mark as fully deleted
  if (this.deletedBy.length >= 2) {
    this.isDeleted = true;
  }
  
  return this.save();
};

// Static method to get conversation between two users
MessageSchema.statics.getConversation = function(user1Id, user2Id, courseId = null) {
  const query = {
    $or: [
      { sender: user1Id, receiver: user2Id },
      { sender: user2Id, receiver: user1Id },
    ],
    isDeleted: false,
    deletedBy: { $not: { $elemMatch: { user: { $in: [user1Id, user2Id] } } } },
  };
  
  if (courseId) {
    query.course = courseId;
  }
  
  return this.find(query)
    .populate("sender", "name email role")
    .populate("receiver", "name email role")
    .populate("course", "title")
    .sort({ createdAt: 1 });
};

// Static method to get user's conversations
MessageSchema.statics.getUserConversations = function(userId) {
  console.log("🔍 getUserConversations called with userId:", userId);
  console.log("🔍 userId type:", typeof userId);
  
  // Convert userId to ObjectId if it's a string
  const mongoose = require('mongoose');
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
  
  console.log("🔍 userObjectId:", userObjectId);
  
  return this.aggregate([
    {
      $match: {
        $or: [{ sender: userObjectId }, { receiver: userObjectId }],
        isDeleted: false,
        deletedBy: { $not: { $elemMatch: { user: userObjectId } } },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$sender", userObjectId] },
            "$receiver",
            "$sender",
          ],
        },
        lastMessage: { $first: "$$ROOT" },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", userObjectId] },
                  { $eq: ["$isRead", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "otherUser",
      },
    },
    {
      $unwind: "$otherUser",
    },
    {
      $lookup: {
        from: "courses",
        localField: "lastMessage.course",
        foreignField: "_id",
        as: "course",
      },
    },
    {
      $sort: { "lastMessage.createdAt": -1 },
    },
  ]);
};

module.exports = mongoose.model("Message", MessageSchema);
