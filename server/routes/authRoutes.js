/**
 * Authentication Routes
 * 
 * Handles all user authentication and profile management endpoints.
 * Includes both public routes (registration, login) and protected routes (profile management).
 * 
 * Security Features:
 * - Rate limiting on authentication endpoints
 * - Input validation and sanitization
 * - File upload handling for profile photos
 * - JWT token-based authentication
 * 
 * @author Mentora Team
 * @version 1.0.0
 */

const express = require("express");
const router = express.Router();

// Import middleware for file uploads
const upload = require("../middleware/upload");

// Import authentication controller functions
const {
  registerUser,      // Handle user registration
  resendVerificationEmail, // Resend verification email
  verifyUserEmail,   // Handle email verification
  loginUser,         // Handle user login
  refreshToken,      // Handle token refresh
  logout,            // Handle user logout
  getMe,            // Get current user profile
  updateProfile,     // Update user profile
  updatePaymentDetails, // Update payment details
} = require("../controllers/authController");

// Import authentication, validation and sanitization middleware
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");
const { sanitizeInput } = require("../middleware/securityMiddleware");
const userValidation = require("../validations/userValidation");

// Import specific rate limiters
const {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  generalReadLimiter,
  fileUploadLimiter
} = require("../middleware/advancedRateLimit");

/* ========================================================================
   PUBLIC ROUTES - No authentication required
   ======================================================================== */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 * @body    { name, email, password, role?, bio? }
 * @file    Optional profile photo upload
 * @returns { success, message, data: { accessToken, user } }
 * 
 * Features:
 * - Creates new user account
 * - Sends email verification
 * - Uploads profile photo to Cloudinary
 * - Returns JWT access token
 * - Sets refresh token in HTTP-only cookie
 */
router.post(
  "/register",
  registerLimiter,                     // Rate limit registration attempts
  upload.single("photo"),              // Handle profile photo upload
   sanitizeInput({ allowHtmlFields: [] }), // Sanitize all input fields
  validate(userValidation.register),   // Validate input data
  registerUser                         // Execute registration logic
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return tokens
 * @access  Public
 * @body    { email, password }
 * @returns { success, message, data: { accessToken, user } }
 * 
 * Features:
 * - Validates user credentials
 * - Checks email verification status
 * - Checks account active status
 * - Returns JWT access token
 * - Sets refresh token in HTTP-only cookie
 * - Rate limited to prevent brute force attacks
 */
router.post(
  "/login",
  loginLimiter,
   
  sanitizeInput({ allowHtmlFields: [] }),
  validate(userValidation.login),
  loginUser
);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 * @body    { email }
 * @returns { success, message }
 * 
 * Features:
 * - Resends verification email to unverified users
 * - Generates new verification token
 * - Rate limited to prevent spam
 */
router.post("/resend-verification", passwordResetLimiter, resendVerificationEmail);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh expired access token using refresh token
 * @access  Public
 * @cookies refreshToken (HTTP-only cookie)
 * @returns { success, message, data: { accessToken, user } }
 * 
 * Features:
 * - Validates refresh token from cookie
 * - Issues new access token
 * - Returns updated user data
 */
router.post("/refresh", refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear refresh token
 * @access  Public
 * @returns { success, message }
 * 
 * Features:
 * - Clears refresh token cookie
 * - Invalidates user session
 */
router.post("/logout", logout);

/**
 * @route   GET /api/auth/verify/:userId/:token
 * @desc    Verify user email address
 * @access  Public
 * @params  userId - User ID to verify
 * @params  token - Email verification token
 * @returns { success, message }
 * 
 * Features:
 * - Validates verification token
 * - Activates user account
 * - Marks email as verified
 */
router.get("/verify/:userId/:token", verifyUserEmail);

/* ========================================================================
   PROTECTED ROUTES - Authentication required
   ======================================================================== */

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile information
 * @access  Private (requires valid JWT token)
 * @headers Authorization: Bearer <token>
 * @returns { success, message, data: user }
 * 
 * Features:
 * - Returns current user profile
 * - Excludes sensitive information (password, tokens)
 */
router.get("/me", protect, generalReadLimiter, getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile information
 * @access  Private (requires valid JWT token)
 * @headers Authorization: Bearer <token>
 * @body    { name?, email?, bio?, currentPassword?, newPassword? }
 * @file    Optional new profile photo
 * @returns { success, message, data: { accessToken, user } }
 * 
 * Features:
 * - Updates user profile fields
 * - Handles profile photo upload/replacement
 * - Validates password changes
 * - Returns new access token with updated data
 * - Sets new refresh token in cookie
 */
router.put(
  "/profile",
  protect,                           // Require authentication
  fileUploadLimiter,                 // Rate limit file uploads
  upload.single("photo"),            // Handle photo upload
  
    sanitizeInput({ allowHtmlFields: ["bio"] }),
    validate(userValidation.update),   // Validate input data
  updateProfile                      // Execute update logic
);

/**
 * @route   PUT /api/auth/payment-details
 * @desc    Update user payment information
 * @access  Private (requires valid JWT token)
 * @headers Authorization: Bearer <token>
 * @body    { bankName?, accountNumber?, accountHolder?, swift?, iban?, routingNumber?, branchCode?, preferredMethod? }
 * @returns { success, message, data: user }
 * 
 * Features:
 * - Updates user payment details for instructors/admins
 * - Handles bank account information
 * - Sets payment preferences
 * - Returns updated user data
 */
router.put("/payment-details", protect, updatePaymentDetails);

module.exports = router;
