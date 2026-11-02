const logger = require('./logger');
const BillingTransaction = require('../models/BillingTransaction');
const { getBillingAccountByRole } = require('./specializedBillingUtils');

const processDirectTransferPayment = async (payment, instructor) => {
  try {
    const fees = calculateAdminFees(
      payment.finalAmount || payment.amount,
      payment.adminPercentage || 10,
      payment.adminFeeFixed || 0
    );

    // Get instructor billing account
    const instructorAccount = await getBillingAccountByRole(instructor._id, 'instructor');
    
    if (!instructorAccount) {
      throw new Error('Instructor billing account not found');
    }

    // Credit instructor with full amount
    const creditTransaction = await BillingTransaction.create({
      userId: instructor._id,
      type: 'credit',
      amount: fees.originalAmount,
      description: `Direct transfer payment received - Course: ${payment.course?.title || 'Unknown'}`,
      category: 'course_payment',
      status: 'completed',
      balanceBefore: instructorAccount.availableBalance,
      balanceAfter: instructorAccount.availableBalance + fees.originalAmount,
      relatedPayment: payment._id,
      from: payment.userId,
      to: instructor._id,
      processedAt: new Date(),
      notes: 'Full amount credited for direct transfer',
      metadata: {
        paymentMethod: 'direct_transfer',
        adminFeesOwed: fees.totalAdminFee,
        feeCalculation: fees
      }
    });

    // Create admin fee debt transaction
    const debtTransaction = await BillingTransaction.create({
      userId: instructor._id,
      type: 'debit',
      amount: fees.totalAdminFee,
      description: `Admin fees owed for direct transfer - Course: ${payment.course?.title || 'Unknown'}`,
      category: 'admin_fee',
      status: 'pending',
      balanceBefore: instructorAccount.availableBalance + fees.originalAmount,
      balanceAfter: instructorAccount.availableBalance + fees.originalAmount, // No immediate deduction
      relatedPayment: payment._id,
      from: instructor._id,
      to: null, // Admin
      processedAt: new Date(),
      notes: 'Admin fees to be paid separately',
      metadata: {
        paymentMethod: 'direct_transfer',
        originalPayment: fees.originalAmount,
        feeCalculation: fees,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // Update instructor billing account
    instructorAccount.availableBalance += fees.originalAmount;
    instructorAccount.outstanding += fees.totalAdminFee;
    instructorAccount.totalEarnings += fees.originalAmount;
    instructorAccount.totalCommissions += fees.instructorAmount; // Net commission
    
    // Add warning if outstanding fees are high
    if (instructorAccount.outstanding > 1000) {
      instructorAccount.status = 'warning';
      instructorAccount.notes = 'High outstanding admin fees - payment required';
    }

    await instructorAccount.save();

    // Update payment record
    payment.instructorAmount = fees.instructorAmount; // Net amount after fees
    payment.adminFee = fees.totalAdminFee;
    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.metadata = {
      ...payment.metadata,
      directTransferProcessed: true,
      adminFeesOwed: fees.totalAdminFee,
      feeCalculation: fees
    };
    await payment.save();

    return {
      success: true,
      message: 'Direct transfer processed successfully',
      data: {
        payment,
        creditTransaction,
        debtTransaction,
        instructorAccount,
        feeCalculation: fees
      }
    };

  } catch (error) {
    logger.error('Error processing direct transfer:', error);
    throw error;
  }
};

/**
 * Process card/PayPal payment
 * For card payments, admin receives full amount and pays instructor net amount
 * @param {Object} payment - Payment object
 * @param {Object} instructor - Instructor user object
 * @returns {Object} Processing result
 */

module.exports = {
  processDirectTransferPayment
};
