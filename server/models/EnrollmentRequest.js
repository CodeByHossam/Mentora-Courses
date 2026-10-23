/**
 * Enrollment Request Model
 * 
 * Handles student enrollment requests for courses with admin notes functionality.
 * Admins can add multiple notes to track the review process and provide feedback.
 * 
 * Features:
 * - Student and course references
 * - Request status tracking (pending, approved, rejected)
 * - Multiple admin notes with timestamps and admin attribution
 * - Notes can be added regardless of request status
 * 
 * @author Mentora Team
 * @version 2.0.0
 */

const mongoose = require("mongoose");

const enrollmentRequestSchema = mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Legacy single admin note field (kept for backward compatibility)
    adminNote: {
      type: String,
      default: "",
    },
    // New admin notes array for multiple notes with full tracking
    adminNotes: [
      {
        note: {
          type: String,
          required: true,
          trim: true,
          maxlength: 1000, // Limit note length
        },
        admin: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Admin user who added the note
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Payment method and approval tracking
    paymentMethod: {
      type: String,
      enum: ["none", "direct_transfer", "stripe", "paypal"],
      default: "none",
    },
    approvedBy: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      role: {
        type: String,
        enum: ["admin", "instructor", "automatic"],
      },
      approvedAt: {
        type: Date,
      },
    },
    bankTransferProof: {
      url: {
        type: String,
        default: null,
      },
      s3Key: {
        type: String,
        default: null,
      },
      fileName: {
        type: String,
        default: null,
      },
      uploadedAt: {
        type: Date,
        default: null,
      },
    },
    transferredAmount: {
      type: Number,
      min: [0, "Transferred amount cannot be negative"],
      default: null,
    },
    transferDetails: {
      bankName: {
        type: String,
        trim: true,
      },
      referenceNumber: {
        type: String,
        trim: true,
      },
      transferDate: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware to handle approvedBy validation
 */
enrollmentRequestSchema.pre('save', function(next) {
  // Only validate approvedBy if it's being set
  if (this.approvedBy && (!this.approvedBy.role || !this.approvedBy.user)) {
    // If approvedBy is partially set, remove it to avoid validation errors
    if (!this.approvedBy.role && !this.approvedBy.user && !this.approvedBy.approvedAt) {
      this.approvedBy = undefined;
    }
  }
  next();
});

/**
 * Index for efficient querying
 * - Compound index on student and course for uniqueness checks
 * - Status index for filtering requests by status
 */
enrollmentRequestSchema.index({ student: 1, course: 1 });
enrollmentRequestSchema.index({ status: 1 });
enrollmentRequestSchema.index({ createdAt: -1 });

/**
 * Instance method to add admin note to enrollment request
 * @param {String} noteText - The note content
 * @param {ObjectId} adminId - ID of the admin adding the note
 * @returns {void} Adds note to document without saving
 */
enrollmentRequestSchema.methods.addAdminNote = function(noteText, adminId) {
  this.adminNotes.push({
    note: noteText,
    admin: adminId,
    createdAt: new Date()
  });
  // Don't save here - let the controller handle saving
};

/**
 * Static method to find requests with populated references
 * @param {Object} filter - MongoDB filter object
 * @returns {Promise} Enrollment requests with populated student, course, and admin data
 */
enrollmentRequestSchema.statics.findWithPopulatedData = function(filter = {}) {
  return this.find(filter)
    .populate('student', 'name email avatar')
    .populate('course', 'title description instructor')
    .populate('adminNotes.admin', 'name email')
    .populate('approvedBy.user', 'name email role')
    .sort({ createdAt: -1 });
};

/**
 * Static method to find single request by ID with populated references
 * @param {String} id - Enrollment request ID
 * @returns {Promise} Enrollment request with populated student, course, and admin data
 */
enrollmentRequestSchema.statics.findByIdWithNotes = function(id) {
  return this.findById(id)
    .populate('student', 'name email avatar')
    .populate('course', 'title description instructor')
    .populate('adminNotes.admin', 'name email')
    .populate('approvedBy.user', 'name email role');
};

module.exports = mongoose.model("EnrollmentRequest", enrollmentRequestSchema);
