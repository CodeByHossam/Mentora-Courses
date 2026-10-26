const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getCourseProgress, markLessonComplete, updatePosition } = require("../controllers/progressController");

router.get("/:courseId", protect, getCourseProgress);
router.post("/:courseId/lessons/:lessonId/complete", protect, markLessonComplete);
router.put("/:courseId/lessons/:lessonId/position", protect, updatePosition);

module.exports = router;