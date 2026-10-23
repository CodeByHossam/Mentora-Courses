const express = require("express");
const router = express.Router();
const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  getInstructorStudents,
  getInstructorReports,
  resendVerificationEmail,
  getAdminBankDetails
} = require("../controllers/userController");

const { protect, admin, authorize, tokenMatchParams } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // multer memory storage

// ==================== ADMIN ROUTES ====================
// Create a new user (Admin only)
router.post("/", protect, admin, upload.single("photo"), createUser);

// Get all users
router.get("/", protect, admin, getUsers);

// Get user statistics
router.get("/stats", protect, admin, getUserStats);

// 📦 SIMPLIFIED: Get admin bank details for direct transfers (must come BEFORE /:id)
router.get("/admin/bank-details", getAdminBankDetails);

// Get user by ID (must be last to avoid matching specific routes)
router.get("/:id", protect, authorize(["admin","student"]), getUserById);

// Update user
router.put("/:id", protect, admin, upload.single("photo"), updateUser);

// Delete user
router.delete("/:id", protect, admin, deleteUser);

// ==================== INSTRUCTOR ROUTES ====================
// Get students enrolled in instructor's courses
router.get(
  "/instructor/:instructorId/students",
  protect,
  authorize(["instructor", "admin"]),
  tokenMatchParams,
  getInstructorStudents
);

// Get instructor reports
router.get(
  "/instructor/:instructorId/reports",
  protect,
  authorize(["instructor", "admin"]),
  tokenMatchParams,
  getInstructorReports
);

// ==================== EMAIL VERIFICATION ====================
// Resend verification email
router.post("/resend-verification", resendVerificationEmail);

module.exports = router;
