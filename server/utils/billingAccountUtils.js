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

async function getBillingAccountByRole(userId, userRole) {
  try {
    let account = null;

    switch (userRole) {
      case "admin":
        account = await AdminBillingAccount.findOne({ adminId: userId });
        if (!account) {
          account = await AdminBillingAccount.create({
            adminId: userId,
            status: "active",
          });
        }
        break;

      case "instructor":
        account = await InstructorBillingAccount.findOne({
          instructorId: userId,
        });
        if (!account) {
          // 🎁 WELCOME CREDITS: Determine based on instructor account type
          const user = await User.findById(userId);
          const welcomeCredits = user?.accountType === "free" ? 100000 : 100;


          account = await InstructorBillingAccount.create({
            instructorId: userId,
            welcomeCredits,
            availableBalance: welcomeCredits,
            status: "active",
          });
        }
        break;

      case "student":
        account = await StudentBillingAccount.findOne({ studentId: userId });
        if (!account) {
          account = await StudentBillingAccount.create({
            studentId: userId,
            availableCredits: 0,
            status: "active",
          });
        }
        break;

      default:
        logger.error(`❌ Invalid user role provided: ${userRole}`);
        throw new Error(
          `Invalid user role: ${userRole}. Must be admin, instructor, or student.`
        );
    }

    return account;
  } catch (error) {
    logger.error(`Error getting billing account for role ${userRole}:`, error);
    throw error;
  }
}

/**
 * PROCESS COURSE PURCHASE WITH SPECIALIZED BILLING
 *
 * Handles the complete billing workflow for course purchases,
 * creating appropriate transactions and updating all relevant
 * specialized billing accounts.
 *
 * @param {Object} params - Purchase parameters
 * @param {ObjectId} params.studentId - Student making purchase
 * @param {ObjectId} params.instructorId - Course instructor
 * @param {ObjectId} params.courseId - Course being purchased
 * @param {ObjectId} params.paymentId - Related payment record
 * @param {Number} params.finalAmount - Total payment amount
 * @param {Number} params.adminFee - Fixed admin fee
 * @param {Number} params.adminPercentage - Admin commission percentage
 * @param {String} params.paymentMethod - Payment method used
 * @returns {Object} Processing result with success status
 *
 * BILLING WORKFLOW:
 * 1. Create/update student billing account (course purchase)
 * 2. Create/update instructor billing account (commission)
 * 3. Create/update admin billing account (revenue)
 * 4. Record billing transactions for audit trail
 * 5. Handle payment method specific logic
 */

async function getOrCreateAdminAccount() {
  try {
    // Find any admin user
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      throw new Error("No admin user found");
    }

    let adminAccount = await AdminBillingAccount.findOne({
      adminId: adminUser._id,
    });
    if (!adminAccount) {
      adminAccount = await AdminBillingAccount.create({
        adminId: adminUser._id,
        status: "active",
      });
    }

    return adminAccount;
  } catch (error) {
    logger.error("❌ Error getting admin account:", error);
    throw error;
  }
}

/**
 * Get billing summary for any user type
 */

module.exports = {
  getBillingAccountByRole,
  getOrCreateAdminAccount,
  checkAndUpdateAccountStatus
};
