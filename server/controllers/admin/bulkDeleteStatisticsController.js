// Bulk-delete impact statistics across every model. Split from bulkDeleteController.js; bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Category = require("../../models/Category");
const Lesson = require("../../models/lessonModel");
const Comment = require("../../models/Comment");
const Test = require("../../models/Test");
const Grade = require("../../models/Grade");
const Certificate = require("../../models/Certificate");
const LiveSession = require("../../models/LiveSession");
const Message = require("../../models/Message");
const Notification = require("../../models/Notification");
const Attachment = require("../../models/Attachment");
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const InstructorRequest = require("../../models/InstructorRequestModel");
const RefundRequest = require("../../models/RefundRequest");
const AdminFeePayment = require("../../models/AdminFeePayment");
const GiftCard = require("../../models/GiftCard");
const Payment = require("../../models/Payment");
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
    logger.info("🔍 ADMIN BULK DELETE STATISTICS REQUEST");
    logger.info(
      "👤 User:",
      req.user
        ? `${req.user.name} (${req.user.email}) - Role: ${req.user.role}`
        : "No user found"
    );
    logger.info("🕒 Timestamp:", new Date().toISOString());

    // Set JSON-only headers to prevent HTML responses
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    logger.info("📊 Querying database for deletion statistics...");

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
        lessons: await Lesson.countDocuments(),
      },

      // Sensitive-but-deletable financial history (with strong confirmation)
      sensitiveModels: {
        payments: await Payment.countDocuments(),
        billingTransactions: await BillingTransaction.countDocuments(),
        giftCards: await GiftCard.countDocuments(),
        adminFeePayments: await AdminFeePayment.countDocuments(),
      },
      // Protected financial account models (must not be deleted)
      protectedModels: {
        instructorBillingAccounts:
          await InstructorBillingAccount.countDocuments(),
        studentBillingAccounts: await StudentBillingAccount.countDocuments(),
        adminBillingAccounts: await AdminBillingAccount.countDocuments(),
      },
    };

    logger.info("✅ DELETION STATISTICS RETRIEVED:");
    logger.info("📈 Safe Models:", stats.safeModels);
    logger.info("🔗 Relationship Models:", stats.relationshipModels);
    logger.info("⚠️ Sensitive Models:", stats.sensitiveModels);
    logger.info("🛡️ Protected Models:", stats.protectedModels);

    const totalSafe = Object.values(stats.safeModels).reduce(
      (sum, count) => sum + count,
      0
    );
    const totalSensitive = Object.values(stats.sensitiveModels).reduce(
      (sum, count) => sum + count,
      0
    );
    const totalProtected = Object.values(stats.protectedModels).reduce(
      (sum, count) => sum + count,
      0
    );
    const totalRelationship = Object.values(stats.relationshipModels).reduce(
      (sum, count) => sum + count,
      0
    );

    logger.info("📊 SUMMARY:");
    logger.info(`   Safe to Delete: ${totalSafe} records`);
    logger.info(`   Sensitive: ${totalSensitive} records`);
    logger.info(`   Protected: ${totalProtected} records`);
    logger.info(`   With Relationships: ${totalRelationship} records`);

    res.json({
      success: true,
      message: "Deletion statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    logger.error("❌ ERROR IN DELETION STATISTICS:", error);
    logger.error("❌ Stack trace:", error.stack);

    // Ensure JSON response even on error
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({
      success: false,
      message: "Failed to get deletion statistics",
      error: error.message,
    });
  }
});

module.exports = {
  getDeletionStatistics
};
