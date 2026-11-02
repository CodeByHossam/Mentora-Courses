const logger = require('./logger');
const User = require("../models/User");
const {
  processCoursePurchase: processSpecializedCoursePurchase,
  getBillingSummary: getSpecializedBillingSummary,
} = require("./specializedBillingUtils");

// Always use specialized billing accounts
const USE_SPECIALIZED_BILLING = true;

/**
 * Main course purchase processing function
 * Uses specialized billing system
 */
const createBillingTransactionForCoursePayment = async (paymentData) => {
  try {
    logger.info("🆕 Using ONLY specialized billing system (legacy disabled)");
    return await processSpecializedCoursePurchase(paymentData);
  } catch (error) {
    logger.error(
      "❌ Error in specialized billing transaction creation:",
      error
    );
    throw error;
  }
};

/**
 * Get comprehensive billing summary for a user
 * Works with the specialized billing account models
 */
const getUserBillingSummary = async (userId) => {
  try {
    logger.info(`🔍 Getting billing summary for user: ${userId}`);
    logger.info(
      `🔍 UserId type: ${typeof userId}, value: ${JSON.stringify(userId)}`
    );

    if (!userId) {
      throw new Error("User ID is required but was null or undefined");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    logger.info(`User found: ${user.name} (${user.role})`);

    // Use specialized billing summary
    return await getSpecializedBillingSummary(userId);
  } catch (error) {
    logger.error("Error getting billing summary:", error);
    throw error;
  }
};

/**
 * Create middleware for handling credit payments (without course data)
 */
const createCreditPaymentMiddleware = () => {
  return async (req, res, next) => {
    try {
      // This middleware handles payments that are for adding credits only
      if (req.body.paymentType === "credit_addition") {
        // Remove course-related validations
        req.skipCourseValidation = true;

        // Set default values for missing course data
        req.body.courseId = null;
        req.body.instructorId = null;

        // Mark as credit payment
        req.isCreditPayment = true;
      }

      next();
    } catch (error) {
      logger.error("Credit payment middleware error:", error);
      next(error);
    }
  };
};

/**
 * Enhanced billing summary - now always uses specialized accounts
 */
const getEnhancedBillingSummary = async (userId) => {
  try {
    logger.info("🆕 Using specialized billing summary");
    return await getSpecializedBillingSummary(userId);
  } catch (error) {
    logger.error("❌ Error in billing summary:", error);
    throw error;
  }
};

// Specialized billing is now always enabled - these functions are kept for compatibility
const enableSpecializedBilling = () => {
  logger.info("✅ Specialized billing system is always enabled");
};

const disableSpecializedBilling = () => {
  logger.info(
    "⚠️ Cannot disable specialized billing - it is now the default system"
  );
};

module.exports = {
  createBillingTransactionForCoursePayment,
  getUserBillingSummary,
  createCreditPaymentMiddleware,
  getEnhancedBillingSummary,
  enableSpecializedBilling,
  disableSpecializedBilling
};
