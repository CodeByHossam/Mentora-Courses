const logger = require("../utils/logger");
const asyncHandler = require("express-async-handler");

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
      logger.info("   ❌ NO USER - protect middleware failed");
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login first.",
        code: "NOT_AUTHENTICATED",
      });
    }

    // Validate that allowedRoles is an array
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      logger.error("   ❌ INVALID ROLE CONFIG:", allowedRoles);
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
      logger.info("   ❌ ROLE NOT ALLOWED");
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Required role(s): ${allowedRoles.join(
          ", ",
        )}. Your role: ${req.user.role}`,
        code: "INSUFFICIENT_PERMISSIONS",
      });
    }

    logger.info("   ✅ AUTHORIZATION PASSED");
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
  authorize,
  requireAdmin,
  instructor,
  student
};
