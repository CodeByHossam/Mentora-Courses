/**
 * Live Session Routes
 * 
 * Defines all API routes for live session management
 */

const express = require("express");
const router = express.Router();

// Import middleware
const { protect } = require("../middleware/authMiddleware");
const { validateLiveSession, validateSessionUpdate, validateRecording } = require("../validations/liveSessionValidation");

// Import controller functions
const {
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
  testZoomCredentials
} = require("../controllers/liveSessionController");

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @route   GET /api/live-sessions/test-zoom
 * @desc    Test Zoom credentials
 * @access  Private (Instructor only)
 */
router.get("/test-zoom", testZoomCredentials);

/**
 * @route   GET /api/live-sessions/admin/all
 * @desc    Get all live sessions (Admin only)
 * @access  Private (Admin only)
 * @query   status, upcoming, page, limit
 */
router.get("/admin/all", getAllLiveSessions);

/**
 * @route   POST /api/live-sessions
 * @desc    Create a new live session
 * @access  Private (Instructor only)
 */
router.post("/", validateLiveSession, createLiveSession);

/**
 * @route   GET /api/live-sessions/course/:courseId
 * @desc    Get all live sessions for a specific course
 * @access  Private (Enrolled students and instructor)
 * @query   status, upcoming, page, limit
 */
router.get("/course/:courseId", getSessionsByCourse);

/**
 * @route   GET /api/live-sessions/instructor
 * @desc    Get all live sessions for the current instructor
 * @access  Private (Instructor only)
 * @query   status, upcoming, page, limit
 */
router.get("/instructor", getInstructorSessions);

/**
 * @route   GET /api/live-sessions/student
 * @desc    Get all live sessions for the current student
 * @access  Private (Student only)
 * @query   upcoming, page, limit
 */
router.get("/student", getStudentSessions);

/**
 * @route   GET /api/live-sessions/:id
 * @desc    Get a single live session
 * @access  Private (Enrolled students and instructor)
 */
router.get("/:id", getLiveSession);

/**
 * @route   PUT /api/live-sessions/:id
 * @desc    Update a live session
 * @access  Private (Instructor only)
 */
router.put("/:id", validateSessionUpdate, updateLiveSession);

/**
 * @route   DELETE /api/live-sessions/:id
 * @desc    Delete a live session
 * @access  Private (Instructor only)
 */
router.delete("/:id", deleteLiveSession);

/**
 * @route   POST /api/live-sessions/:id/join
 * @desc    Join a live session
 * @access  Private (Enrolled students only)
 */
router.post("/:id/join", joinLiveSession);

/**
 * @route   POST /api/live-sessions/:id/leave
 * @desc    Leave a live session
 * @access  Private
 */
router.post("/:id/leave", leaveLiveSession);

/**
 * @route   POST /api/live-sessions/:id/start
 * @desc    Start a live session
 * @access  Private (Instructor only)
 */
router.post("/:id/start", startLiveSession);

/**
 * @route   POST /api/live-sessions/:id/end
 * @desc    End a live session
 * @access  Private (Instructor only)
 */
router.post("/:id/end", endLiveSession);

/**
 * @route   POST /api/live-sessions/:id/recording
 * @desc    Upload session recording
 * @access  Private (Instructor only)
 */
router.post("/:id/recording", validateRecording, uploadSessionRecording);

/**
 * @route   POST /api/live-sessions/:id/cancel
 * @desc    Cancel a live session
 * @access  Private (Instructor/Admin only)
 */
router.post("/:id/cancel", cancelLiveSession);

module.exports = router;
