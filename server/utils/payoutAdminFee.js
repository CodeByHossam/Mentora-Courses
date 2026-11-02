const logger = require('./logger');
const BillingTransaction = require('../models/BillingTransaction');
const { getBillingAccountByRole } = require('./specializedBillingUtils');

const processAdminFeePayment = async (instructorId, amount, description = 'Admin fee payment') => {
  try {
    // Get instructor billing account
    const instructorAccount = await getBillingAccountByRole(instructorId, 'instructor');
    
    if (!instructorAccount) {
      throw new Error('Instructor billing account not found');
    }

    if (instructorAccount.outstanding < amount) {
      throw new Error('Payment amount exceeds outstanding fees');
    }

    // Create payment transaction
    const paymentTransaction = await BillingTransaction.create({
      userId: instructorId,
      type: 'debit',
      amount: amount,
      description: description,
      category: 'admin_fee_payment',
      status: 'completed',
      balanceBefore: instructorAccount.outstanding,
      balanceAfter: instructorAccount.outstanding - amount,
      from: instructorId,
      to: null, // Admin
      processedAt: new Date(),
      notes: 'Admin fee payment processed',
      metadata: {
        paymentType: 'admin_fee_settlement',
        previousOutstanding: instructorAccount.outstanding
      }
    });

    // Update instructor billing account
    instructorAccount.outstanding -= amount;
    instructorAccount.totalFeesPaid += amount;

    // Reactivate account if fees are cleared
    if (instructorAccount.outstanding <= 0) {
      instructorAccount.status = 'active';
      instructorAccount.outstanding = 0; // Ensure no negative balance
      instructorAccount.notes = 'Account in good standing';
    }

    await instructorAccount.save();

    return {
      success: true,
      message: 'Admin fee payment processed successfully',
      data: {
        paymentTransaction,
        instructorAccount,
        remainingOutstanding: instructorAccount.outstanding
      }
    };

  } catch (error) {
    logger.error('Error processing admin fee payment:', error);
    throw error;
  }
};

/**
 * Check if instructor account should be deactivated
 * @param {string} instructorId - Instructor ID
 * @returns {Object} Account status check result
 */
const checkAccountStatus = async (instructorId) => {
  try {
    const instructorAccount = await getBillingAccountByRole(instructorId, 'instructor');
    
    if (!instructorAccount) {
      return { shouldDeactivate: false, reason: 'No billing account found' };
    }

    const outstandingLimit = 500; // Configurable limit
    const daysSinceLastPayment = 30; // Configurable period

    if (instructorAccount.outstanding > outstandingLimit) {
      const lastPayment = await BillingTransaction.findOne({
        userId: instructorId,
        category: 'admin_fee_payment',
        status: 'completed'
      }).sort({ processedAt: -1 });

      const daysSince = lastPayment 
        ? Math.floor((Date.now() - lastPayment.processedAt.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;

      if (daysSince > daysSinceLastPayment) {
        return {
          shouldDeactivate: true,
          reason: `Outstanding fees exceed $${outstandingLimit} for over ${daysSinceLastPayment} days`,
          outstandingAmount: instructorAccount.outstanding,
          daysSinceLastPayment: daysSince
        };
      }
    }

    return {
      shouldDeactivate: false,
      reason: 'Account in good standing',
      outstandingAmount: instructorAccount.outstanding
    };

  } catch (error) {
    logger.error('Error checking account status:', error);
    throw error;
  }
};


module.exports = {
  processAdminFeePayment,
  checkAccountStatus
};
