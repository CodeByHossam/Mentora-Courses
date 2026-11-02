const logger = require('./logger');
const AdminBillingAccount = require("../models/AdminBillingAccount");
const InstructorBillingAccount = require("../models/InstructorBillingAccount");
const StudentBillingAccount = require("../models/StudentBillingAccount");
const BillingTransaction = require("../models/BillingTransaction");
const User = require("../models/User");

/**
 * SPECIALIZED BILLING UTILITIES - ROLE-BASED ACCOUNT MANAGEMENT
 *
 * =============================================================================
 * SPECIALIZED BILLING SYSTEM OVERVIEW:
 * =============================================================================
 *
 * This utility manages three distinct billing account types, each optimized
 * for specific user roles and financial operations:
 *
 * 🔴 ADMIN BILLING ACCOUNTS:
 *   - Platform revenue tracking and profit calculations
 *   - Instructor payout management and scheduling
 *   - Student refund processing and accounting
 *   - Monthly/yearly financial reporting
 *   - Platform expense tracking
 *
 * 🟡 INSTRUCTOR BILLING ACCOUNTS:
 *   - Commission earnings from course sales
 *   - Payout request management and processing
 *   - Course sales history and analytics
 *   - Welcome bonus and credit management
 *   - Admin fee liability tracking (for direct transfers)
 *
 * 🔵 STUDENT BILLING ACCOUNTS:
 *   - Course purchase history and tracking
 *   - Credit balance and payment management
 *   - Admin fee calculations and payments
 *   - Refund request processing
 *   - Payment method preferences
 *
 * 🔄 AUTOMATED WORKFLOWS:
 *   - Account creation based on user role
 *   - Balance calculations and updates
 *   - Transaction recording and audit trails
 *   - Cross-account reconciliation
 *
 * 🔐 SECURITY & INTEGRITY:
 *   - Duplicate operation prevention
 *   - Atomic transaction processing
 *   - Balance validation and verification
 *   - Comprehensive error handling
 *
 * =============================================================================
 * USAGE: Call appropriate functions based on user role and operation type
 * =============================================================================
 */

checkAndUpdateAccountStatus = async (userId, userKey) => {
  try {
    const account = await AdminBillingAccount.findOne({ [userKey]: userId });
    if (!account) {
      await AdminBillingAccount.create({
        userKey: userId,
        status: "active",
      });
    }
  } catch (error) {
    logger.error("Error creating admin billing account:", error);
  }
};
// Track ongoing operations to prevent duplicates
const ongoingBillingOperations = new Set();

/**
 * GET OR CREATE BILLING ACCOUNT BY ROLE
 *
 * Automatically creates the appropriate specialized billing account
 * based on user role if it doesn't exist. Handles welcome credits
 * and initial account setup.
 *
 * @param {ObjectId} userId - User ID
 * @param {String} userRole - User role (admin/instructor/student)
 * @returns {Object} Specialized billing account
 *
 * ACCOUNT CREATION LOGIC:
 * - Admin: Platform management account with revenue tracking
 * - Instructor: Earnings account with welcome credits (100 paid, 100k free)
 * - Student: Payment account with credit management
 */

async function getBillingSummary(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const account = await getBillingAccountByRole(userId, user.role);
    const transactions = await BillingTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    let summary = {
      accountType: user.role,
      userId,
      transactions,
    };

    // Add role-specific data
    switch (user.role) {
      case "admin":
        summary = {
          ...summary,
          totalRevenue: account.totalRevenue,
          platformBalance: account.platformBalance,
          totalPayouts: account.totalInstructorPayouts,
          monthlyRevenue: account.monthlyRevenue.slice(-12), // Last 12 months
        };
        break;

      case "instructor":
        summary = {
          ...summary,
          availableBalance: account.availableBalance,
          totalEarnings: account.totalCommissionEarned,
          pendingPayouts: account.pendingPayouts,
          totalCoursesSold: account.statistics.totalCoursesSold,
          monthlyEarnings: account.statistics.monthlyEarnings,
        };
        break;

      case "student":
        summary = {
          ...summary,
          availableCredits: account.availableCredits,
          totalSpent: account.totalCoursePurchases,
          outstandingFees: account.outstandingAdminFees,
          currentBalance: account.currentBalance,
          totalCoursesEnrolled: account.statistics.totalCoursesEnrolled,
        };
        break;
    }

    return summary;
  } catch (error) {
    logger.error("❌ Error getting billing summary:", error);
    throw error;
  }
}

/**
 * RECONCILIATION UTILITY
 * Verifies financial accuracy across all accounts
 */

async function reconcileAllAccounts() {
  try {

    // Get all accounts
    const [studentAccounts, instructorAccounts, adminAccounts] =
      await Promise.all([
        require("../models/StudentBillingAccount").find({}),
        require("../models/InstructorBillingAccount").find({}),
        require("../models/AdminBillingAccount").find({}),
      ]);

    // Calculate totals
    const totalStudentPurchases = studentAccounts.reduce(
      (sum, acc) => sum + (acc.totalCoursePurchases || 0),
      0
    );
    const totalInstructorEarnings = instructorAccounts.reduce(
      (sum, acc) => sum + (acc.totalCommissionEarned || 0),
      0
    );
    const totalAdminRevenue = adminAccounts.reduce(
      (sum, acc) => sum + (acc.totalRevenue || 0),
      0
    );
    const totalInstructorPayouts = instructorAccounts.reduce(
      (sum, acc) => sum + (acc.totalPayoutsReceived || 0),
      0
    );

    // Reconciliation checks
    const reconciliation = {
      totalStudentPurchases,
      totalInstructorEarnings,
      totalAdminRevenue,
      totalInstructorPayouts,
      expectedAdminRevenue: totalStudentPurchases - totalInstructorEarnings,
      revenueMatch:
        Math.abs(
          totalAdminRevenue - (totalStudentPurchases - totalInstructorEarnings)
        ) < 0.01,
      platformBalance: totalAdminRevenue - totalInstructorPayouts,
    };

    return reconciliation;
  } catch (error) {
    logger.error("❌ Error in reconciliation:", error);
    throw error;
  }
}

module.exports = {
  getBillingSummary,
  reconcileAllAccounts
};
