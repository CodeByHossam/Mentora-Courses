const logger = require('./logger');
// utils/billingSync.js
/**
 * Billing Synchronization Utilities
 * 
 * Ensures strict accounting synchronization between:
 * - Course purchases and instructor commissions
 * - Payout requests and balance updates
 * - Refund approvals and account adjustments
 * - Admin fee payments and outstanding balance reductions
 * 
 * All operations maintain double-entry bookkeeping principles
 */

const StudentBillingAccount = require('../models/StudentBillingAccount');
const InstructorBillingAccount = require('../models/InstructorBillingAccount');
const AdminBillingAccount = require('../models/AdminBillingAccount');
const BillingTransaction = require('../models/BillingTransaction');
const Payment = require('../models/Payment');
const { getBillingAccountByRole } = require('./specializedBillingUtils');

/**
 * 💰 COURSE PURCHASE SYNCHRONIZATION
 */

/**
 * Synchronize course purchase across all billing accounts
 */

const validateAccountIntegrity = async (userId, userRole) => {
  try {
    const account = await getBillingAccountByRole(userId, userRole);
    if (!account) return { valid: false, error: 'Account not found' };

    // Recalculate balance using model method
    const calculatedBalance = userRole === 'student' ? 
      account.calculateCurrentBalance() : 
      account.calculateAvailableBalance();

    // Compare with stored balance
    const storedBalance = userRole === 'student' ? 
      account.currentBalance : 
      account.availableBalance;

    const balanceMatch = Math.abs(calculatedBalance - storedBalance) < 0.01; // Allow for rounding

    return {
      valid: balanceMatch,
      calculatedBalance,
      storedBalance,
      difference: calculatedBalance - storedBalance,
      account
    };

  } catch (error) {
    return { valid: false, error: error.message };
  }
};

module.exports = {
  validateAccountIntegrity
};
