const express = require("express");
const router = express.Router();

const {
  sendResetPasswordLink,
  handlePasswordReset,     // GET → render form
  handlePasswordUpdate,    // POST → update password
} = require("../controllers/passwordController");

// Send reset password link via email
router.post("/password-link", sendResetPasswordLink);

// Render reset password form (GET from email link)
router.get("/reset-password/:userId/:token", handlePasswordReset);

// Handle reset password submission (from server-rendered form)
router.post("/reset-password/:userId/:token", handlePasswordUpdate);

module.exports = router;
