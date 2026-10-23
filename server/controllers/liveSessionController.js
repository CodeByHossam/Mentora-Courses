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

const LiveSession = require("../models/LiveSession");
const Course = require("../models/Course");
const User = require("../models/User");
const sendEmail = require("../utils/emailSender");
const axios = require("axios");
const getZoomAccessToken = require("../utils/zoomAuth");

// Zoom API configuration
const ZOOM_API_BASE_URL = "https://api.zoom.us/v2";
const ZOOM_JWT_TOKEN = process.env.ZOOM_JWT_TOKEN;
const ZOOM_API_KEY = process.env.ZOOM_API_KEY;
const ZOOM_API_SECRET = process.env.ZOOM_API_SECRET;
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;

/**
 * Helper function to send session reminder emails
 */
const sendSessionReminder = async (session, reminderType = "upcoming") => {
  try {
    // Get course details and enrolled students
    const course = await Course.findById(session.course).populate(
      "enrolledStudents",
      "email name"
    );
    if (!course) return;

    const instructor = await User.findById(session.instructor);
    if (!instructor) return;

    const sessionDate = new Date(session.scheduledDate);
    const formattedDate = sessionDate.toLocaleDateString();
    const formattedTime = sessionDate.toLocaleTimeString();

    let subject, emailText;

    switch (reminderType) {
      case "upcoming":
        subject = `Upcoming Live Session: ${session.title}`;
        emailText = `
Hello,

This is a reminder that you have a live session scheduled:

Course: ${course.title}
Session: ${session.title}
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${session.duration} minutes
Instructor: ${instructor.name}

Description:
${session.description}

${
  session.zoomJoinUrl
    ? `Join URL: ${session.zoomJoinUrl}`
    : "Join details will be provided closer to the session time."
}
${session.zoomPassword ? `Meeting Password: ${session.zoomPassword}` : ""}

Please make sure to join on time. The session will start promptly at the scheduled time.

Best regards,
Mentora Team
        `;
        break;

      case "starting":
        subject = `Live Session Starting Now: ${session.title}`;
        emailText = `
Hello,

Your live session is starting now!

Course: ${course.title}
Session: ${session.title}
Instructor: ${instructor.name}

${
  session.zoomJoinUrl
    ? `Join Now: ${session.zoomJoinUrl}`
    : "Please check your course dashboard for join details."
}
${session.zoomPassword ? `Meeting Password: ${session.zoomPassword}` : ""}

Don't miss out - join the session now!

Best regards,
Mentora Team
        `;
        break;

      case "recording_available":
        subject = `Session Recording Available: ${session.title}`;
        emailText = `
Hello,

The recording for your recent live session is now available:

Course: ${course.title}
Session: ${session.title}
Date: ${formattedDate}
Instructor: ${instructor.name}

${
  session.recordingUrl
    ? `Watch Recording: ${session.recordingUrl}`
    : "The recording will be available in your course dashboard shortly."
}
${
  session.recordingPassword
    ? `Recording Password: ${session.recordingPassword}`
    : ""
}

You can access this recording anytime from your course dashboard.

Best regards,
Mentora Team
        `;
        break;
    }

    // Send email to all enrolled students
    const emailPromises = course.enrolledStudents.map((student) =>
      sendEmail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject,
        text: emailText,
      })
    );

    await Promise.all(emailPromises);
  } catch (error) {
    console.error("Error sending session reminder:", error);
  }
};

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
        console.error(
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
    console.error(
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

/**
 * @desc    Get all live sessions for a course
 * @route   GET /api/live-sessions/course/:courseId
 * @access  Private
 */
const getSessionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status, upcoming, page = 1, limit = 10 } = req.query;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if user has access to this course (enrolled student, instructor, or admin)
    const isInstructor = course.instructor.toString() === req.user.id;
    const isEnrolledStudent = course.enrolledStudents.includes(req.user.id);
    const isAdmin = req.user.role === "admin";

    if (!isInstructor && !isEnrolledStudent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You must be enrolled in this course or be the instructor.",
      });
    }

    // Build query
    let query = { course: courseId };

    if (status) {
      query.status = status;
    }

    if (upcoming === "true") {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: ["scheduled", "live"] };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sessions
    const sessions = await LiveSession.find(query)
      .populate("course", "title")
      .populate("instructor", "name email")
      .populate("participants.user", "name email")
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await LiveSession.countDocuments(query);

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sessions by course:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sessions",
      error: error.message,
    });
  }
};

/**
 * @desc    Get instructor's live sessions
 * @route   GET /api/live-sessions/instructor
 * @access  Private (Instructor only)
 */
const getInstructorSessions = async (req, res) => {
  try {
    const { status, upcoming, page = 1, limit = 10 } = req.query;

    // Build query
    let query = { instructor: req.user.id };

    if (status) {
      query.status = status;
    }

    if (upcoming === "true") {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: ["scheduled", "live"] };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sessions
    const sessions = await LiveSession.find(query)
      .populate("course", "title")
      .populate("instructor", "name email")
      .populate("participants.user", "name email")
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await LiveSession.countDocuments(query);

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching instructor sessions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sessions",
      error: error.message,
    });
  }
};

/**
 * @desc    Get student's upcoming sessions
 * @route   GET /api/live-sessions/student
 * @access  Private (Student only)
 */
const getStudentSessions = async (req, res) => {
  try {
    const { upcoming, page = 1, limit = 10 } = req.query;

    // Find courses the student is enrolled in
    const enrolledCourses = await Course.find({
      enrolledStudents: req.user.id,
    }).select("_id");

    const courseIds = enrolledCourses.map((course) => course._id);

    // Build query
    let query = { course: { $in: courseIds } };

    if (upcoming === "true") {
      query.scheduledDate = { $gte: new Date() };
      query.status = { $in: ["scheduled", "live"] };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get sessions
    const sessions = await LiveSession.find(query)
      .populate("course", "title")
      .populate("instructor", "name email")
      .sort({ scheduledDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await LiveSession.countDocuments(query);

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching student sessions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sessions",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single live session
 * @route   GET /api/live-sessions/:id
 * @access  Private
 */
const getLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id)
      .populate("course", "title enrolledStudents")
      .populate("instructor", "name email")
      .populate("participants.user", "name email");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Live session not found",
      });
    }

    // Check if user has access to this session
    const isInstructor = session.instructor._id.toString() === req.user.id;
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

    res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Error fetching live session:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching session",
      error: error.message,
    });
  }
};

/**
 * @desc    Update live session
 * @route   PUT /api/live-sessions/:id
 * @access  Private (Instructor only)
 */
const updateLiveSession = async (req, res) => {
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
        message: "Only the session instructor can update this session",
      });
    }

    // Prevent updating live or completed sessions
    if (session.status === "live" || session.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot update live or completed sessions",
      });
    }

    const {
      title,
      description,
      scheduledDate,
      duration,
      sessionType,
      maxParticipants,
      instructorNotes,
    } = req.body;

    // Validate scheduled date if provided
    if (scheduledDate) {
      const sessionDate = new Date(scheduledDate);
      const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);

      if (sessionDate <= oneHourFromNow) {
        return res.status(400).json({
          success: false,
          message: "Session must be scheduled at least 1 hour in advance",
        });
      }

      // Check for time conflicts with instructor's existing sessions (excluding current session)
      const sessionDuration = duration ? parseInt(duration) : session.duration;
      const sessionEndTime = new Date(
        sessionDate.getTime() + sessionDuration * 60 * 1000
      );

      const conflictingSessions = await LiveSession.find({
        _id: { $ne: session._id }, // Exclude current session
        instructor: req.user.id,
        status: { $nin: ["completed", "cancelled"] }, // Exclude completed and cancelled sessions
        $or: [
          {
            // New session starts during existing session
            scheduledDate: { $lte: sessionDate },
            $expr: {
              $gte: [
                {
                  $add: ["$scheduledDate", { $multiply: ["$duration", 60000] }],
                },
                sessionDate,
              ],
            },
          },
          {
            // New session ends during existing session
            scheduledDate: { $lte: sessionEndTime },
            $expr: {
              $gte: [
                {
                  $add: ["$scheduledDate", { $multiply: ["$duration", 60000] }],
                },
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
          .map((conflictSession) => {
            const conflictDate = new Date(conflictSession.scheduledDate);
            return `"${conflictSession.title}" in course "${
              conflictSession.course.title
            }" on ${conflictDate.toLocaleDateString()} at ${conflictDate.toLocaleTimeString()}`;
          })
          .join(", ");

        return res.status(400).json({
          success: false,
          message: `⏰ Time conflict detected! You already have a session scheduled during this time: ${conflictDetails}. Please choose a different time slot.`,
          conflictingSessions: conflictingSessions.map((conflictSession) => ({
            id: conflictSession._id,
            title: conflictSession.title,
            course: conflictSession.course.title,
            scheduledDate: conflictSession.scheduledDate,
            duration: conflictSession.duration,
          })),
        });
      }
    }

    // Update fields
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (scheduledDate) updateData.scheduledDate = new Date(scheduledDate);
    if (duration) updateData.duration = parseInt(duration);
    if (sessionType) updateData.sessionType = sessionType;
    if (maxParticipants) updateData.maxParticipants = parseInt(maxParticipants);
    if (instructorNotes !== undefined)
      updateData.instructorNotes = instructorNotes;

    const updatedSession = await LiveSession.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("course", "title")
      .populate("instructor", "name email");

    res.status(200).json({
      success: true,
      message: "Live session updated successfully",
      data: updatedSession,
    });
  } catch (error) {
    console.error("Error updating live session:", error);
    res.status(500).json({
      success: false,
      message: "Error updating session",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete live session
 * @route   DELETE /api/live-sessions/:id
 * @access  Private (Instructor only)
 */
const deleteLiveSession = async (req, res) => {
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
        message: "Only the session instructor can delete this session",
      });
    }

    // Prevent deleting live sessions
    if (session.status === "live") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a live session. Please end the session first.",
      });
    }

    // 🔗 CLEAN UP RELATIONSHIPS - Remove session from course and users
    await Course.findByIdAndUpdate(session.course, {
      $pull: { liveSessions: session._id },
    });

    // Remove from instructor's liveSessions array
    await User.findByIdAndUpdate(session.instructor, {
      $pull: { liveSessions: session._id },
    });

    // Remove from all participants' liveSessions arrays
    if (session.participants && session.participants.length > 0) {
      const participantIds = session.participants.map((p) => p.user);
      await User.updateMany(
        { _id: { $in: participantIds } },
        { $pull: { liveSessions: session._id } }
      );
    }

    await LiveSession.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Live session deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting live session:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting session",
      error: error.message,
    });
  }
};

/**
 * @desc    Join live session
 * @route   POST /api/live-sessions/:id/join
 * @access  Private (Enrolled students and instructors)
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
    console.error("Error joining live session:", error);
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
    console.error("Error leaving live session:", error);
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
    console.error("Error starting live session:", error);
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
    console.error("Error ending live session:", error);
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
    console.error("Error uploading session recording:", error);
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
const getAllLiveSessions = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const { status, upcoming, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // Filter by status if provided
    if (status && status !== "all") {
      if (status === "upcoming") {
        query.scheduledDate = { $gt: new Date() };
        query.status = { $ne: "completed" };
      } else if (status === "ongoing") {
        const now = new Date();
        query.scheduledDate = { $lte: now };
        query.status = "active";
      } else if (status === "past") {
        query.$or = [
          { status: "completed" },
          {
            scheduledDate: {
              $lt: new Date(Date.now() - 24 * 60 * 60 * 1000), // More than 24 hours ago
            },
          },
        ];
      } else {
        query.status = status;
      }
    }

    // Get sessions with populated data
    const sessions = await LiveSession.find(query)
      .populate({
        path: "course",
        select: "title price category enrolledStudents",
        populate: [
          {
            path: "instructor",
            select: "name email",
          },
          {
            path: "category",
            select: "name",
          },
        ],
      })
      .populate("instructor", "name email")
      .populate("participants", "name email")
      .sort({ scheduledDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalSessions = await LiveSession.countDocuments(query);

    res.status(200).json({
      success: true,
      sessions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalSessions / limit),
        totalSessions,
        hasNextPage: page * limit < totalSessions,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching all live sessions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching live sessions",
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel live session
 * @route   POST /api/live-sessions/:id/cancel
 * @access  Private (Instructor/Admin only)
 */
const cancelLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Check authorization - only instructor of the session or admin can cancel
    if (
      req.user.role !== "admin" &&
      session.instructor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this session",
      });
    }

    // Check if session can be cancelled
    if (session.status === "completed" || session.status === "active") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed or active session",
      });
    }

    // Update session status
    session.status = "cancelled";
    await session.save();

    res.status(200).json({
      success: true,
      message: "Session cancelled successfully",
      data: session,
    });
  } catch (error) {
    console.error("Error cancelling session:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling session",
      error: error.message,
    });
  }
};

/**
 * @desc    Test Zoom credentials
 * @route   GET /api/live-sessions/test-zoom
 * @access  Private (Instructor only)
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
    console.error(
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
  createLiveSession,
  getSessionsByCourse,
  getInstructorSessions,
  getStudentSessions,
  getLiveSession,
  updateLiveSession,
  deleteLiveSession,
  joinLiveSession,
  leaveLiveSession,
  startLiveSession,
  endLiveSession,
  uploadSessionRecording,
  getAllLiveSessions,
  cancelLiveSession,
  testZoomCredentials,
};
