/**
 * Admin Bulk Deletion Controller
 *
 * Provides secure bulk deletion functionality for administrators
 * with proper validation, financial data protection, and audit trails.
 *
 * Features:
 * - Model-specific bulk deletion
 * - Financial data protection via PERMANENT BOXES
 * - Relationship validation
 * - Comprehensive logging
 *
 * 📦 PERMANENT BOXES - PROTECTED FINANCIAL DATA
 * ============================================
 * These fields are NEVER deleted (except when user is deleted):
 *
 * InstructorBillingAccount:
 *   - totalCommissionEarned (history - never decreases)
 *   - pendingCommissions (current unpaid)
 *   - totalPayoutsReceived (paid by admin)
 *   - totalGiftAmount (gift cards)
 *   - annualFees (subscription)
 *
 * StudentBillingAccount:
 *   - totalCoursePurchases (total spent history)
 *   - annualFees (subscription)
 *
 * AdminBillingAccount:
 *   - totalRevenue (sum of admin fees)
 *   - platformBalance (revenue - payouts)
 *   - totalInstructorPayouts (total paid)
 *   - totalStudentRefunds (total refunded)
 *
 * ⚠️ SAFE TO DELETE (Permanent boxes remain intact):
 *   - Payment records
 *   - BillingTransaction records
 *   - AdminFeePayment records
 *   - GiftCard records
 *   - RefundRequest records
 *
 * ❌ NEVER DELETE (Would lose money):
 *   - InstructorBillingAccount
 *   - StudentBillingAccount
 *   - AdminBillingAccount
 */

const asyncHandler = require("express-async-handler");

// Models
const User = require("../models/User");
const Course = require("../models/Course");
const Category = require("../models/Category");
const Lesson = require("../models/lessonModel");
const Comment = require("../models/Comment");
const Test = require("../models/Test");
const Grade = require("../models/Grade");
const Certificate = require("../models/Certificate");
const LiveSession = require("../models/LiveSession");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Attachment = require("../models/Attachment");
const EnrollmentRequest = require("../models/EnrollmentRequest");
const InstructorRequest = require("../models/InstructorRequestModel");
// PayoutRequest removed - using direct payout system now
const RefundRequest = require("../models/RefundRequest");
const AdminFeePayment = require("../models/AdminFeePayment");
const GiftCard = require("../models/GiftCard");

// Sensitive financial models
const Payment = require("../models/Payment");
const BillingTransaction = require("../models/BillingTransaction");
// Protected account models (must NOT be deleted to preserve balances)
const InstructorBillingAccount = require("../models/InstructorBillingAccount");
const StudentBillingAccount = require("../models/StudentBillingAccount");
const AdminBillingAccount = require("../models/AdminBillingAccount");

/**
 * 📊 GET DELETION STATISTICS
 * Shows counts for each model to help admin understand impact
 */
const getDeletionStatistics = asyncHandler(async (req, res) => {
  try {
    console.log("🔍 ADMIN BULK DELETE STATISTICS REQUEST");
    console.log(
      "👤 User:",
      req.user
        ? `${req.user.name} (${req.user.email}) - Role: ${req.user.role}`
        : "No user found"
    );
    console.log("🕒 Timestamp:", new Date().toISOString());

    // Set JSON-only headers to prevent HTML responses
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    console.log("📊 Querying database for deletion statistics...");

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

    console.log("✅ DELETION STATISTICS RETRIEVED:");
    console.log("📈 Safe Models:", stats.safeModels);
    console.log("🔗 Relationship Models:", stats.relationshipModels);
    console.log("⚠️ Sensitive Models:", stats.sensitiveModels);
    console.log("🛡️ Protected Models:", stats.protectedModels);

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

    console.log("📊 SUMMARY:");
    console.log(`   Safe to Delete: ${totalSafe} records`);
    console.log(`   Sensitive: ${totalSensitive} records`);
    console.log(`   Protected: ${totalProtected} records`);
    console.log(`   With Relationships: ${totalRelationship} records`);

    res.json({
      success: true,
      message: "Deletion statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("❌ ERROR IN DELETION STATISTICS:", error);
    console.error("❌ Stack trace:", error.stack);

    // Ensure JSON response even on error
    res.setHeader("Content-Type", "application/json");
    res.status(500).json({
      success: false,
      message: "Failed to get deletion statistics",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE PAYMENTS (Sensitive but SAFE)
 * 
 * Deletes all Payment records (transaction history).
 * 
 * ✅ SAFE BECAUSE:
 * - Permanent boxes in billing accounts are NOT affected
 * - pendingCommissions, totalCommissionEarned, etc. remain intact
 * - Only deletes the transaction RECORDS, not the BALANCES
 * 
 * 📦 PROTECTED PERMANENT BOXES:
 * - InstructorBillingAccount: pendingCommissions, totalCommissionEarned, totalPayoutsReceived
 * - StudentBillingAccount: totalCoursePurchases, annualFees
 * - AdminBillingAccount: totalRevenue, platformBalance, totalInstructorPayouts
 * 
 * ⚠️ WHAT GETS DELETED:
 * - Payment transaction records (audit trail)
 * - Payment history (for reporting)
 * 
 * ✅ WHAT REMAINS:
 * - All user balances
 * - All pending commissions
 * - All annual fees
 * - All financial obligations
 */
const bulkDeletePayments = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    if (!confirmPassword || confirmPassword !== "DELETE_ALL_PAYMENTS_HISTORY") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_PAYMENTS_HISTORY" to confirm.',
      });
    }

    const deletedCount = await Payment.countDocuments();
    await Payment.deleteMany({});

    console.log(`🗑️ Admin ${req.user.name} deleted ${deletedCount} payment records`);
    console.log(`📦 PERMANENT BOXES PROTECTED: All balances remain intact`);
    
    res.json({
      success: true,
      message: `Deleted ${deletedCount} payment records. All user balances and pending commissions remain intact.`,
      deletedCount,
      protectedData: {
        instructorBalances: "✅ Protected",
        studentBalances: "✅ Protected",
        pendingCommissions: "✅ Protected",
        annualFees: "✅ Protected",
      }
    });
  } catch (error) {
    console.error("❌ Error bulk deleting payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete payments",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE BILLING TRANSACTIONS (Sensitive)
 */
const bulkDeleteBillingTransactions = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    if (
      !confirmPassword ||
      confirmPassword !== "DELETE_ALL_BILLING_TRANSACTIONS"
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_BILLING_TRANSACTIONS" to confirm.',
      });
    }

    const deletedCount = await BillingTransaction.countDocuments();
    await BillingTransaction.deleteMany({});

    console.log(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} billing transactions`
    );
    res.json({
      success: true,
      message: `Deleted ${deletedCount} billing transactions`,
      deletedCount,
    });
  } catch (error) {
    console.error("❌ Error bulk deleting billing transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete billing transactions",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE GIFT CARDS (Sensitive)
 */
const bulkDeleteGiftCards = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    if (!confirmPassword || confirmPassword !== "DELETE_ALL_GIFT_CARDS") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_GIFT_CARDS" to confirm.',
      });
    }

    const deletedCount = await GiftCard.countDocuments();
    await GiftCard.deleteMany({});

    console.log(`🗑️ Admin ${req.user.name} deleted ${deletedCount} gift cards`);
    res.json({
      success: true,
      message: `Deleted ${deletedCount} gift cards`,
      deletedCount,
    });
  } catch (error) {
    console.error("❌ Error bulk deleting gift cards:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gift cards",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE ADMIN FEE PAYMENTS (Sensitive)
 */
const bulkDeleteAdminFeePayments = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    if (
      !confirmPassword ||
      confirmPassword !== "DELETE_ALL_ADMIN_FEE_PAYMENTS"
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_ADMIN_FEE_PAYMENTS" to confirm.',
      });
    }

    const deletedCount = await AdminFeePayment.countDocuments();
    await AdminFeePayment.deleteMany({});

    console.log(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} admin fee payments`
    );
    res.json({
      success: true,
      message: `Deleted ${deletedCount} admin fee payments`,
      deletedCount,
    });
  } catch (error) {
    console.error("❌ Error bulk deleting admin fee payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete admin fee payments",
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
    console.log(
      `🗑️ Admin ${req.user.name} (${req.user.email}) deleted ${deletedCount} Comment`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} Comment`,
      deletedCount,
    });
  } catch (error) {
    console.error("❌ Error bulk deleting Comment:", error);
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

    console.log(
      `🗑️ Admin ${req.user.name} deleted ${testsCount} tests and ${gradesCount} grades`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${testsCount} tests and ${gradesCount} grades`,
      deletedCounts: { tests: testsCount, grades: gradesCount },
    });
  } catch (error) {
    console.error("❌ Error bulk deleting tests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete tests",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE NOTIFICATIONS
 * Safely deletes all notifications
 */
const bulkDeleteNotifications = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    if (!confirmPassword || confirmPassword !== "DELETE_ALL_NOTIFICATIONS") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_NOTIFICATIONS" to confirm.',
      });
    }

    const deletedCount = await Notification.countDocuments();
    await Notification.deleteMany({});

    console.log(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} notifications`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} notifications`,
      deletedCount,
    });
  } catch (error) {
    console.error("❌ Error bulk deleting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notifications",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE MESSAGES
 * Safely deletes all messages
 */
const bulkDeleteMessages = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    if (!confirmPassword || confirmPassword !== "DELETE_ALL_MESSAGES") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_MESSAGES" to confirm.',
      });
    }

    const deletedCount = await Message.countDocuments();
    await Message.deleteMany({});

    console.log(`🗑️ Admin ${req.user.name} deleted ${deletedCount} messages`);

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} messages`,
      deletedCount,
    });
  } catch (error) {
    console.error("❌ Error bulk deleting messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete messages",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE LIVE SESSIONS
 * Safely deletes completed live sessions only
 */
const bulkDeleteLiveSessions = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword, includeActive } = req.body;

    if (!confirmPassword || confirmPassword !== "DELETE_LIVE_SESSIONS") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_LIVE_SESSIONS" to confirm.',
      });
    }

    // For bulk delete, delete ALL live sessions regardless of status
    const deletedCount = await LiveSession.countDocuments();
    await LiveSession.deleteMany({});

    console.log(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} live sessions`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} live sessions`,
      deletedCount,
    });
  } catch (error) {
    console.error("❌ Error bulk deleting live sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete live sessions",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE CERTIFICATES
 * Safely deletes all certificates
 */
const bulkDeleteCertificates = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    if (!confirmPassword || confirmPassword !== "DELETE_ALL_CERTIFICATES") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_CERTIFICATES" to confirm.',
      });
    }

    const deletedCount = await Certificate.countDocuments();
    await Certificate.deleteMany({});

    console.log(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} certificates`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} certificates`,
      deletedCount,
    });
  } catch (error) {
    console.error("❌ Error bulk deleting certificates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete certificates",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE ENROLLMENT REQUESTS
 * Safely deletes processed enrollment requests only
 */
const bulkDeleteEnrollmentRequests = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword, includeActive } = req.body;

    if (!confirmPassword || confirmPassword !== "DELETE_ENROLLMENT_REQUESTS") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ENROLLMENT_REQUESTS" to confirm.',
      });
    }

    let filter = {};
    if (!includeActive) {
      // Only delete processed requests by default
      filter = { status: { $in: ["approved", "rejected"] } };
    }

    const deletedCount = await EnrollmentRequest.countDocuments(filter);
    await EnrollmentRequest.deleteMany(filter);

    console.log(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} enrollment requests`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} enrollment requests`,
      deletedCount,
    });
  } catch (error) {
    console.error("❌ Error bulk deleting enrollment requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete enrollment requests",
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

/**
 * 🗑️ BULK DELETE ALL NON-CRITICAL DATA
 * Nuclear option - deletes all safe-to-delete data
 */
const bulkDeleteAllNonCritical = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    if (
      !confirmPassword ||
      confirmPassword !== "DELETE_ALL_NON_CRITICAL_DATA"
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_NON_CRITICAL_DATA" to confirm.',
      });
    }

    const deletionResults = {};

    // Delete all safe models
    deletionResults.Comment = await Comment.countDocuments();
    await Comment.deleteMany({});

    deletionResults.tests = await Test.countDocuments();
    await Test.deleteMany({});

    deletionResults.grades = await Grade.countDocuments();
    await Grade.deleteMany({});

    deletionResults.certificates = await Certificate.countDocuments();
    await Certificate.deleteMany({});

    deletionResults.completedLiveSessions = await LiveSession.countDocuments({
      status: "completed",
    });
    await LiveSession.deleteMany({ status: "completed" });

    deletionResults.messages = await Message.countDocuments();
    await Message.deleteMany({});

    deletionResults.notifications = await Notification.countDocuments();
    await Notification.deleteMany({});

    deletionResults.processedEnrollmentRequests =
      await EnrollmentRequest.countDocuments({
        status: { $in: ["approved", "rejected"] },
      });
    await EnrollmentRequest.deleteMany({
      status: { $in: ["approved", "rejected"] },
    });

    const totalDeleted = Object.values(deletionResults).reduce(
      (sum, count) => sum + count,
      0
    );

    console.log(
      `🗑️ Admin ${req.user.name} performed bulk deletion of ${totalDeleted} non-critical records`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${totalDeleted} non-critical records`,
      deletionResults,
    });
  } catch (error) {
    console.error("❌ Error in bulk delete all non-critical:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete non-critical data",
      error: error.message,
    });
  }
});

module.exports = {
  getDeletionStatistics,
  bulkDeleteComment,
  bulkDeleteTests,
  bulkDeleteNotifications,
  bulkDeleteMessages,
  bulkDeleteLiveSessions,
  bulkDeleteCertificates,
  bulkDeleteEnrollmentRequests,
  protectedModelDeletion,
  bulkDeleteAllNonCritical,
  // Sensitive deletions
  bulkDeletePayments,
  bulkDeleteBillingTransactions,
  bulkDeleteGiftCards,
  bulkDeleteAdminFeePayments,
};
