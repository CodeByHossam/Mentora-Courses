const { createUserPayload, generateAccessToken, generateRefreshToken, setSecureRefreshTokenCookie, hashPassword, validatePasswordStrength, setRefreshTokenCookie } = require('./authHelpers');
const logger = require('../../utils/logger');
/**
 * Authentication Controller
 *
 * Handles user authentication operations including registration, login,
 * token management, password reset, and profile management.
 *
 * Features:
 * - User registration with email verification
 * - Secure login with JWT tokens
 * - Refresh token rotation for enhanced security
 * - Password reset functionality
 * - Profile management with avatar upload
 * - Comprehensive input validation and error handling
 */

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../../models/User");
const { uploadToCloudinary } = require("../../utils/cloudinary");
const sendEmail = require("../../utils/emailSender");
const createError = require("http-errors");
const InstructorRequestsModel = require("../../models/InstructorRequestModel");

/* =========================================================
   AUTHENTICATION HELPER FUNCTIONS
   
   Utility functions for token generation, password hashing,
   and user data formatting.
========================================================= */

/**
 * Create standardized user payload for JWT tokens
 * Excludes sensitive information like password
 * @param {Object} user - User document from database
 * @returns {Object} Sanitized user payload for JWT
 */

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, termsAccepted } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("All fields are required");
  }

  // Check if terms are accepted
  if (!termsAccepted || termsAccepted === "false") {
    throw createError(400, "You must accept the Terms and Conditions to register");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw createError(400, "User already exists");
  }

  let avatar = "";
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, "users");
      avatar = result.secure_url;
    } catch {
      throw createError(500, "Failed to upload photo");
    }
  }

  const userHashedPassword = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    password: userHashedPassword,
    role: "student",
    avatar,
    isVerified: false,
    isActive: false,
    termsAccepted: true,
    termsAcceptedAt: new Date(),
  });

  if (!user) {
    res.status(500);
    throw new Error("Failed to register user");
  }

  // Send verification email
  const secret = process.env.JWT_SECRET + user.email;
  const token = jwt.sign({ id: user._id, email: user.email }, secret, {
    expiresIn: "30m",
  });
  const verificationLink = `${process.env.SERVER_URL}/api/auth/verify/${user._id}/${token}`;

  await sendEmail({
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Verify Your Email",
    text: `Hello ${user.name},\n\nPlease verify your email by clicking the link below:\n\n${verificationLink}\n\nThis link is valid for 30 minutes.`,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    message: "User registered successfully. Verification email sent.",
    data: {
      accessToken,
      user: createUserPayload(user),
    },
  });
});

// @route   POST /api/auth/resend-verification
// @access  Public

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw createError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw createError(400, "Email is already verified");
  }

  // Generate verification token
  const secret = process.env.JWT_SECRET + user.email;
  const token = jwt.sign({ userId: user._id }, secret, { expiresIn: "30m" });
  const verificationLink = `${process.env.SERVER_URL}/api/auth/verify/${user._id}/${token}`;

  // Send verification email
  await sendEmail({
    to: user.email,
    subject: "Verify Your Email - Mentora",
    html: `
      <h2>Welcome to Mentora! 🎓</h2>
      <p>Hello ${user.name},</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
      <p>This link is valid for 30 minutes.</p>
      <p>If you didn't create this account, please ignore this email.</p>
    `,
    text: `Hello ${user.name},\n\nPlease verify your email by clicking the link below:\n\n${verificationLink}\n\nThis link is valid for 30 minutes.`,
  });

  res.status(200).json({
    success: true,
    message: "Verification email sent successfully",
  });
});

// @route   GET /api/users/verify/:userId/:token
// @access  Public

const verifyUserEmail = asyncHandler(async (req, res) => {
  const { userId, token } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    throw createError(404, "User not found");
  }

  const secret = process.env.JWT_SECRET + user.email;
  try {
    jwt.verify(token, secret);
    user.isVerified = true;
    user.isActive = true;
    await user.save();

    res.render("emailVerified");
  } catch {
    res.status(401).render("tokenExpired");
  }
});

// @route   POST /api/auth/login
// @access  Public

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const instructor = InstructorRequestsModel.findOne({ email });
  
    const user = await User.findOne({ email });
  if (!user) {
    const errorMessage= instructor?"Please verify your email before logging in or contact the admin":"Invalid email or password"
        const error = new Error(errorMessage);
    error.statusCode = 401;
    throw error; // this sends error to errorHandler middleware
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    // better way to send error with its code
   throw createError(401, "Invalid email or password");

  }

  if (!user.isVerified) {
    // In development mode, auto-verify users for easier testing
    if (process.env.NODE_ENV === "development") {
      user.isVerified = true;
      user.isActive = true;
      await user.save();
    } else {
      throw createError(403, "Please verify your email before logging in.");
    }
  }

  if (!user.isActive) {
    throw createError(403, "Your account has been deactivated. Please contact support.");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    data: {
      accessToken,
      user: createUserPayload(user),
    },
  });
});

// @route   POST /api/auth/refresh
// @access  Public

const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    res.status(200).json({
      success: false,
      message: "No refresh token provided",
      data: null,
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    const newAccessToken = generateAccessToken(user);
    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: { accessToken: newAccessToken, user: createUserPayload(user) },
    });
  } catch {
    res.status(401);
    throw createError(401, "Invalid or expired refresh token");
  }
});

// @route   POST /api/auth/logout
// @access  Public

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res
    .status(200)
    .json({ success: true, message: "Logged out successfully", data: null });
});

// @route   GET /api/auth/me
// @access  Private

module.exports = {
  registerUser,
  resendVerificationEmail,
  verifyUserEmail,
  loginUser,
  refreshToken,
  logout
};
