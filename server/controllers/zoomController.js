/**
 * Zoom Controller
 *
 * Handles Zoom Web SDK integration and signature generation
 */

const jwt = require("jsonwebtoken");
const LiveSession = require("../models/LiveSession");
const Course = require("../models/Course");

/**
 * @desc    Generate Zoom Web SDK signature
 * @route   POST /api/zoom/signature
 * @access  Private
 */
const generateZoomSignature = async (req, res) => {
  try {
    const { meetingNumber, role = 0 } = req.body;

    if (!meetingNumber) {
      return res.status(400).json({
        success: false,
        message: "Meeting number is required",
      });
    }

    // Check if Zoom credentials are configured
    if (!process.env.ZOOM_API_KEY || !process.env.ZOOM_API_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Zoom integration is not configured",
      });
    }

    // Verify user has access to this meeting
    const session = await LiveSession.findOne({
      zoomMeetingId: meetingNumber.toString(),
    }).populate("course", "enrolledStudents instructor");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Check if user has permission to join
    const isInstructor = session.course.instructor.toString() === req.user.id;
    const isEnrolledStudent = session.course.enrolledStudents.includes(
      req.user.id
    );
    const isAdmin = req.user.role === "admin";

    if (!isInstructor && !isEnrolledStudent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You must be enrolled in this course or be the instructor.",
      });
    }

    // Generate JWT signature for Zoom Web SDK
    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // 2 hours expiration

    const oHeader = { alg: "HS256", typ: "JWT" };
    const oPayload = {
      iss: process.env.ZOOM_API_KEY,
      exp: exp,
      iat: iat,
      aud: "zoom",
      appKey: process.env.ZOOM_API_KEY,
      tokenExp: exp,
      alg: "HS256",
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);

    const signature = jwt.sign(oPayload, process.env.ZOOM_API_SECRET, {
      header: oHeader,
    });

    res.status(200).json({
      success: true,
      data: {
        signature,
        apiKey: process.env.ZOOM_API_KEY,
        meetingNumber,
        role: isInstructor ? 1 : 0, // 1 for host, 0 for attendee
      },
    });
  } catch (error) {
    console.error("Error generating Zoom signature:", error);
    res.status(500).json({
      success: false,
      message: "Error generating meeting signature",
      error: error.message,
    });
  }
};

/**
 * @desc    Get Zoom meeting details
 * @route   GET /api/zoom/meeting/:meetingId
 * @access  Private
 */
const getZoomMeetingDetails = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const session = await LiveSession.findOne({ zoomMeetingId: meetingId })
      .populate("course", "title enrolledStudents instructor")
      .populate("instructor", "name email");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Check if user has access
    const isInstructor = session.course.instructor.toString() === req.user.id;
    const isEnrolledStudent = session.course.enrolledStudents.includes(
      req.user.id
    );
    const isAdmin = req.user.role === "admin";

    if (!isInstructor && !isEnrolledStudent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        meetingId: session.zoomMeetingId,
        meetingNumber: session.zoomMeetingId,
        title: session.title,
        description: session.description,
        scheduledDate: session.scheduledDate,
        duration: session.duration,
        instructor: session.instructor,
        course: session.course,
        joinUrl: session.zoomJoinUrl,
        startUrl: isInstructor ? session.zoomStartUrl : undefined,
        password: session.zoomPassword,
      },
    });
  } catch (error) {
    console.error("Error getting Zoom meeting details:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving meeting details",
      error: error.message,
    });
  }
};

/**
 * @desc    Webhook endpoint for Zoom events
 * @route   POST /api/zoom/webhook
 * @access  Public (with verification)
 */
const handleZoomWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;

    // Verify webhook authenticity (implement based on Zoom's webhook verification)
    // This is a simplified version - implement proper verification in production

    switch (event) {
      case "meeting.started":
        await handleMeetingStarted(payload);
        break;
      case "meeting.ended":
        await handleMeetingEnded(payload);
        break;
      case "meeting.participant_joined":
        await handleParticipantJoined(payload);
        break;
      case "meeting.participant_left":
        await handleParticipantLeft(payload);
        break;
      default:
      // Unhandled Zoom webhook event - no action needed
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error handling Zoom webhook:", error);
    res.status(500).json({
      success: false,
      message: "Error processing webhook",
      error: error.message,
    });
  }
};

/**
 * Helper function to handle meeting started event
 */
const handleMeetingStarted = async (payload) => {
  try {
    const meetingId = payload.object?.id?.toString();
    if (!meetingId) return;

    const session = await LiveSession.findOne({ zoomMeetingId: meetingId });
    if (session && session.status === "scheduled") {
      await session.startSession();
    }
  } catch (error) {
    console.error("Error handling meeting started:", error);
  }
};

/**
 * Helper function to handle meeting ended event
 */
const handleMeetingEnded = async (payload) => {
  try {
    const meetingId = payload.object?.id?.toString();
    if (!meetingId) return;

    const session = await LiveSession.findOne({ zoomMeetingId: meetingId });
    if (session && session.status === "live") {
      await session.endSession();
    }
  } catch (error) {
    console.error("Error handling meeting ended:", error);
  }
};

/**
 * Helper function to handle participant joined event
 */
const handleParticipantJoined = async (payload) => {
  try {
    const meetingId = payload.object?.id?.toString();
    const participantEmail = payload.object?.participant?.email;

    if (!meetingId || !participantEmail) return;

    // Find user by email and add to session participants
    const User = require("../models/User");
    const user = await User.findOne({ email: participantEmail });

    if (user) {
      const session = await LiveSession.findOne({ zoomMeetingId: meetingId });
      if (session) {
        await session.addParticipant(user._id);
      }
    }
  } catch (error) {
    console.error("Error handling participant joined:", error);
  }
};

/**
 * Helper function to handle participant left event
 */
const handleParticipantLeft = async (payload) => {
  try {
    const meetingId = payload.object?.id?.toString();
    const participantEmail = payload.object?.participant?.email;

    if (!meetingId || !participantEmail) return;

    // Find user by email and remove from session participants
    const User = require("../models/User");
    const user = await User.findOne({ email: participantEmail });

    if (user) {
      const session = await LiveSession.findOne({ zoomMeetingId: meetingId });
      if (session) {
        await session.removeParticipant(user._id);
      }
    }
  } catch (error) {
    console.error("Error handling participant left:", error);
  }
};

module.exports = {
  generateZoomSignature,
  getZoomMeetingDetails,
  handleZoomWebhook,
};
