const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  generateStreamingUrl,
  verifyVideoAccess,
  getVideoMetadata,
  debugLessonVideo
} = require('../controllers/videoController');

// Import specific rate limiters
const {
  videoStreamLimiter,
  apiReadLimiter,
  adminLimiter
} = require('../middleware/advancedRateLimit');

const router = express.Router();

// All video routes require authentication
router.use(protect);

// Generate temporary streaming URL for a lesson video
router.post('/stream/:lessonId', videoStreamLimiter, generateStreamingUrl);

// Verify video access token
router.post('/verify', apiReadLimiter, verifyVideoAccess);

// Get video metadata without URL
router.get('/metadata/:lessonId', apiReadLimiter, getVideoMetadata);

// Debug lesson video info (admin/instructor only)
router.get('/debug/:lessonId', adminLimiter, debugLessonVideo);

module.exports = router;
