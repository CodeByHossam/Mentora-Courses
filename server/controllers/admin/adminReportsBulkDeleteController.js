const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Category = require("../../models/Category");
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const Payment = require("../../models/Payment");
const Comment = require("../../models/Comment");
const Test = require("../../models/Test");
const Grade = require("../../models/Grade");
const Certificate = require("../../models/Certificate");
const LiveSession = require("../../models/LiveSession");
const Message = require("../../models/Message");
const Notification = require("../../models/Notification");
const Attachment = require("../../models/Attachment");
const InstructorRequest = require("../../models/InstructorRequestModel");
const RefundRequest = require("../../models/RefundRequest");
const AdminFeePayment = require("../../models/AdminFeePayment");
const GiftCard = require("../../models/GiftCard");
const BillingTransaction = require("../../models/BillingTransaction");
const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
const StudentBillingAccount = require("../../models/StudentBillingAccount");
const AdminBillingAccount = require("../../models/AdminBillingAccount");

/**
 * 📊 GET DELETION STATISTICS
 * Shows counts for each model to help admin understand impact
 */

const getDeletionStatistics = asyncHandler(async (req, res) => {
  try {
    const stats = {
      // Safe to delete models
      safeModels: {
        Comment: await Comment.countDocuments(),
        tests: await Test.countDocuments(),
        grades: await Grade.countDocuments(),
        certificates: await Certificate.countDocuments(),
        liveSessions: await LiveSession.countDocuments(),
        messages: await Message.countDocuments(),
        notifications: await Notification.countDocuments(),
        attachments: await Attachment.countDocuments(),
        enrollmentRequests: await EnrollmentRequest.countDocuments(),
        instructorRequests: await InstructorRequest.countDocuments(),
        // payoutRequests removed - using direct payout system now
        refundRequests: await RefundRequest.countDocuments(),
        adminFeePayments: await AdminFeePayment.countDocuments(),
        giftCards: await GiftCard.countDocuments(),
      },

      // Models with relationships (require validation)
      relationshipModels: {
        users: await User.countDocuments(),
        courses: await Course.countDocuments(),
        categories: await Category.countDocuments(),
      },

      // Protected financial models (cannot be deleted)
      protectedModels: {
        payments: await Payment.countDocuments(),
        billingTransactions: await BillingTransaction.countDocuments(),
        instructorBillingAccounts:
          await InstructorBillingAccount.countDocuments(),
        studentBillingAccounts: await StudentBillingAccount.countDocuments(),
        adminBillingAccounts: await AdminBillingAccount.countDocuments(),
      },
    };

    res.json({
      success: true,
      message: "Deletion statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    logger.error("❌ Error getting deletion statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get deletion statistics",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE Comment
 * Safely deletes all Comment from all courses
 */

const bulkDeleteComment = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    // Additional security check
    if (!confirmPassword || confirmPassword !== "DELETE_ALL_Comment") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_Comment" to confirm.',
      });
    }

    const deletedCount = await Comment.countDocuments();
    await Comment.deleteMany({});

    // Log the action
    logger.info(
      `🗑️ Admin ${req.user.name} (${req.user.email}) deleted ${deletedCount} Comment`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} Comment`,
      deletedCount,
    });
  } catch (error) {
    logger.error("❌ Error bulk deleting Comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete Comment",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE TESTS
 * Safely deletes all tests and related grades
 */

const bulkDeleteTests = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    if (!confirmPassword || confirmPassword !== "DELETE_ALL_TESTS") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_TESTS" to confirm.',
      });
    }

    const testsCount = await Test.countDocuments();
    const gradesCount = await Grade.countDocuments();

    // Delete tests and related grades
    await Test.deleteMany({});
    await Grade.deleteMany({});

    logger.info(
      `🗑️ Admin ${req.user.name} deleted ${testsCount} tests and ${gradesCount} grades`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${testsCount} tests and ${gradesCount} grades`,
      deletedCounts: { tests: testsCount, grades: gradesCount },
    });
  } catch (error) {
    logger.error("❌ Error bulk deleting tests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete tests",
      error: error.message,
    });
  }
});

/**
 * 🚫 PROTECTED MODEL DELETION ATTEMPT
 * Returns error for protected financial models
 */

const protectedModelDeletion = asyncHandler(async (req, res) => {
  const { modelType } = req.params;

  res.status(403).json({
    success: false,
    message: `${modelType} records are protected and cannot be deleted. These are critical for financial compliance and audit trails.`,
    protectedModels: [
      "payments",
      "billingTransactions",
      "instructorBillingAccounts",
      "studentBillingAccounts",
      "adminBillingAccounts",
    ],
  });
});


module.exports = {
  getDeletionStatistics,
  bulkDeleteComment,
  bulkDeleteTests,
  protectedModelDeletion
};
