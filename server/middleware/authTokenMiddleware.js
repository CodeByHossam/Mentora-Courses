const logger = require("../utils/logger");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
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
          logger.info(`   🍪 Token found in cookie: ${cookieName}`);
          break;
        }
      }
    }

    // If still no token found
    if (!token) {
      logger.info("   ❌ NO TOKEN FOUND - Returning 401");
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
      logger.info("   ❌ JWT verification failed:", jwtError.name);
      logger.info("   ❌ JWT error message:", jwtError.message);

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
    logger.error("Authentication middleware error:", {
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

module.exports = {
  protect
};
