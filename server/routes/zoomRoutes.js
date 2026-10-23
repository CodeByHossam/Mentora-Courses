/**
 * Zoom Routes
 * 
 * Defines API routes for Zoom Web SDK integration
 */

const express = require("express");
const router = express.Router();

// Import middleware
const { protect } = require("../middleware/authMiddleware");

// Import controller functions
const {
  generateZoomSignature,
  getZoomMeetingDetails,
  handleZoomWebhook
} = require("../controllers/zoomController");

/**
 * @route   POST /api/zoom/signature
 * @desc    Generate Zoom Web SDK signature
 * @access  Private
 */
router.post("/signature", protect, generateZoomSignature);

/**
 * @route   GET /api/zoom/meeting/:meetingId
 * @desc    Get Zoom meeting details
 * @access  Private
 */
router.get("/meeting/:meetingId", protect, getZoomMeetingDetails);

/**
 * @route   POST /api/zoom/webhook
 * @desc    Handle Zoom webhook events
 * @access  Public (with verification)
 */
router.post("/webhook", handleZoomWebhook);

module.exports = router;
