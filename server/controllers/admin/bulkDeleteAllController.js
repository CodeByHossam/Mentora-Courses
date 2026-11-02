// Protected-model guard and the all-non-critical bulk delete. Split from bulkDeleteController.js; bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Comment = require("../../models/Comment");
const Test = require("../../models/Test");
const Grade = require("../../models/Grade");
const Certificate = require("../../models/Certificate");
const LiveSession = require("../../models/LiveSession");
const Message = require("../../models/Message");
const Notification = require("../../models/Notification");
const EnrollmentRequest = require("../../models/EnrollmentRequest");

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

    logger.info(
      `🗑️ Admin ${req.user.name} performed bulk deletion of ${totalDeleted} non-critical records`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${totalDeleted} non-critical records`,
      deletionResults,
    });
  } catch (error) {
    logger.error("❌ Error in bulk delete all non-critical:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete non-critical data",
      error: error.message,
    });
  }
});

module.exports = {
  protectedModelDeletion,
  bulkDeleteAllNonCritical
};
