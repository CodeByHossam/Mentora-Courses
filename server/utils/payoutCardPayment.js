const logger = require('./logger');
const BillingTransaction = require('../models/BillingTransaction');
const { getBillingAccountByRole } = require('./specializedBillingUtils');

const processCardPayment = async (payment, instructor) => {
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

    // Credit instructor with net amount (after admin fees)
    const creditTransaction = await BillingTransaction.create({
      userId: instructor._id,
      type: 'credit',
      amount: fees.instructorAmount,
      description: `Course payment commission - Course: ${payment.course?.title || 'Unknown'}`,
      category: 'course_commission',
      status: 'completed',
      balanceBefore: instructorAccount.availableBalance,
      balanceAfter: instructorAccount.availableBalance + fees.instructorAmount,
      relatedPayment: payment._id,
      from: payment.userId,
      to: instructor._id,
      processedAt: new Date(),
      notes: 'Net commission after admin fees',
      metadata: {
        paymentMethod: payment.method,
        adminFeesDeducted: fees.totalAdminFee,
        feeCalculation: fees
      }
    });

    // Update instructor billing account
    instructorAccount.availableBalance += fees.instructorAmount;
    instructorAccount.totalEarnings += fees.instructorAmount;
    instructorAccount.totalCommissions += fees.instructorAmount;
    
    await instructorAccount.save();

    // Update payment record
    payment.instructorAmount = fees.instructorAmount;
    payment.adminFee = fees.totalAdminFee;
    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.metadata = {
      ...payment.metadata,
      cardPaymentProcessed: true,
      adminFeesDeducted: fees.totalAdminFee,
      feeCalculation: fees
    };
    await payment.save();

    return {
      success: true,
      message: 'Card payment processed successfully',
      data: {
        payment,
        creditTransaction,
        instructorAccount,
        feeCalculation: fees
      }
    };

  } catch (error) {
    logger.error('Error processing card payment:', error);
    throw error;
  }
};

/**
 * Process admin fee payment from instructor
 * @param {string} instructorId - Instructor ID
 * @param {number} amount - Payment amount
 * @param {string} description - Payment description
 * @returns {Object} Processing result
 */

module.exports = {
  processCardPayment
};
