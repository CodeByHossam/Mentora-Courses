// Lesson Routes
const express = require("express");
const router = express.Router();

const {
  getLessons,
  getLesson,
  addLesson,
  updateLesson,
  deleteLesson,
  getCourseLessons,
} = require("../controllers/lessonsControllers");

const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // multer memory storage

// Import rate limiters
const {
  lessonCreationLimiter,
  apiReadLimiter
} = require("../middleware/advancedRateLimit");

// Admin and instructor route to add a lesson with file upload fields (image + video)
router.post(
  "/:courseId",
  protect,
  authorize(["admin", "instructor"]),
  lessonCreationLimiter, // Rate limit lesson creation
  upload.fields([
    { name: "image", maxCount: 1 }, // accept single image file named "image"
    { name: "video", maxCount: 1 }, // accept single video file named "video"
  ]),
  addLesson
);

router.get("/", apiReadLimiter, getLessons);
router.get(
  "/course/:courseId",
  protect,
  authorize(["admin", "instructor"]),
  apiReadLimiter,
  getCourseLessons
);
router.get("/:id", protect, authorize(["admin", "instructor"]), apiReadLimiter, getLesson);
router.put(
  "/:id",
  protect,
  authorize(["admin", "instructor"]),
  lessonCreationLimiter, // Rate limit lesson updates
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  updateLesson
);
router.delete(
  "/:id",
  protect,
  authorize(["admin", "instructor"]),
  lessonCreationLimiter, // Rate limit lesson deletion
  deleteLesson
);

module.exports = router;
