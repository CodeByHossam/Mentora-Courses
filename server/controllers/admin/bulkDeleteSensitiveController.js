const logger = require('../../utils/logger');
/**
 * Admin Bulk Deletion Controller
 *
 * Provides secure bulk deletion functionality for administrators
 * with proper validation, financial data protection, and audit trails.
 *
 * Features:
 * - Model-specific bulk deletion
 * - Financial data protection via PERMANENT BOXES
 * - Relationship validation
 * - Comprehensive logging
 *
 * 📦 PERMANENT BOXES - PROTECTED FINANCIAL DATA
 * ============================================
 * These fields are NEVER deleted (except when user is deleted):
 *
 * InstructorBillingAccount:
 *   - totalCommissionEarned (history - never decreases)
 *   - pendingCommissions (current unpaid)
 *   - totalPayoutsReceived (paid by admin)
 *   - totalGiftAmount (gift cards)
 *   - annualFees (subscription)
 *
 * StudentBillingAccount:
 *   - totalCoursePurchases (total spent history)
 *   - annualFees (subscription)
 *
 * AdminBillingAccount:
 *   - totalRevenue (sum of admin fees)
 *   - platformBalance (revenue - payouts)
 *   - totalInstructorPayouts (total paid)
 *   - totalStudentRefunds (total refunded)
 *
 * ⚠️ SAFE TO DELETE (Permanent boxes remain intact):
 *   - Payment records
 *   - BillingTransaction records
 *   - AdminFeePayment records
 *   - GiftCard records
 *   - RefundRequest records
 *
 * ❌ NEVER DELETE (Would lose money):
 *   - InstructorBillingAccount
 *   - StudentBillingAccount
 *   - AdminBillingAccount
 */

const asyncHandler = require("express-async-handler");

// Models
const User = require("../../models/User");
const Course = require("../../models/Course");
const Category = require("../../models/Category");
const Lesson = require("../../models/lessonModel");
const Comment = require("../../models/Comment");
const Test = require("../../models/Test");
const Grade = require("../../models/Grade");
const Certificate = require("../../models/Certificate");
const LiveSession = require("../../models/LiveSession");
const Message = require("../../models/Message");
const Notification = require("../../models/Notification");
const Attachment = require("../../models/Attachment");
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const InstructorRequest = require("../../models/InstructorRequestModel");
// PayoutRequest removed - using direct payout system now
const RefundRequest = require("../../models/RefundRequest");
const AdminFeePayment = require("../../models/AdminFeePayment");
const GiftCard = require("../../models/GiftCard");

// Sensitive financial models
const Payment = require("../../models/Payment");
const BillingTransaction = require("../../models/BillingTransaction");
// Protected account models (must NOT be deleted to preserve balances)
const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
const StudentBillingAccount = require("../../models/StudentBillingAccount");
const AdminBillingAccount = require("../../models/AdminBillingAccount");

/**
 * 📊 GET DELETION STATISTICS
 * Shows counts for each model to help admin understand impact
 */

const bulkDeletePayments = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    if (!confirmPassword || confirmPassword !== "DELETE_ALL_PAYMENTS_HISTORY") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_PAYMENTS_HISTORY" to confirm.',
      });
    }

    const deletedCount = await Payment.countDocuments();
    await Payment.deleteMany({});

    logger.info(`🗑️ Admin ${req.user.name} deleted ${deletedCount} payment records`);
    logger.info(`📦 PERMANENT BOXES PROTECTED: All balances remain intact`);
    
    res.json({
      success: true,
      message: `Deleted ${deletedCount} payment records. All user balances and pending commissions remain intact.`,
      deletedCount,
      protectedData: {
        instructorBalances: "✅ Protected",
        studentBalances: "✅ Protected",
        pendingCommissions: "✅ Protected",
        annualFees: "✅ Protected",
      }
    });
  } catch (error) {
    logger.error("❌ Error bulk deleting payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete payments",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE BILLING TRANSACTIONS (Sensitive)
 */

const bulkDeleteBillingTransactions = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    if (
      !confirmPassword ||
      confirmPassword !== "DELETE_ALL_BILLING_TRANSACTIONS"
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_BILLING_TRANSACTIONS" to confirm.',
      });
    }

    const deletedCount = await BillingTransaction.countDocuments();
    await BillingTransaction.deleteMany({});

    logger.info(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} billing transactions`
    );
    res.json({
      success: true,
      message: `Deleted ${deletedCount} billing transactions`,
      deletedCount,
    });
  } catch (error) {
    logger.error("❌ Error bulk deleting billing transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete billing transactions",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE GIFT CARDS (Sensitive)
 */

const bulkDeleteGiftCards = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    if (!confirmPassword || confirmPassword !== "DELETE_ALL_GIFT_CARDS") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_GIFT_CARDS" to confirm.',
      });
    }

    const deletedCount = await GiftCard.countDocuments();
    await GiftCard.deleteMany({});

    logger.info(`🗑️ Admin ${req.user.name} deleted ${deletedCount} gift cards`);
    res.json({
      success: true,
      message: `Deleted ${deletedCount} gift cards`,
      deletedCount,
    });
  } catch (error) {
    logger.error("❌ Error bulk deleting gift cards:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gift cards",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE ADMIN FEE PAYMENTS (Sensitive)
 */

const bulkDeleteAdminFeePayments = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    if (
      !confirmPassword ||
      confirmPassword !== "DELETE_ALL_ADMIN_FEE_PAYMENTS"
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_ADMIN_FEE_PAYMENTS" to confirm.',
      });
    }

    const deletedCount = await AdminFeePayment.countDocuments();
    await AdminFeePayment.deleteMany({});

    logger.info(
      `🗑️ Admin ${req.user.name} deleted ${deletedCount} admin fee payments`
    );
    res.json({
      success: true,
      message: `Deleted ${deletedCount} admin fee payments`,
      deletedCount,
    });
  } catch (error) {
    logger.error("❌ Error bulk deleting admin fee payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete admin fee payments",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE Comment
 * Safely deletes all Comment from all courses
 */

module.exports = {
  bulkDeletePayments,
  bulkDeleteBillingTransactions,
  bulkDeleteGiftCards,
  bulkDeleteAdminFeePayments
};
