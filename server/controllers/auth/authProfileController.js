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

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    throw createError(404, "User not found");
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
    throw createError(404, "User not found");
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
      throw createError(500, "Failed to upload avatar");
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
    throw createError(404, "User not found");
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
  getMe,
  updateProfile,
  updatePaymentDetails
};
