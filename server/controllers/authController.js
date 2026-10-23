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
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/cloudinary");
const sendEmail = require("../utils/emailSender");
const createError = require("http-errors");
const InstructorRequestsModel = require("../models/InstructorRequestModel");

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
const createUserPayload = (user) => {
  if (!user) {
    throw createError("User object is required for payload creation",400);
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    isVerified: user.isVerified,
    avatar: user.avatar,
    bio: user.bio,
  };
};

/**
 * Generate JWT access token with short expiration
 * @param {Object} user - User document
 * @returns {string} JWT access token
 */
const generateAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw createError("JWT_SECRET environment variable is not configured");
  }

  return jwt.sign(createUserPayload(user), process.env.JWT_SECRET, {
    expiresIn: "15m",
    issuer: "mentora-api",
    audience: "mentora-client",
  });
};

/**
 * Generate JWT refresh token with longer expiration
 * @param {Object} user - User document
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
  if (!process.env.REFRESH_TOKEN_SECRET) {
    throw new Error(
      "REFRESH_TOKEN_SECRET environment variable is not configured"
    );
  }

  return jwt.sign(createUserPayload(user), process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
    issuer: "mentora-api",
    audience: "mentora-client",
  });
};

/**
 * Set secure HTTP-only refresh token cookie
 * @param {Object} res - Express response object
 * @param {string} token - Refresh token to set in cookie
 */
const setSecureRefreshTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
};

/**
 * Hash password with bcrypt using secure salt rounds
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  if (!password || typeof password !== "string") {
    throw new Error("Valid password string is required");
  }

  const saltRounds = 12; // Increased from 10 for better security
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
};

/**
 * Validate password strength
 * Ensures password meets security requirements
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push(
      "Password must contain at least one special character (@$!%*?&)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Set HTTP-only refresh token cookie
 * Securely stores refresh token in browser cookie for automatic token refresh
 * @param {Object} res - Express response object
 * @param {string} refreshToken - JWT refresh token to store
 */
const setRefreshTokenCookie = (res, refreshToken) => {
  if (!res) {
    throw new Error("Response object is required for setting cookie");
  }

  if (!refreshToken || typeof refreshToken !== "string") {
    throw new Error("Valid refresh token is required");
  }

  const cookieOptions = {
    httpOnly: true, // Prevent XSS attacks
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict", // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: "/", // Available for entire domain
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);
};

// ======================
// Controllers
// ======================

// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, termsAccepted } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("All fields are required");
  }

  // Check if terms are accepted
  if (!termsAccepted || termsAccepted === "false") {
    throw createError("You must accept the Terms and Conditions to register",400);
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw createError("User already exists",400);
  }

  let avatar = "";
  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, "users");
      avatar = result.secure_url;
    } catch {
      throw createError("Failed to upload photo",500);
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
    throw createError("Email is required",400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw createError("Email is already verified",400);
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
    throw createError("User not found",404);
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
  console.log(instructor)
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
   throw createError("Invalid email or password", 401);

  }

  if (!user.isVerified) {
    // In development mode, auto-verify users for easier testing
    if (process.env.NODE_ENV === "development") {
      user.isVerified = true;
      user.isActive = true;
      await user.save();
    } else {
      throw createError("Please verify your email before logging in.",403);
    }
  }

  if (!user.isActive) {
    throw createError(
      "Your account has been deactivated. Please contact support.",403
    );
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
    throw createError("Invalid or expired refresh token",401);
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
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    throw createError("User not found",404);
  }
  res.status(200).json({
    success: true,
    message: "User profile retrieved successfully",
    data: createUserPayload(user),
  });
});

// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    throw createError("User not found",404);
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.bio = req.body.bio || user.bio;

  if (req.file) {
    try {
      const result = await uploadToCloudinary(req.file.buffer, "users");
      user.avatar = result.secure_url;
    } catch {
      res.status(500);
      throw createError("Failed to upload avatar",500);
    }
  } else if (req.body.avatar) {
    user.avatar = req.body.avatar;
  }

  if (req.body.password) {
    user.password = await hashPassword(req.body.password);
  }

  const updatedUser = await user.save();
  const accessToken = generateAccessToken(updatedUser);
  const refreshToken = generateRefreshToken(updatedUser);
  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { accessToken, user: createUserPayload(updatedUser) },
  });
});

// @route   PUT /api/auth/payment-details
// @access  Private
const updatePaymentDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw createError("User not found",404);
  }

  const {
    bankName,
    accountNumber,
    accountHolder,
    swift,
    iban,
    routingNumber,
    branchCode,
    preferredMethod,
  } = req.body;

  // Initialize paymentDetails if it doesn't exist
  if (!user.paymentDetails) {
    user.paymentDetails = {
      bankDetails: {},
      paymentPreferences: {},
      paymentSummary: {
        totalEarnings: 0,
        totalPayouts: 0,
        pendingAmount: 0,
        lastPayoutDate: null,
      },
      isVerified: false,
      verificationNotes: "",
    };
  }

  // Update bank details
  user.paymentDetails.bankDetails.bankName = bankName || "";
  user.paymentDetails.bankDetails.accountNumber = accountNumber || "";
  user.paymentDetails.bankDetails.accountHolder = accountHolder || "";
  user.paymentDetails.bankDetails.swift = swift || "";
  user.paymentDetails.bankDetails.iban = iban || "";
  user.paymentDetails.bankDetails.routingNumber = routingNumber || "";
  user.paymentDetails.bankDetails.branchCode = branchCode || "";

  // Update payment preferences
  if (!user.paymentDetails.paymentPreferences) {
    user.paymentDetails.paymentPreferences = {};
  }
  user.paymentDetails.paymentPreferences.preferredMethod =
    preferredMethod || "bank_transfer";

  // Mark the paymentDetails as modified for Mongoose
  user.markModified("paymentDetails");

  const savedUser = await user.save();

  res.status(200).json({
    success: true,
    message: "Payment details updated successfully",
    data: createUserPayload(savedUser),
  });
});

module.exports = {
  registerUser,
  resendVerificationEmail,
  verifyUserEmail,
  loginUser,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  updatePaymentDetails,
};
