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

const joinLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id).populate(
      "course",
      "enrolledStudents"
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Live session not found",
      });
    }

    // Check if user is enrolled in the course, is the instructor, or is an admin
    const isEnrolled = session.course.enrolledStudents.includes(req.user.id);
    const isInstructor =
      session.instructor.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isEnrolled && !isInstructor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "You must be enrolled in this course or be the instructor to join the session",
      });
    }

    // Check if user can join the session
    if (!session.canUserJoin(req.user.id)) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot join this session. It may be cancelled, completed, full, or not yet available.",
      });
    }

    // Add participant
    await session.addParticipant(req.user.id);

    res.status(200).json({
      success: true,
      message: "Successfully joined the session",
      data: {
        zoomJoinUrl: session.zoomJoinUrl,
        zoomPassword: session.zoomPassword,
        sessionId: session._id,
      },
    });
  } catch (error) {
    logger.error("Error joining live session:", error);
    res.status(500).json({
      success: false,
      message: "Error joining session",
      error: error.message,
    });
  }
};

/**
 * @desc    Leave live session
 * @route   POST /api/live-sessions/:id/leave
 * @access  Private
 */

const leaveLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Live session not found",
      });
    }

    // Remove participant
    await session.removeParticipant(req.user.id);

    res.status(200).json({
      success: true,
      message: "Successfully left the session",
    });
  } catch (error) {
    logger.error("Error leaving live session:", error);
    res.status(500).json({
      success: false,
      message: "Error leaving session",
      error: error.message,
    });
  }
};

/**
 * @desc    Start live session
 * @route   POST /api/live-sessions/:id/start
 * @access  Private (Instructor only)
 */

const startLiveSession = async (req, res) => {
  try {
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
        message: "Only the session instructor can start this session",
      });
    }

    // Check if session can be started
    if (session.status !== "scheduled") {
      return res.status(400).json({
        success: false,
        message: "Session cannot be started. Current status: " + session.status,
      });
    }

    // Start the session
    await session.startSession();

    // Send "starting now" emails to enrolled students
    setTimeout(() => {
      sendSessionReminder(session, "starting");
    }, 1000);

    res.status(200).json({
      success: true,
      message: "Session started successfully",
      data: {
        zoomStartUrl: session.zoomStartUrl,
        sessionId: session._id,
      },
    });
  } catch (error) {
    logger.error("Error starting live session:", error);
    res.status(500).json({
      success: false,
      message: "Error starting session",
      error: error.message,
    });
  }
};

/**
 * @desc    End live session
 * @route   POST /api/live-sessions/:id/end
 * @access  Private (Instructor only)
 */

const endLiveSession = async (req, res) => {
  try {
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
        message: "Only the session instructor can end this session",
      });
    }

    // Check if session can be ended
    if (session.status !== "live") {
      return res.status(400).json({
        success: false,
        message: "Session cannot be ended. Current status: " + session.status,
      });
    }

    // End the session
    await session.endSession();

    res.status(200).json({
      success: true,
      message: "Session ended successfully",
      data: session,
    });
  } catch (error) {
    logger.error("Error ending live session:", error);
    res.status(500).json({
      success: false,
      message: "Error ending session",
      error: error.message,
    });
  }
};

/**
 * @desc    Upload session recording
 * @route   POST /api/live-sessions/:id/recording
 * @access  Private (Instructor only)
 */

module.exports = {
  joinLiveSession,
  leaveLiveSession,
  startLiveSession,
  endLiveSession
};
