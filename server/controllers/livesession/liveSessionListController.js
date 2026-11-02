// Live session listings for instructor, student and admin. Split from liveSessionCoreController.js; bodies unchanged.

const logger = require('../../utils/logger');
const LiveSession = require("../../models/LiveSession");
const Course = require("../../models/Course");

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
    logger.error("Error fetching instructor sessions:", error);
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
    logger.error("Error fetching student sessions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sessions",
      error: error.message,
    });
  }
};

/**
 * @desc    Join live session
 * @route   POST /api/live-sessions/:id/join
 * @access  Private (Enrolled students and instructors)
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
    logger.error("Error fetching all live sessions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching live sessions",
      error: error.message,
    });
  }
};

module.exports = {
  getInstructorSessions,
  getStudentSessions,
  getAllLiveSessions
};
