const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const adminController = require("../controllers/adminController");

// Import specific rate limiters
const {
  adminLimiter,
  apiReadLimiter
} = require("../middleware/advancedRateLimit");

// Admin only routes
router.post(
  "/users",
  protect,
  authorize(["admin"]),
  adminLimiter,
  adminController.createUser
);

// Get all users
router.get("/users", protect, authorize(["admin"]), adminLimiter, adminController.getUsers);

// Update user active state
router.patch(
  "/users/:id/active-state",
  protect,
  authorize(["admin"]),
  adminLimiter,
  adminController.updateUserActiveState
);

// Update user verification state
router.patch(
  "/users/:id/verification-state",
  protect,
  authorize(["admin"]),
  adminLimiter,
  adminController.updateUserVerificationState
);

router.get("/reports", protect, authorize(["admin"]), adminLimiter, adminController.getReports);

// Get all instructors with billing data
router.get("/instructors-with-billing", protect, authorize(["admin"]), async (req, res) => {
  try {
    const User = require("../models/User");
    const InstructorBillingAccount = require("../models/InstructorBillingAccount");

    // Get all instructors
    const instructors = await User.find({ role: "instructor" }).select("name email avatar");

    // Get billing data for each instructor
    const instructorsWithBilling = await Promise.all(
      instructors.map(async (instructor) => {
        const billingAccount = await InstructorBillingAccount.findOne({ 
          instructorId: instructor._id 
        }).select("totalCommissionEarned pendingCommissions totalPayoutsReceived annualFees");

        return {
          ...instructor.toObject(),
          billingAccount: billingAccount || {
            totalCommissionEarned: 0,
            pendingCommissions: 0,
            totalPayoutsReceived: 0,
            annualFees: 10
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        users: instructorsWithBilling,
        count: instructorsWithBilling.length
      }
    });
  } catch (error) {
    console.error("Error fetching instructors with billing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch instructors with billing data"
    });
  }
});

module.exports = router;
