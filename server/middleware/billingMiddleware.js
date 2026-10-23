const AdminBillingAccount = require("../models/AdminBillingAccount");
const InstructorBillingAccount = require("../models/InstructorBillingAccount");
const StudentBillingAccount = require("../models/StudentBillingAccount");
const User = require("../models/User");
const AdminSettings = require("../models/AdminSettings");
const { getBillingAccountByRole } = require("../utils/specializedBillingUtils");

/**
 * Middleware to check billing account status
 * Prevents access to certain features if account is deactivated due to billing issues
 */
const checkBillingStatus = async (req, res, next) => {
  try {
    // Skip billing check for admin users
    if (req.user && req.user.role === "admin") {
      return next();
    }

    // Skip billing check for certain routes
    const exemptRoutes = [
      "/api/billing",
      "/api/auth/logout",
      "/api/users/profile",
      "/help",
      "/api/payments", // Allow access to payment routes
    ];

    const isExemptRoute = exemptRoutes.some((route) =>
      req.path.startsWith(route)
    );
    if (isExemptRoute) {
      return next();
    }

    if (req.user) {
      const user = await User.findById(req.user.id);

      // 🆕 USE NEW SPECIALIZED BILLING SYSTEM
      const billingAccount = await getBillingAccountByRole(
        req.user.id,
        user.role
      );

      if (!billingAccount) {
        // Account will be created automatically on first billing operation
        return next();
      }

      // Check if account is deactivated due to billing issues
      if (
        billingAccount.status === "suspended" ||
        billingAccount.status === "deactivated"
      ) {
        // Get balance based on account type
        let balance = 0;
        if (user.role === "student") {
          balance = billingAccount.currentBalance || 0;
        } else if (user.role === "instructor") {
          balance = billingAccount.availableBalance || 0;
        }

        return res.status(403).json({
          success: false,
          message: "Account suspended due to billing issues",
          code: "BILLING_SUSPENDED",
          data: {
            deactivationReason: billingAccount.deactivationReason || "Outstanding balance",
            balance,
            billingUrl: "/billing",
          },
        });
      }

      // Get admin settings for credit limit
      const adminSettings = await AdminSettings.getSettings();
      const creditLimit =
        adminSettings.paymentSettings.creditLimits[req.user.role] || -200;

      // Get balance based on account type
      let balance = 0;
      if (user.role === "student") {
        balance = billingAccount.currentBalance || 0;
      } else if (user.role === "instructor") {
        balance = billingAccount.availableBalance || 0;
      }

      // Check if account is over credit limit (warning, but allow access)
      if (balance < creditLimit * 0.8) {
        // Warning at 80% of credit limit
        res.locals.billingWarning = {
          balance,
          creditLimit,
          warningLevel: balance < creditLimit ? "critical" : "warning",
        };
      }
    }

    next();
  } catch (error) {
    console.error("Billing middleware error:", error);
    next(); // Continue on error to avoid breaking the app
  }
};

/**
 * Middleware to add billing warning to response
 */
const addBillingWarning = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (res.locals.billingWarning) {
      if (typeof data === "object" && data !== null) {
        data.billingWarning = res.locals.billingWarning;
      }
    }
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Middleware to check if user can access premium features
 */
const checkPremiumAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Admin always has access
    if (req.user.role === "admin") {
      return next();
    }

    // Get user to determine role
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const billingAccount = await getBillingAccountByRole(
      req.user.id,
      user.role
    );

    if (!billingAccount || billingAccount.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Premium access requires active billing account",
        code: "PREMIUM_ACCESS_DENIED",
        data: {
          billingUrl: "/billing",
        },
      });
    }

    // Check if account has sufficient balance for premium features based on account type
    let balance = 0;
    if (user.role === "student") {
      balance = billingAccount.currentBalance || 0;
    } else if (user.role === "instructor") {
      balance = billingAccount.availableBalance || 0;
    } else if (user.role === "admin") {
      balance = billingAccount.platformBalance || 0;
    }

    if (balance < -50) {
      // Premium features require better standing
      return res.status(403).json({
        success: false,
        message: "Premium access temporarily restricted due to account balance",
        code: "INSUFFICIENT_BALANCE",
        data: {
          currentBalance: balance,
          requiredBalance: -50,
          billingUrl: "/billing",
        },
      });
    }

    next();
  } catch (error) {
    console.error("Premium access check error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking premium access",
    });
  }
};

/**
 * Middleware to log billing-related activities
 */
const logBillingActivity = (activityType) => {
  return (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
      // Log successful billing activities
      if (data && data.success && req.user) {
        console.log(`Billing Activity: ${activityType}`, {
          userId: req.user.id,
          userRole: req.user.role,
          timestamp: new Date().toISOString(),
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }

      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware to validate billing payment data
 */
const validatePaymentData = (req, res, next) => {
  const { amount, paymentMethod, paymentDetails } = req.body;

  // Validate amount
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment amount",
    });
  }

  if (amount > 10000) {
    // Max payment limit
    return res.status(400).json({
      success: false,
      message: "Payment amount exceeds maximum limit ($10,000)",
    });
  }

  // Validate payment method
  const validMethods = ["card", "paypal", "stripe"];
  if (!paymentMethod || !validMethods.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment method",
    });
  }

  // Validate payment details based on method
  if (paymentMethod === "card" || paymentMethod === "stripe") {
    if (!paymentDetails || !paymentDetails.paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: "Payment method ID required for card payments",
      });
    }
  }

  next();
};

module.exports = {
  checkBillingStatus,
  addBillingWarning,
  checkPremiumAccess,
  logBillingActivity,
  validatePaymentData,
};
