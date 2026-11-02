const logger = require('../../utils/logger');
const AdminBillingAccount = require("../../models/AdminBillingAccount");
const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
const StudentBillingAccount = require("../../models/StudentBillingAccount");
const BillingTransaction = require("../../models/BillingTransaction");
const Payment = require("../../models/Payment");
const {
  getBillingAccountByRole,
} = require("../../utils/specializedBillingUtils");
const { uploadFile, getFile, deleteFile } = require("../../utils/aws");
const { sanitizeHtml, sanitizeText, sanitizeObjectId, sanitizeNumber } = require("../../utils/sanitizer");

/**
 * GET BILLING ACCOUNT BY USER ROLE
 *
 * Retrieves or creates the appropriate specialized billing account
 * based on the authenticated user's role. Handles automatic account
 * creation with proper welcome credits and initial setup.
 *
 * @route   GET /api/billing/account
 * @access  Private (Student/Instructor/Admin)
 * @returns {Object} Specialized billing account with balance info
 *
 * ACCOUNT TYPES:
 * - Admin: Platform revenue and payout management
 * - Instructor: Commission earnings and payout requests
 * - Student: Course purchases and credit management
 */
const getBillingAccount = async (req, res) => {
  try {
    const userId = sanitizeObjectId(req.user.id);
    const userRole = sanitizeText(req.user.role);

    // 🏦 GET OR CREATE SPECIALIZED ACCOUNT
    const account = await getBillingAccountByRole(userId, userRole);

    if (!account) {
      logger.error(
        `❌ Failed to create billing account for ${userRole}: ${userId}`
      );
      return res.status(500).json({
        success: false,
        message: `Failed to create ${userRole} billing account`,
        error: "Account creation failed",
      });
    }

    // 📊 GET RECENT TRANSACTIONS
    const recentTransactions = await BillingTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("relatedPayment", "finalAmount method status")
      .populate("relatedCourse", "title");

    // 🧮 CALCULATE ACCOUNT SUMMARY
    const accountSummary = {
      accountType: userRole,
      accountId: account._id,
      status: account.status,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
    // Add role-specific fields
    switch (userRole) {
      case "admin":
        accountSummary.platformBalance = account.platformBalance;
        accountSummary.totalRevenue = account.totalRevenue;
        accountSummary.totalInstructorPayouts = account.totalInstructorPayouts || 0;
        accountSummary.monthlyRevenue = account.monthlyRevenue?.slice(-6) || [];
        accountSummary.statistics = account.statistics || {
          totalTransactions: 0,
          averageTransactionAmount: 0,
          totalCoursesSold: 0,
          totalActiveInstructors: 0
        };
        break;

      case "instructor":
        accountSummary.availableBalance = account.availableBalance || account.calculateAvailableBalance();
        accountSummary.totalCommissionEarned = account.totalCommissionEarned;
        accountSummary.pendingCommissions = account.pendingCommissions;
        accountSummary.totalPayoutsReceived = account.totalPayoutsReceived;
        // welcomeCredits removed - simplified system
        accountSummary.courseSales = account.courseSales?.length || 0;
        accountSummary.totalGiftAmount = account.getTotalGiftAmount
          ? account.getTotalGiftAmount()
          : 0;
        accountSummary.annualFees = account.annualFees || 0;
        break;

      case "student":
        // Students: Only track purchases and annual fees (no balance)
        accountSummary.totalCoursePurchases = account.totalCoursePurchases;
        accountSummary.annualFees = account.annualFees;
        accountSummary.coursePurchases = account.coursePurchases || []; // Return full array
        accountSummary.giftCards = account.giftCards || []; // Return full array (frontend filters)
        break;
    }

    const responseData = {
      success: true,
      message: `${userRole} billing account retrieved successfully`,
      data: {
        account: accountSummary,
        recentTransactions,
        transactionCount: recentTransactions.length,
      },
    };
    // Send response and close getBillingAccount
    res.status(200).json(responseData);
  } catch (error) {
    logger.error("❌ Error getting billing account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve billing account",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Get Admin billing account and earnings (Admin only)
 * @route GET /api/specialized-billing/admin/account
 */
const getAdminBillingAccount = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin role required." });
    }

    const adminAccount = await getOrCreateAdminAccount();

    const recentTransactions = await BillingTransaction.find({ userId: adminAccount.adminId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const totalEarnings = recentTransactions
      .filter(t => t.type === 'credit')
      .reduce((s, t) => s + (t.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        adminAccount: {
          platformBalance: adminAccount.platformBalance,
          totalRevenue: adminAccount.totalRevenue,
          // pendingPayouts removed - check instructor's pendingCommissions instead
          statistics: adminAccount.statistics,
          monthlyRevenue: adminAccount.monthlyRevenue?.slice(-12) || [],
        },
        earnings: {
          totalEarnings,
          transactionCount: recentTransactions.length,
        },
        recentTransactions,
        summary: {
          netProfit: adminAccount.totalRevenue - (adminAccount.totalInstructorPayouts || 0),
          lastRevenueUpdate: adminAccount.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error('❌ getAdminBillingAccount error:', error);
    res.status(500).json({ success: false, message: 'Failed to get admin billing account' });
  }
};


module.exports = {
  getBillingAccount,
  getAdminBillingAccount
};
