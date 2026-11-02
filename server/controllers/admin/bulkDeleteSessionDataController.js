// Bulk deletion of live sessions, certificates and enrollment requests. Split from bulkDeleteController.js; bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const LiveSession = require("../../models/LiveSession");
const Certificate = require("../../models/Certificate");
const EnrollmentRequest = require("../../models/EnrollmentRequest");

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

    logger.info(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} live sessions`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} live sessions`,
      deletedCount,
    });
  } catch (error) {
    logger.error("❌ Error bulk deleting live sessions:", error);
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

    logger.info(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} certificates`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} certificates`,
      deletedCount,
    });
  } catch (error) {
    logger.error("❌ Error bulk deleting certificates:", error);
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

    logger.info(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} enrollment requests`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} enrollment requests`,
      deletedCount,
    });
  } catch (error) {
    logger.error("❌ Error bulk deleting enrollment requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete enrollment requests",
      error: error.message,
    });
  }
});

module.exports = {
  bulkDeleteLiveSessions,
  bulkDeleteCertificates,
  bulkDeleteEnrollmentRequests
};
