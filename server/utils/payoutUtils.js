const logger = require('./logger');
/**
 * PAYOUT UTILITIES
 * 
 * Utility functions for handling payout calculations and admin fee processing
 * 
 * BUSINESS LOGIC:
 * ===============
 * 
 * 🏦 DIRECT TRANSFER FLOW:
 * Student → Direct Transfer → Instructor (Full Amount)
 * Instructor → Must Pay Back → Admin (Admin Fees)
 * 
 * 💳 CARD/PAYPAL FLOW:
 * Student → Card/PayPal → Admin (Full Amount)
 * Admin → Pays Out → Instructor (Amount - Admin Fees)
 * 
 * 📊 ADMIN FEE CALCULATION:
 * - Admin fees are calculated on the full payment amount
 * - For direct transfers: Instructor receives full amount but owes admin fees
 * - For card payments: Admin receives full amount and pays instructor net amount
 */

const BillingTransaction = require('../models/BillingTransaction');
const { getBillingAccountByRole } = require('./specializedBillingUtils');

/**
 * Calculate admin fees for a payment
 * @param {number} amount - Payment amount
 * @param {number} adminPercentage - Admin fee percentage
 * @param {number} adminFeeFixed - Fixed admin fee
 * @returns {Object} Fee calculation breakdown
 */
const calculateAdminFees = (amount, adminPercentage = 10, adminFeeFixed = 0) => {
  const percentageFee = (amount * adminPercentage) / 100;
  const totalAdminFee = percentageFee + adminFeeFixed;
  const instructorAmount = amount - totalAdminFee;

  return {
    originalAmount: amount,
    adminPercentage,
    adminFeeFixed,
    adminFeePercentage: percentageFee,
    totalAdminFee,
    instructorAmount,
    netAmount: instructorAmount
  };
};

/**
 * Process direct transfer payment
 * For direct transfers, the instructor receives the full amount but owes admin fees
 * @param {Object} payment - Payment object
 * @param {Object} instructor - Instructor user object
 * @returns {Object} Processing result
 */
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
  calculateAdminFees,
  processDirectTransferPayment,
  processCardPayment,
  processAdminFeePayment,
  checkAccountStatus
};
