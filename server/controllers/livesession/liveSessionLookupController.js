// Live session lookups: course listing and single session. Split from liveSessionCoreController.js; bodies unchanged.

const logger = require('../../utils/logger');
const LiveSession = require("../../models/LiveSession");
const Course = require("../../models/Course");

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
    logger.error("Error fetching sessions by course:", error);
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
    logger.error("Error fetching live session:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching session",
      error: error.message,
    });
  }
};

module.exports = {
  getSessionsByCourse,
  getLiveSession
};
