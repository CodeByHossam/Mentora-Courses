// Billing sync for refund approvals. Split from billingSyncOperations.js; bodies unchanged.

const logger = require('./logger');
const BillingTransaction = require('../models/BillingTransaction');
const { getBillingAccountByRole } = require('./specializedBillingUtils');

/**
 * 🔄 REFUND SYNCHRONIZATION
 */

/**
 * Synchronize refund approval
 */

const syncRefundApproval = async (refundData) => {
  const {
    refundId,
    requesterId,
    requesterType,
    refundAmount,
    originalPaymentId,
    courseId,
    adminId
  } = refundData;

  logger.info('🔄 Starting refund approval synchronization:', {
    refundId,
    requesterId,
    requesterType,
    refundAmount
  });

  try {
    const requesterAccount = await getBillingAccountByRole(requesterId, requesterType);
    const adminAccount = await getBillingAccountByRole(adminId, 'admin');

    if (!requesterAccount) {
      throw new Error(`${requesterType} billing account not found`);
    }

    // Update requester account
    if (requesterType === 'student') {
      requesterAccount.availableCredits += refundAmount;
      requesterAccount.statistics.totalRefundsReceived = (requesterAccount.statistics.totalRefundsReceived || 0) + refundAmount;
    } else if (requesterType === 'instructor') {
      requesterAccount.availableBalance += refundAmount;
      if (refundData.refundType === 'admin_fee_overpayment') {
        requesterAccount.totalAdminFeesPaid = Math.max(0, (requesterAccount.totalAdminFeesPaid || 0) - refundAmount);
      }
    }

    requesterAccount.recalculateAll();
    await requesterAccount.save();

    // Create refund transaction
    const refundTransaction = new BillingTransaction({
      userId: requesterId,
      type: 'credit',
      amount: refundAmount,
      description: `Refund approved - ${refundData.refundType}`,
      category: 'refund',
      status: 'completed',
      balanceBefore: requesterType === 'student' ? 
        requesterAccount.currentBalance - refundAmount : 
        requesterAccount.availableBalance - refundAmount,
      balanceAfter: requesterType === 'student' ? 
        requesterAccount.currentBalance : 
        requesterAccount.availableBalance,
      relatedRefund: refundId,
      relatedPayment: originalPaymentId,
      relatedCourse: courseId,
      processedBy: adminId,
      processedAt: new Date(),
      metadata: {
        refundType: refundData.refundType,
        originalAmount: refundData.originalAmount
      }
    });

    await refundTransaction.save();

    // Update admin account
    if (adminAccount) {
      adminAccount.totalRefundsIssued = (adminAccount.totalRefundsIssued || 0) + refundAmount;
      adminAccount.recalculateAll();
      await adminAccount.save();
    }

    logger.info('✅ Refund approval synchronization completed:', {
      requesterBalance: requesterType === 'student' ? 
        requesterAccount.currentBalance : 
        requesterAccount.availableBalance,
      refundAmount
    });

    return {
      success: true,
      refundTransaction,
      requesterAccount,
      adminAccount
    };

  } catch (error) {
    logger.error('❌ Refund approval synchronization failed:', error);
    throw error;
  }
};

module.exports = {
  syncRefundApproval
};
