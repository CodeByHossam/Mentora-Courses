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

const createUserPayload = (user) => {
  if (!user) {
    throw createError(400, "User object is required for payload creation");
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


module.exports = {
  createUserPayload,
  generateAccessToken,
  generateRefreshToken,
  setSecureRefreshTokenCookie,
  hashPassword,
  validatePasswordStrength,
  setRefreshTokenCookie
};
