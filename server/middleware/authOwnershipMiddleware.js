const logger = require("../utils/logger");

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
    logger.error("Resource ownership verification error:", {
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
    logger.error("Ownership or admin verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during access verification.",
      code: "ACCESS_VERIFICATION_ERROR",
    });
  }
};

module.exports = {
  verifyResourceOwnership,
  requireOwnershipOrAdmin
};
