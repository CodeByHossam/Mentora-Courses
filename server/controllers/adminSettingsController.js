const logger = require('../utils/logger');
/**
 * Admin Settings Controller
 *
 * Handles admin configuration for payment settings, system settings, and notifications.
 *
 * @author Mentora Team
 * @version 1.0.0
 */

const AdminSettings = require("../models/AdminSettings");
const asyncHandler = require("express-async-handler");

// @desc    Get admin settings
// @route   GET /api/admin/settings
// @access  Private/Admin
const getAdminSettings = asyncHandler(async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();

    res.status(200).json({
      success: true,
      message: "Admin settings retrieved successfully",
      data: settings,
    });
  } catch (error) {
    logger.error("Error fetching admin settings:", error);
    res.status(500);
    throw new Error("Failed to retrieve admin settings");
  }
});

// @desc    Update admin settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
const updateAdminSettings = asyncHandler(async (req, res) => {
  const { paymentSettings, systemSettings, notificationSettings } = req.body;

  try {
    const updates = {};

    if (paymentSettings) {
      updates.paymentSettings = paymentSettings;
    }

    if (systemSettings) {
      updates.systemSettings = systemSettings;
    }

    if (notificationSettings) {
      updates.notificationSettings = notificationSettings;
    }

    const updatedSettings = await AdminSettings.updateSettings(
      updates,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Admin settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    logger.error("Error updating admin settings:", error);
    res.status(500);
    throw new Error("Failed to update admin settings");
  }
});

// @desc    Update payment settings only
// @route   PUT /api/admin/settings/payment
// @access  Private/Admin
const updatePaymentSettings = asyncHandler(async (req, res) => {
  const paymentSettings = req.body;

  try {
    // Validate payment settings
    if (
      paymentSettings.instructorAnnualFee !== undefined &&
      paymentSettings.instructorAnnualFee < 0
    ) {
      res.status(400);
      throw new Error("Instructor annual fee cannot be negative");
    }

    if (
      paymentSettings.studentAdminFee !== undefined &&
      paymentSettings.studentAdminFee < 0
    ) {
      res.status(400);
      throw new Error("Student admin fee cannot be negative");
    }

    if (paymentSettings.globalDeductionPercentage !== undefined) {
      if (
        paymentSettings.globalDeductionPercentage < 0 ||
        paymentSettings.globalDeductionPercentage > 100
      ) {
        res.status(400);
        throw new Error(
          "Global deduction percentage must be between 0 and 100"
        );
      }
    }

    if (
      paymentSettings.minimumPaymentAmount !== undefined &&
      paymentSettings.minimumPaymentAmount < 0
    ) {
      res.status(400);
      throw new Error("Minimum payment amount cannot be negative");
    }

    const updatedSettings = await AdminSettings.updateSettings(
      { paymentSettings },
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Payment settings updated successfully",
      data: updatedSettings.paymentSettings,
    });
  } catch (error) {
    logger.error("Error updating payment settings:", error);
    res.status(500);
    throw new Error("Failed to update payment settings");
  }
});

// @desc    Get payment statistics
// @route   GET /api/admin/settings/payment-stats
// @access  Private/Admin
const getPaymentStats = asyncHandler(async (req, res) => {
  try {
    const Payment = require("../models/Payment");

    // Get payment statistics - check for both "paid" and "completed" status
    const paidStatuses = ["paid", "completed"];
    const totalPayments = await Payment.countDocuments({
      status: { $in: paidStatuses },
    });

    const totalRevenue = await Payment.aggregate([
      { $match: { status: { $in: paidStatuses } } },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } },
    ]);

    const totalAdminFees = await Payment.aggregate([
      { $match: { status: { $in: paidStatuses } } },
      { $group: { _id: null, total: { $sum: "$adminFee" } } },
    ]);

    const totalInstructorPayments = await Payment.aggregate([
      { $match: { status: { $in: paidStatuses } } },
      { $group: { _id: null, total: { $sum: "$instructorAmount" } } },
    ]);

    // Get payment method breakdown
    const paymentMethodStats = await Payment.aggregate([
      { $match: { status: { $in: paidStatuses } } },
      {
        $group: {
          _id: "$method",
          count: { $sum: 1 },
          revenue: { $sum: "$finalAmount" },
        },
      },
    ]);

    // Get recent payments - include more statuses and better population
    const recentPayments = await Payment.find({
      status: { $in: paidStatuses },
    })
      .populate("userId", "name email role") // Include role field
      .populate("course", "title instructor")
      .populate({
        path: "course",
        populate: {
          path: "instructor",
          select: "name email",
        },
      })
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      message: "Payment statistics retrieved successfully",
      data: {
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalAdminFees: totalAdminFees[0]?.total || 0,
        totalInstructorPayments: totalInstructorPayments[0]?.total || 0,
        paymentMethodStats,
        recentPayments,
      },
    });
  } catch (error) {
    logger.error("Error fetching payment stats:", error);
    res.status(500);
    throw new Error("Failed to retrieve payment statistics");
  }
});

// @desc    Reset payment settings to defaults
// @route   POST /api/admin/settings/payment/reset
// @access  Private/Admin
const resetPaymentSettings = asyncHandler(async (req, res) => {
  try {
    const defaultPaymentSettings = {
      instructorAnnualFee: 0,
      studentAdminFee: 0,
      globalDeductionPercentage: 0,
      stripeEnabled: false,
      paypalEnabled: false,
      directTransferEnabled: true,
      enabledMethods: ['direct_transfer'],
      minimumPaymentAmount: 1,
      currency: "USD",
      requireAdminApprovalForDirectTransfer: true,
    };

    const updatedSettings = await AdminSettings.updateSettings(
      { paymentSettings: defaultPaymentSettings },
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Payment settings reset to defaults successfully",
      data: updatedSettings.paymentSettings,
    });
  } catch (error) {
    logger.error("Error resetting payment settings:", error);
    res.status(500);
    throw new Error("Failed to reset payment settings");
  }
});

// @desc    Test payment gateway connection
// @route   POST /api/admin/settings/test-gateway
// @access  Private/Admin
const testPaymentGateway = asyncHandler(async (req, res) => {
  const { gateway } = req.body;

  if (!gateway || !["stripe", "paypal"].includes(gateway)) {
    res.status(400);
    throw new Error("Valid gateway (stripe or paypal) is required");
  }

  try {
    let testResult = { connected: false, error: null };

    if (gateway === "stripe") {
      // Test Stripe connection
      if (!process.env.STRIPE_SECRET_KEY) {
        testResult.error = "Stripe secret key not configured";
      } else {
        try {
          const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
          await stripe.accounts.retrieve();
          testResult.connected = true;
        } catch (error) {
          testResult.error = error.message;
        }
      }
    } else if (gateway === "paypal") {
      // Test PayPal connection (placeholder)
      if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        testResult.error = "PayPal credentials not configured";
      } else {
        // PayPal connection test would go here
        testResult.connected = true;
      }
    }

    res.status(200).json({
      success: true,
      message: `${gateway} gateway test completed`,
      data: testResult,
    });
  } catch (error) {
    logger.error(`Error testing ${gateway} gateway:`, error);
    res.status(500);
    throw new Error(`Failed to test ${gateway} gateway connection`);
  }
});

module.exports = {
  getAdminSettings,
  updateAdminSettings,
  updatePaymentSettings,
  getPaymentStats,
  resetPaymentSettings,
  testPaymentGateway,
};
