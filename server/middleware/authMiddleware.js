/**
 * Authentication Middleware
 *
 * Provides middleware functions for protecting routes and authorizing users
 * based on their roles and permissions.
 *
 * Features:
 * - JWT token validation and verification
 * - Role-based access control
 * - User identity verification
 * - Comprehensive error handling with detailed logging
 */

const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

/**
 * Protect routes by validating JWT tokens
 *
 * Middleware that extracts and validates JWT tokens from the Authorization header,
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const protect = asyncHandler(async (req, res, next) => {
  try {
    let token;

    // First, try to extract token from Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // If no token in header, check cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Also check for other common cookie names including refreshToken
    if (!token && req.cookies) {
      const cookieNames = [
        "authToken",
        "jwt",
        "accessToken",
        "refreshToken",
        "mentora_token",
      ];
      for (const cookieName of cookieNames) {
        if (req.cookies[cookieName]) {
          token = req.cookies[cookieName];
          console.log(`   🍪 Token found in cookie: ${cookieName}`);
          break;
        }
      }
    }

    // If still no token found
    if (!token) {
      console.log("   ❌ NO TOKEN FOUND - Returning 401");
      return res.status(401).json({
        success: false,
        message:
          "Access denied. No valid authorization token provided in header or cookies.",
        code: "NO_TOKEN",
      });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.log("   ❌ JWT verification failed:", jwtError.name);
      console.log("   ❌ JWT error message:", jwtError.message);

      const errorResponse = {
        success: false,
        code: jwtError.name,
      };

      switch (jwtError.name) {
        case "TokenExpiredError":
          errorResponse.message =
            "Access token has expired. Please refresh your token.";
          break;
        case "JsonWebTokenError":
          errorResponse.message = "Invalid access token. Please login again.";
          break;
        case "NotBeforeError":
          errorResponse.message = "Access token is not active yet.";
          break;
        default:
          errorResponse.message = "Token verification failed.";
      }

      return res.status(401).json(errorResponse);
    }

    // Validate decoded token structure
    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload. Missing user identifier.",
        code: "INVALID_PAYLOAD",
      });
    }

    // Fetch user from database and verify existence
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with this token no longer exists.",
        code: "USER_NOT_FOUND",
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account has been deactivated. Please contact support.",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // Attach authenticated user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });

    res.status(500).json({
      success: false,
      message: "Internal server error during authentication.",
      code: "AUTH_SERVER_ERROR",
    });
  }
});

/**
 * Role-based authorization middleware
 *
 * Creates middleware function that checks if the authenticated user has one of the required roles.
 * Must be used after the protect middleware to ensure req.user is available.
 *
 * @param {Array<string>} allowedRoles - Array of roles that are allowed to access the route
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/admin-only', protect, authorize(['admin']), controller);
 * router.get('/instructors-and-admins', protect, authorize(['instructor', 'admin']), controller);
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    // Ensure user is authenticated (should be set by protect middleware)
    if (!req.user) {
      console.log("   ❌ NO USER - protect middleware failed");
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
        code: "NOT_AUTHENTICATED",
      });
    }

    // Validate that allowedRoles is an array
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      console.error("   ❌ INVALID ROLE CONFIG:", allowedRoles);
      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
        code: "INVALID_ROLE_CONFIG",
      });
    }

    // Check if user's role is in the allowed roles
    const userRole = req.user.role?.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      role.toLowerCase(),
    );

    if (!normalizedAllowedRoles.includes(userRole)) {
      console.log("   ❌ ROLE NOT ALLOWED");
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Required role(s): ${allowedRoles.join(
          ", ",
        )}. Your role: ${req.user.role}`,
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    console.log("   ✅ AUTHORIZATION PASSED");
    next();
  };
};

/**
 * Admin-only authorization middleware
 *
 * Convenience middleware that restricts access to admin users only.
 * Equivalent to authorize(['admin']) but with more specific error messaging.
 */
const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required for admin access.",
      code: "NOT_AUTHENTICATED",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message:
        "Admin access required. This action is restricted to administrators only.",
      code: "ADMIN_REQUIRED",
    });
  }

  next();
});

/**
 * Resource ownership verification middleware
 *
 * Ensures that the authenticated user can only access their own resources.
 * Compares the user ID from the JWT token with the ID in request parameters.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyResourceOwnership = (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to verify resource ownership.",
        code: "NOT_AUTHENTICATED",
      });
    }

    // Extract user ID from authenticated user
    const authenticatedUserId = req.user._id.toString();

    // Extract target user ID from request parameters
    const targetUserId =
      req.params.id || req.params.userId || req.params.instructorId;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID parameter is required in the request.",
        code: "MISSING_USER_ID",
      });
    }

    // Compare user IDs
    if (authenticatedUserId !== targetUserId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own resources.",
        code: "RESOURCE_OWNERSHIP_VIOLATION",
      });
    }

    next();
  } catch (error) {
    console.error("Resource ownership verification error:", {
      error: error.message,
      userId: req.user?._id,
      targetId: req.params.id || req.params.userId || req.params.instructorId,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      success: false,
      message: "Internal server error during ownership verification.",
      code: "OWNERSHIP_VERIFICATION_ERROR",
    });
  }
};

/**
 * Flexible ownership or admin access middleware
 *
 * Allows access if the user is either the resource owner or an admin.
 * Useful for routes where admins should have override access.
 */
const requireOwnershipOrAdmin = (req, res, next) => {
  try {
    // Ensure user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
        code: "NOT_AUTHENTICATED",
      });
    }

    // Allow admin access regardless of ownership
    if (req.user.role === "admin") {
      return next();
    }

    // For non-admin users, verify ownership
    const authenticatedUserId = req.user._id.toString();
    const targetUserId =
      req.params.id || req.params.userId || req.params.instructorId;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "User ID parameter is required in the request.",
        code: "MISSING_USER_ID",
      });
    }

    if (authenticatedUserId !== targetUserId) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You can only access your own resources or you must be an admin.",
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    next();
  } catch (error) {
    console.error("Ownership or admin verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during access verification.",
      code: "ACCESS_VERIFICATION_ERROR",
    });
  }
};

// Instructor middleware
const instructor = (req, res, next) => {
  if (req.user && req.user.role === "instructor") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied. Instructor access required.");
  }
};

// Student middleware
const student = (req, res, next) => {
  if (req.user && req.user.role === "student") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied. Student access required.");
  }
};

module.exports = {
  protect,
  authorize,
  requireAdmin,
  verifyResourceOwnership,
  requireOwnershipOrAdmin,
  instructor,
  student,
  // Legacy exports for backward compatibility
  admin: requireAdmin,
  tokenMatchParams: verifyResourceOwnership,
};
