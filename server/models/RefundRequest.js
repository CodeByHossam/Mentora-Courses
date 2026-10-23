// models/RefundRequest.js
/**
 * RefundRequest Model
 * 
 * Handles refund requests from both students and instructors
 * - Students can request refunds for course purchases
 * - Instructors can request refunds for overpaid admin fees
 * - All refunds require admin approval
 * - Tracks complete audit trail with notes and receipts
 */

const mongoose = require("mongoose");

const refundRequestSchema = new mongoose.Schema({
  // 👤 User Information
  requesterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  requesterType: { 
    type: String, 
    enum: ["student", "instructor"], 
    required: true 
  },

  // 📋 Request Details
  refundType: {
    type: String,
    enum: ["course_purchase", "admin_fee_overpayment", "billing_error", "financial_issue", "duplicate_payment", "service_not_received", "other"],
    required: true
  },
  
  // 💰 Financial Details
  requestedAmount: { 
    type: Number, 
    required: true,
    min: 0.01
  },
  originalAmount: { 
    type: Number, 
    required: true 
  },
  
  // 🔗 Related Records
  relatedCourse: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course" 
  },
  relatedPayment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Payment" 
  },
  relatedBillingTransaction: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "BillingTransaction" 
  },
  relatedGiftCard: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "GiftCard" 
  },

  // 📝 Request Information
  reason: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  description: { 
    type: String,
    maxlength: 2000
  },
  
  // 📎 Supporting Documents
  supportingDocuments: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now },
    fileType: String,
    fileSize: Number
  }],

  // 🔄 Status Tracking
  status: {
    type: String,
    enum: ["pending", "under_review", "approved", "rejected", "processed", "cancelled"],
    default: "pending"
  },
  
  // ⏰ Timeline
  requestDate: { 
    type: Date, 
    default: Date.now 
  },
  reviewDate: Date,
  processedDate: Date,
  
  // 👨‍💼 Admin Processing
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  adminNotes: { 
    type: String,
    maxlength: 1000
  },
  internalNotes: { 
    type: String,
    maxlength: 1000
  },

  // 💳 Refund Processing
  refundMethod: {
    type: String,
  },
  refundTransactionId: String,
  refundProcessedAt: Date,
  
  // 🧾 Gift Card Receipt (for admin uploads)
  receiptUrl: String,
  receiptS3Key: String,
  receiptUploadedAt: { type: Date },
  
  // Supporting documents (uploaded by requester)
  supportingDocuments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    s3Key: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: false
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal"
  },
  tags: [String],
  // 🔍 Audit Trail
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
    notes: String
  }]
}, {
  timestamps: true,
  collection: "refundrequests"
});

// 📋 Instance Methods

/**
 * Add status change to history
 */
refundRequestSchema.methods.addStatusChange = function(newStatus, changedBy, notes = null) {
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    changedAt: new Date(),
    notes
  });
  this.status = newStatus;
};

/**
 * Approve refund request
 */
refundRequestSchema.methods.approve = function(adminId, adminNotes = null, refundMethod = "original_payment") {
  this.addStatusChange("approved", adminId, "Refund request approved");
  this.reviewedBy = adminId;
  this.reviewDate = new Date();
  this.adminNotes = adminNotes;
  this.refundMethod = refundMethod;
};

/**
 * Reject refund request
 */
refundRequestSchema.methods.reject = function(adminId, adminNotes) {
  this.addStatusChange("rejected", adminId, "Refund request rejected");
  this.reviewedBy = adminId;
  this.reviewDate = new Date();
  this.adminNotes = adminNotes;
};

/**
 * Mark as processed
 */
refundRequestSchema.methods.markProcessed = function(adminId, transactionId = null) {
  this.addStatusChange("processed", adminId, "Refund processed and completed");
  this.processedDate = new Date();
  this.refundTransactionId = transactionId;
  this.refundProcessedAt = new Date();
};

/**
 * Cancel refund request
 */
refundRequestSchema.methods.cancel = function(userId, reason = null) {
  this.addStatusChange("cancelled", userId, reason || "Refund request cancelled by user");
};

// 🔍 Indexes
refundRequestSchema.index({ requesterId: 1, status: 1 });
refundRequestSchema.index({ status: 1, requestDate: -1 });
refundRequestSchema.index({ refundType: 1, status: 1 });
refundRequestSchema.index({ relatedCourse: 1 });
refundRequestSchema.index({ relatedPayment: 1 });

// 📊 Static Methods

/**
 * Get refund statistics
 */
refundRequestSchema.statics.getRefundStats = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$requestedAmount" },
        avgAmount: { $avg: "$requestedAmount" }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

/**
 * Get pending refunds for admin dashboard
 */
refundRequestSchema.statics.getPendingRefunds = async function(limit = 10) {
  return await this.find({ 
    status: { $in: ["pending", "under_review"] }
  })
  .populate("requesterId", "name email role")
  .populate("relatedCourse", "title")
  .populate("reviewedBy", "name email")
  .sort({ requestDate: -1 })
  .limit(limit);
};

module.exports = mongoose.models.RefundRequest || mongoose.model("RefundRequest", refundRequestSchema);
