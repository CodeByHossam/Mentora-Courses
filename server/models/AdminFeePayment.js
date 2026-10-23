// models/AdminFeePayment.js
/**
 * AdminFeePayment Model
 * 
 * Handles instructor payments of admin fees
 * - Instructors upload receipts for admin fee payments
 * - Admin verifies and approves payments
 * - Payments are deducted from outstanding admin fees
 * - Complete audit trail with receipts and verification
 */

const mongoose = require("mongoose");

const adminFeePaymentSchema = new mongoose.Schema({
  // 👤 Instructor Information
  instructorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  // 💰 Payment Details
  paymentAmount: { 
    type: Number, 
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    default: "USD"
  },
  
  // 🏦 Payment Method
  paymentMethod: {
    type: String,
    enum: ["bank_transfer", "wire_transfer", "check", "cash", "other"],
    required: true,
    default: "bank_transfer"
  },
  
  // 📝 Payment Information
  description: { 
    type: String,
    required: true,
    maxlength: 500
  },
  referenceNumber: String,
  bankTransactionId: String,
  
  // 📎 Receipt Documentation
  receiptUrl: { 
    type: String, 
    required: true 
  },
  receiptFileName: String,
  receiptFileSize: Number,
  receiptUploadedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  // Additional supporting documents
  supportingDocuments: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now },
    fileType: String,
    fileSize: Number,
    description: String
  }],

  // 🔄 Status Tracking
  status: {
    type: String,
    enum: ["pending", "under_review", "verified", "approved", "rejected", "processed"],
    default: "pending"
  },
  
  // ⏰ Timeline
  paymentDate: { 
    type: Date, 
    required: true 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  reviewedAt: Date,
  processedAt: Date,
  
  // 👨‍💼 Admin Verification
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  verificationNotes: { 
    type: String,
    maxlength: 1000
  },
  internalNotes: { 
    type: String,
    maxlength: 1000
  },

  // 🔗 Related Records
  relatedBillingTransaction: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "BillingTransaction" 
  },
  relatedAdminFees: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    feeAmount: Number,
    allocatedAmount: Number
  }],

  // 📊 Financial Impact
  outstandingFeesBeforePayment: Number,
  outstandingFeesAfterPayment: Number,
  allocatedToFees: { 
    type: Number, 
    default: 0 
  },
  excessAmount: { 
    type: Number, 
    default: 0 
  },

  // 🔍 Audit Trail
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
    notes: String
  }],

  // 📋 Metadata
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal"
  },
  tags: [String]
}, {
  timestamps: true,
  collection: "adminfeepayments"
});

// 📋 Instance Methods

/**
 * Add status change to history
 */
adminFeePaymentSchema.methods.addStatusChange = function(newStatus, changedBy, notes = null) {
  this.statusHistory.push({
    status: newStatus,
    changedBy,
    changedAt: new Date(),
    notes
  });
  this.status = newStatus;
};

/**
 * Verify payment (admin review)
 */
adminFeePaymentSchema.methods.verify = function(adminId, verificationNotes = null) {
  this.addStatusChange("verified", adminId, "Payment verified by admin");
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.verificationNotes = verificationNotes;
};

/**
 * Approve payment
 */
adminFeePaymentSchema.methods.approve = function(adminId, approvalNotes = null) {
  this.addStatusChange("approved", adminId, "Payment approved for processing");
  this.verificationNotes = approvalNotes;
};

/**
 * Reject payment
 */
adminFeePaymentSchema.methods.reject = function(adminId, rejectionReason) {
  this.addStatusChange("rejected", adminId, "Payment rejected");
  this.verificationNotes = rejectionReason;
};

/**
 * Mark as processed
 */
adminFeePaymentSchema.methods.markProcessed = function(adminId, billingTransactionId = null, allocatedAmount = null) {
  this.addStatusChange("processed", adminId, "Payment processed and applied to admin fees");
  this.processedAt = new Date();
  this.relatedBillingTransaction = billingTransactionId;
  if (allocatedAmount) {
    this.allocatedToFees = allocatedAmount;
    this.excessAmount = this.paymentAmount - allocatedAmount;
  }
};

/**
 * Calculate fee allocation
 */
adminFeePaymentSchema.methods.calculateFeeAllocation = function(currentOutstandingFees) {
  const allocatedAmount = Math.min(this.paymentAmount, currentOutstandingFees);
  const excessAmount = Math.max(0, this.paymentAmount - currentOutstandingFees);
  
  return {
    allocatedAmount,
    excessAmount,
    fullyCoversOutstanding: allocatedAmount >= currentOutstandingFees
  };
};

// 🔍 Indexes
adminFeePaymentSchema.index({ instructorId: 1, status: 1 });
adminFeePaymentSchema.index({ status: 1, submittedAt: -1 });
adminFeePaymentSchema.index({ paymentDate: -1 });
adminFeePaymentSchema.index({ reviewedBy: 1 });

// 📊 Static Methods

/**
 * Get payment statistics
 */
adminFeePaymentSchema.statics.getPaymentStats = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$paymentAmount" },
        avgAmount: { $avg: "$paymentAmount" }
      }
    }
  ];
  
  return await this.aggregate(pipeline);
};

/**
 * Get pending payments for admin dashboard
 */
adminFeePaymentSchema.statics.getPendingPayments = async function(limit = 10) {
  return await this.find({ 
    status: { $in: ["pending", "under_review", "verified"] }
  })
  .populate("instructorId", "name email")
  .populate("reviewedBy", "name email")
  .sort({ submittedAt: -1 })
  .limit(limit);
};

/**
 * Get instructor payment history
 */
adminFeePaymentSchema.statics.getInstructorPayments = async function(instructorId, limit = 20) {
  return await this.find({ instructorId })
    .populate("reviewedBy", "name email")
    .sort({ submittedAt: -1 })
    .limit(limit);
};

module.exports = mongoose.models.AdminFeePayment || mongoose.model("AdminFeePayment", adminFeePaymentSchema);
