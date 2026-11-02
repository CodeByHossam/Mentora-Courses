const logger = require('../../utils/logger');
/**
 * Live Session Controller
 *
 * Handles all live session-related operations including:
 * - Session scheduling and management
 * - Zoom integration
 * - Participant management
 * - Recording management
 * - Email reminders
 */

const LiveSession = require("../../models/LiveSession");
const Course = require("../../models/Course");
const User = require("../../models/User");
const sendEmail = require("../../utils/emailSender");
const axios = require("axios");
const getZoomAccessToken = require("../../utils/zoomAuth");

// Zoom API configuration
const ZOOM_API_BASE_URL = "https://api.zoom.us/v2";
const ZOOM_JWT_TOKEN = process.env.ZOOM_JWT_TOKEN;
const ZOOM_API_KEY = process.env.ZOOM_API_KEY;
const ZOOM_API_SECRET = process.env.ZOOM_API_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

/**
 * Helper function to send session reminder emails
 */

const uploadSessionRecording = async (req, res) => {
  try {
    const { recordingUrl, recordingPassword, isRecordingPublic } = req.body;

    if (!recordingUrl) {
      return res.status(400).json({
        success: false,
        message: "Recording URL is required",
      });
    }

    const session = await LiveSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Live session not found",
      });
    }

    // Check if user is the instructor or admin
    if (
      session.instructor.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the session instructor can upload recordings",
      });
    }

    // Update session with recording details
    session.recordingUrl = recordingUrl;
    session.recordingPassword = recordingPassword || null;
    session.isRecorded = true;
    session.isRecordingPublic = isRecordingPublic || false;

    await session.save();

    // Send recording available emails to enrolled students
    setTimeout(() => {
      sendSessionReminder(session, "recording_available");
    }, 1000);

    res.status(200).json({
      success: true,
      message: "Recording uploaded successfully",
      data: session,
    });
  } catch (error) {
    logger.error("Error uploading session recording:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading recording",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all live sessions (Admin only)
 * @route   GET /api/live-sessions/admin/all
 * @access  Private (Admin only)
 */

module.exports = {
  uploadSessionRecording
};
