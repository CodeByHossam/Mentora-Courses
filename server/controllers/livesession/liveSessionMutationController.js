// Live session update, delete and cancel. Split from liveSessionCoreController.js; bodies unchanged.

const logger = require('../../utils/logger');
const LiveSession = require("../../models/LiveSession");
const Course = require("../../models/Course");
const User = require("../../models/User");

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
    logger.error("Error updating live session:", error);
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
    logger.error("Error deleting live session:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting session",
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
    logger.error("Error cancelling session:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling session",
      error: error.message,
    });
  }
};

module.exports = {
  updateLiveSession,
  deleteLiveSession,
  cancelLiveSession
};
