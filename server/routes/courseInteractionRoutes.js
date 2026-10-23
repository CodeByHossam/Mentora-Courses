const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getCourseInteractions,
  addComment,
  editComment,
  deleteComment,
  addTest,
  editTest,
  deleteTest,
  uploadAnswerKey,
  downloadAnswerKey,
  submitTestAnswer,
  gradeTestSubmission,
  addAttachment,
  editAttachment,
  removeAttachment,
  deleteTestAnswer,
} = require("../controllers/courseInteractionController");

// Use memory storage for file uploads (consistent with upload.js middleware)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/zip",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/avi",
    "audio/mpeg",
    "audio/wav",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Health check endpoints
router.get("/ping", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Course interactions routes
router.route("/:courseId").get(protect, getCourseInteractions);

// Comment routes
router.route("/:courseId/Comment").post(protect, addComment);

router
  .route("/:courseId/Comment/:commentId")
  .put(protect, editComment)
  .delete(protect, deleteComment);

// Test routes
router
  .route("/:courseId/tests")
  .post(
    protect,
    authorize(["instructor", "admin"]),
    upload.single("testFile"),
    addTest
  );

router
  .route("/:courseId/tests/:testId")
  .put(
    protect,
    authorize(["instructor", "admin"]),
    upload.single("testFile"),
    editTest
  )
  .delete(protect, authorize(["instructor", "admin"]), deleteTest);

router
  .route("/:courseId/tests/:testId/submit")
  .post(
    protect,
    authorize(["student", "instructor", "admin"]),
    upload.single("answerFile"),
    submitTestAnswer
  );

router
  .route("/:courseId/tests/:testId/answer-key")
  .post(
    protect,
    authorize(["instructor", "admin"]),
    upload.single("answerKeyFile"),
    uploadAnswerKey
  );

router
  .route("/:courseId/tests/:testId/answer-key/download")
  .get(
    protect,
    authorize(["instructor", "admin", "student"]),
    downloadAnswerKey
  );

router
  .route("/:courseId/tests/:testId/submissions/:submissionId/grade")
  .put(protect, authorize(["instructor", "admin"]), gradeTestSubmission);

// Attachment routes
router
  .route("/:courseId/attachments")
  .post(protect, upload.single("file"), addAttachment);

router
  .route("/:courseId/attachments/:attachmentId")
  .put(protect, upload.single("file"), editAttachment)
  .delete(protect, removeAttachment);

// Delete student's test answer
router.delete(
  "/:courseId/tests/:testId/submissions/:submissionId",
  protect,
  authorize(["student", "admin"]),
  deleteTestAnswer
);

module.exports = router;
