// Live session creation (Zoom meeting + notifications). Split from liveSessionCoreController.js; bodies unchanged.

const logger = require('../../utils/logger');
const LiveSession = require("../../models/LiveSession");
const Course = require("../../models/Course");
const User = require("../../models/User");
const axios = require("axios");
const getZoomAccessToken = require("../../utils/zoomAuth");
const { sendSessionReminder } = require("./liveSessionReminderHelper");

/**
 * @desc    Create a new live session
 * @route   POST /api/live-sessions
 * @access  Private (Instructor only)
 */

const createLiveSession = async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      scheduledDate,
      duration,
      sessionType,
      maxParticipants,
      instructorNotes,
    } = req.body;

    // Validate required fields
    if (!title || !description || !courseId || !scheduledDate || !duration) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: title, description, courseId, scheduledDate, duration",
      });
    }

    // Check if course exists and user is the instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (
      course.instructor.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the course instructor can schedule live sessions",
      });
    }

    // Validate scheduled date
    const sessionDate = new Date(scheduledDate);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

    if (sessionDate <= oneHourFromNow) {
      return res.status(400).json({
        success: false,
        message: "Session must be scheduled at least 1 hour in advance",
      });
    }

    // Check for time conflicts with instructor's existing sessions
    const sessionEndTime = new Date(
      sessionDate.getTime() + parseInt(duration) * 60 * 1000
    );

    const conflictingSessions = await LiveSession.find({
      instructor: req.user.id,
      status: { $nin: ["completed", "cancelled"] }, // Exclude completed and cancelled sessions
      $or: [
        {
          // New session starts during existing session
          scheduledDate: { $lte: sessionDate },
          $expr: {
            $gte: [
              { $add: ["$scheduledDate", { $multiply: ["$duration", 60000] }] },
              sessionDate,
            ],
          },
        },
        {
          // New session ends during existing session
          scheduledDate: { $lte: sessionEndTime },
          $expr: {
            $gte: [
              { $add: ["$scheduledDate", { $multiply: ["$duration", 60000] }] },
              sessionEndTime,
            ],
          },
        },
        {
          // Existing session is completely within new session
          scheduledDate: { $gte: sessionDate, $lte: sessionEndTime },
        },
      ],
    }).populate("course", "title");

    if (conflictingSessions.length > 0) {
      const conflictDetails = conflictingSessions
        .map((session) => {
          const conflictDate = new Date(session.scheduledDate);
          return `"${session.title}" in course "${
            session.course.title
          }" on ${conflictDate.toLocaleDateString()} at ${conflictDate.toLocaleTimeString()}`;
        })
        .join(", ");

      return res.status(400).json({
        success: false,
        message: `⏰ Time conflict detected! You already have a session scheduled during this time: ${conflictDetails}. Please choose a different time slot.`,
        conflictingSessions: conflictingSessions.map((session) => ({
          id: session._id,
          title: session.title,
          course: session.course.title,
          scheduledDate: session.scheduledDate,
          duration: session.duration,
        })),
      });
    }

    const token = await getZoomAccessToken();

    let zoomMeetingId = null;
    let zoomJoinUrl = null;
    let zoomStartUrl = null;
    let zoomPassword = null;

    if (token) {
      try {
        // Call Zoom API to create meeting
        const zoomResponse = await axios.post(
          "https://api.zoom.us/v2/users/me/meetings",
          {
            topic: title,
            type: 2, // scheduled meeting
            start_time: sessionDate.toISOString(),
            duration: parseInt(duration),
            timezone: "UTC",
            settings: {
              host_video: true,
              participant_video: true,
              waiting_room: true,
              mute_upon_entry: true,
              auto_recording: "cloud",
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Map from Zoom response to our fields
        zoomMeetingId = zoomResponse.data.id.toString();
        zoomJoinUrl = zoomResponse.data.join_url;
        zoomStartUrl = zoomResponse.data.start_url;
        zoomPassword = zoomResponse.data.password;
      } catch (zoomError) {
        logger.error(
          "Zoom API Error:",
          zoomError.response?.data || zoomError.message
        );
      }
    }

    // Save session in DB
    const session = await LiveSession.create({
      title,
      description,
      course: courseId,
      instructor: req.user.id,
      scheduledDate: sessionDate,
      duration: parseInt(duration),
      sessionType: sessionType || "lecture",
      maxParticipants: maxParticipants || 100,
      instructorNotes: instructorNotes || "",

      // 👇 Map from Zoom response
      zoomMeetingId,
      zoomJoinUrl,
      zoomStartUrl,
      zoomPassword,
    });

    // 🔗 UPDATE RELATIONSHIPS - Add session to course and instructor
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { liveSessions: session._id },
    });

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { liveSessions: session._id },
    });

    // Populate the response
    const populatedSession = await LiveSession.findById(session._id)
      .populate("course", "title")
      .populate("instructor", "name email")
      .populate("participants.user", "name email");

    // Send notification emails to enrolled students (async)
    setTimeout(() => {
      sendSessionReminder(populatedSession, "upcoming");
    }, 1000);

    return res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: populatedSession,
    });
  } catch (error) {
    logger.error(
      " Create LiveSession Error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Failed to create session",
      error: error.message,
    });
  }
};

module.exports = {
  createLiveSession
};
