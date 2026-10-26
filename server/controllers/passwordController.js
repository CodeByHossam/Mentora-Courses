const logger = require('../utils/logger');
// controllers/passwordController.js
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const hashPassword = require("../middleware/hashPassword");
const sendEmail = require("../utils/emailSender");

// ========== SEND RESET PASSWORD LINK ==========
const sendResetPasswordLink = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Secret = current password hash + app secret
    const secret = user.password + process.env.JWT_SECRET;

    // Create JWT token with 15 minutes expiry
    const token = jwt.sign({ email: user.email, id: user._id }, secret, {
      expiresIn: "15m",
    });

    // Construct reset link for server-rendered form (only)
    const serverLink = `${process.env.SERVER_URL}/api/password/reset-password/${user._id}/${token}`;

    // Send email with reset link
    const text = `Hello ${user.name},

You requested a password reset. Please use the link below:

${serverLink}

This link is valid for 15 minutes.

If you didn't request this, ignore this email.`;

    await sendEmail({
      to: user.email,
      subject: "Reset Your Password",
      text,
    });

    res
      .status(200)
      .json({
        success: true,
        message: "Reset password link sent to your email.",
      });
  } catch (error) {
    logger.error("Error sending reset link:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ========== RENDER RESET PASSWORD FORM ==========
const handlePasswordReset = async (req, res) => {
  const { userId, token } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("Invalid or expired link.");
    }

    const secret = user.password + process.env.JWT_SECRET;

    // Verify token with the secret derived from current password hash
    jwt.verify(token, secret);

    // Render the reset password form, pass userId and token
    res.render("resetPasswordForm", { userId, token });
  } catch (err) {
    logger.error("Token verification error:", err);
    res.status(401).render("tokenExpired");
  }
};

// ========== HANDLE PASSWORD UPDATE ==========
const handlePasswordUpdate = async (req, res) => {
  const { userId, token } = req.params;
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).render("passwordMismatch");
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found.");
    }

    const secret = user.password + process.env.JWT_SECRET;

    // Verify token before updating password
    jwt.verify(token, secret);

    // Hash new password and save
    user.password = await hashPassword(password);
    await user.save();

    res.render("passwordResetSuccess");
  } catch (err) {
    logger.error("Password reset error:", err);
    res.status(401).render("tokenExpired");
  }
};

module.exports = {
  sendResetPasswordLink,
  handlePasswordReset,
  handlePasswordUpdate,
};
