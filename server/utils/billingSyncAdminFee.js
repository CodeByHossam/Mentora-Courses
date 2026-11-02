// Billing sync for admin fee payment approvals. Split from billingSyncOperations.js; bodies unchanged.

const logger = require('./logger');
const BillingTransaction = require('../models/BillingTransaction');
const { getBillingAccountByRole } = require('./specializedBillingUtils');

/**
 * 💳 ADMIN FEE PAYMENT SYNCHRONIZATION
 */

/**
 * Synchronize admin fee payment approval
 */

const syncAdminFeePaymentApproval = async (paymentData) => {
  const {
    instructorId,
    paymentAmount,
    adminFeePaymentId,
    adminId
  } = paymentData;

  logger.info('🔄 Starting admin fee payment synchronization:', {
    instructorId,
    paymentAmount,
    adminFeePaymentId
  });

  try {
    const instructorAccount = await getBillingAccountByRole(instructorId, 'instructor');
    const adminAccount = await getBillingAccountByRole(adminId, 'admin');

    if (!instructorAccount) {
      throw new Error('Instructor billing account not found');
    }

    // Calculate actual payment allocation
    const currentOwedFees = instructorAccount.owedAdminFees || 0;
    const allocatedAmount = Math.min(paymentAmount, currentOwedFees);
    const excessAmount = Math.max(0, paymentAmount - currentOwedFees);

    // Process admin fee payment
    const actualPayment = instructorAccount.processAdminFeePayment(
      allocatedAmount,
      `Admin fee payment - ${adminFeePaymentId}`
    );

    await instructorAccount.save();

    // Create billing transaction for the fee payment
    const feePaymentTransaction = new BillingTransaction({
      userId: instructorId,
      type: 'debit',
      amount: actualPayment,
      description: `Admin fee payment processed`,
      category: 'admin_fee_payment',
      status: 'completed',
      balanceBefore: instructorAccount.availableBalance + actualPayment,
      balanceAfter: instructorAccount.availableBalance,
      relatedAdminFeePayment: adminFeePaymentId,
      processedBy: adminId,
      processedAt: new Date(),
      metadata: {
        originalPaymentAmount: paymentAmount,
        allocatedToFees: actualPayment,
        excessAmount
      }
    });

    await feePaymentTransaction.save();

    // Handle excess amount if any
    let excessTransaction = null;
    if (excessAmount > 0) {
      instructorAccount.availableBalance += excessAmount;
      instructorAccount.adminCreditsAdded = (instructorAccount.adminCreditsAdded || 0) + excessAmount;
      instructorAccount.recalculateAll();
      await instructorAccount.save();

      excessTransaction = new BillingTransaction({
        userId: instructorId,
        type: 'credit',
        amount: excessAmount,
        description: `Excess admin fee payment credited back`,
        category: 'admin_credit',
        status: 'completed',
        balanceBefore: instructorAccount.availableBalance - excessAmount,
        balanceAfter: instructorAccount.availableBalance,
        relatedAdminFeePayment: adminFeePaymentId,
        processedBy: adminId,
        processedAt: new Date(),
        metadata: {
          excessFromPayment: paymentAmount,
          allocatedToFees: actualPayment
        }
      });

      await excessTransaction.save();
    }

    // Update admin account
    if (adminAccount) {
      adminAccount.totalAdminFeesCollected = (adminAccount.totalAdminFeesCollected || 0) + actualPayment;
      adminAccount.recalculateAll();
      await adminAccount.save();
    }

    logger.info('✅ Admin fee payment synchronization completed:', {
      allocatedAmount: actualPayment,
      excessAmount,
      newOwedFees: instructorAccount.owedAdminFees,
      newAvailableBalance: instructorAccount.availableBalance
    });

    return {
      success: true,
      feePaymentTransaction,
      excessTransaction,
      instructorAccount,
      adminAccount,
      allocation: {
        allocatedAmount: actualPayment,
        excessAmount,
        newOwedFees: instructorAccount.owedAdminFees,
        newAvailableBalance: instructorAccount.availableBalance
      }
    };

  } catch (error) {
    logger.error('❌ Admin fee payment synchronization failed:', error);
    throw error;
  }
};

module.exports = {
  syncAdminFeePaymentApproval
};
