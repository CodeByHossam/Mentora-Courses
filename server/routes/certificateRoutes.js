const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
  getCertificatesByCourse,
  getStudentCertificates,
  uploadCertificate,
  downloadCertificate,
  deleteCertificate,
  getEnrolledStudentsForCertificates,
} = require("../controllers/certificateController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const { sanitizeInput } = require("../middleware/sanitizeMiddleware");

const certificateValidation = require("../validations/certificateValidation");

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed for certificates"), false);
    }
  },
});

// @route   GET /api/certificates/course/:courseId
// @desc    Get all certificates for a course
// @access  Private (Instructor/Admin)
router.get(
  "/course/:courseId",
  protect,
  authorize(["instructor", "admin"]),
  getCertificatesByCourse
);

// @route   GET /api/certificates/course/:courseId/students
// @desc    Get enrolled students for certificate management
// @access  Private (Instructor/Admin)
router.get(
  "/course/:courseId/students",
  protect,
  authorize(["instructor", "admin"]),
  getEnrolledStudentsForCertificates
);

// @route   GET /api/certificates/student
// @desc    Get student's certificates
// @access  Private (Student)
router.get("/student", protect, authorize(["student"]), getStudentCertificates);

// @route   POST /api/certificates/upload
// @desc    Upload certificate for student
// @access  Private (Instructor/Admin)
router.post(
  "/upload",
  protect,
  authorize(["instructor", "admin"]),
  upload.single("certificate"),
  sanitizeInput({ allowHtmlFields: [] }),
  validate(certificateValidation.upload),
  uploadCertificate
);

// @route   GET /api/certificates/:certificateId/download
// @desc    Download certificate
// @access  Private (Student - own certificates, Instructor/Admin - course certificates)
// Note: Authentication is handled manually in the controller to support query parameter tokens
router.get("/:certificateId/download", downloadCertificate);

// @route   DELETE /api/certificates/:certificateId
// @desc    Delete certificate
// @access  Private (Instructor/Admin)
router.delete(
  "/:certificateId",
  protect,
  authorize(["instructor", "admin"]),
  deleteCertificate
);

module.exports = router;
