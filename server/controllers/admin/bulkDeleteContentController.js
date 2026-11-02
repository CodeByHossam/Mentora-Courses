// Bulk deletion of comments, tests/grades, notifications and messages. Split from bulkDeleteController.js; bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Comment = require("../../models/Comment");
const Test = require("../../models/Test");
const Grade = require("../../models/Grade");
const Notification = require("../../models/Notification");
const Message = require("../../models/Message");

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

    logger.info(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} notifications`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} notifications`,
      deletedCount,
    });
  } catch (error) {
    logger.error("❌ Error bulk deleting notifications:", error);
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

    logger.info(`🗑️ Admin ${req.user.name} deleted ${deletedCount} messages`);

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} messages`,
      deletedCount,
    });
  } catch (error) {
    logger.error("❌ Error bulk deleting messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete messages",
      error: error.message,
    });
  }
});

module.exports = {
  bulkDeleteComment,
  bulkDeleteTests,
  bulkDeleteNotifications,
  bulkDeleteMessages
};
