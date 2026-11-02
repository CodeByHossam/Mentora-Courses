// Billing sync for payout approvals. Split from billingSyncOperations.js; bodies unchanged.

const logger = require('./logger');
const BillingTransaction = require('../models/BillingTransaction');
const { getBillingAccountByRole } = require('./specializedBillingUtils');

/**
 * 💸 PAYOUT REQUEST SYNCHRONIZATION
 */

/**
 * Synchronize payout request approval
 */

const syncPayoutApproval = async (payoutData) => {
  const {
    instructorId,
    payoutAmount,
    payoutRequestId,
    adminId
  } = payoutData;

  logger.info('🔄 Starting payout approval synchronization:', {
    instructorId,
    payoutAmount,
    payoutRequestId
  });

  try {
    const instructorAccount = await getBillingAccountByRole(instructorId, 'instructor');
    const adminAccount = await getBillingAccountByRole(adminId, 'admin');

    if (!instructorAccount) {
      throw new Error('Instructor billing account not found');
    }

    // Update instructor account
    instructorAccount.pendingPayouts -= payoutAmount;
    instructorAccount.totalPayoutsReceived += payoutAmount;
    instructorAccount.recalculateAll();
    await instructorAccount.save();

    // Create instructor transaction
    const instructorTransaction = new BillingTransaction({
      userId: instructorId,
      type: 'debit',
      amount: payoutAmount,
      description: `Payout processed - Request ${payoutRequestId}`,
      category: 'payout',
      status: 'completed',
      balanceBefore: instructorAccount.availableBalance + payoutAmount,
      balanceAfter: instructorAccount.availableBalance,
      // relatedPayoutRequest removed - using direct payout system now
      processedBy: adminId,
      processedAt: new Date()
    });

    await instructorTransaction.save();

    // Update admin account
    if (adminAccount) {
      adminAccount.totalInstructorPayouts = (adminAccount.totalInstructorPayouts || 0) + payoutAmount;
      adminAccount.recalculateAll();
      await adminAccount.save();
    }

    logger.info('✅ Payout approval synchronization completed:', {
      instructorBalance: instructorAccount.availableBalance,
      totalPayoutsReceived: instructorAccount.totalPayoutsReceived
    });

    return {
      success: true,
      instructorTransaction,
      instructorAccount,
      adminAccount
    };

  } catch (error) {
    logger.error('❌ Payout approval synchronization failed:', error);
    throw error;
  }
};

module.exports = {
  syncPayoutApproval
};
