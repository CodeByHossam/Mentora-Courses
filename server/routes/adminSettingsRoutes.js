const express = require("express");
const router = express.Router();
const {
  getAdminSettings,
  updateAdminSettings,
  updatePaymentSettings,
  getPaymentStats,
  resetPaymentSettings,
  testPaymentGateway
} = require("../controllers/adminSettingsController");
const { protect, admin } = require("../middleware/authMiddleware");

// All routes require admin authentication
router.use(protect, admin);

// Main settings routes
router.route("/")
  .get(getAdminSettings)
  .put(updateAdminSettings);

// Payment-specific routes
router.route("/payment")
  .put(updatePaymentSettings);

router.route("/payment/reset")
  .post(resetPaymentSettings);

router.route("/payment-stats")
  .get(getPaymentStats);

router.route("/test-gateway")
  .post(testPaymentGateway);

module.exports = router;
