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

const testZoomCredentials = async (req, res) => {
  try {
    const token = await getZoomAccessToken();

    if (!token) {
      return res.status(500).json({
        success: false,
        message: "Failed to get Zoom access token",
      });
    }

    // Test API call to get user info
    const response = await axios.get("https://api.zoom.us/v2/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json({
      success: true,
      message: "Zoom credentials are working",
      data: {
        user: response.data.email,
        account_id: response.data.account_id,
      },
    });
  } catch (error) {
    logger.error(
      "❌ Zoom test failed:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Zoom test failed",
      error: error.response?.data || error.message,
    });
  }
};

module.exports = {
  testZoomCredentials
};
