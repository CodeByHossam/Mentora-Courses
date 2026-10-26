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
const syncCoursePurchase = async (paymentData) => {
  const {
    studentId,
    instructorId,
    courseId,
    totalAmount,
    instructorAmount,
    adminFeeAmount,
    paymentMethod,
    paymentId
  } = paymentData;

  logger.info('🔄 Starting course purchase synchronization:', {
    studentId,
    instructorId,
    courseId,
    totalAmount,
    paymentMethod
  });

  try {
    // Get all billing accounts
    const studentAccount = await getBillingAccountByRole(studentId, 'student');
    const instructorAccount = await getBillingAccountByRole(instructorId, 'instructor');
    const adminAccount = await getBillingAccountByRole(null, 'admin'); // Get platform admin account

    const transactions = [];

    // STUDENT ACCOUNT UPDATES
    if (studentAccount) {
      // Add course purchase record
      studentAccount.addCoursePurchase({
        courseId,
        instructorId,
        purchaseAmount: totalAmount,
        adminFeeAmount: paymentMethod === 'direct_transfer' ? 0 : adminFeeAmount, // Students don't owe admin fees
        instructorAmount,
        paymentMethod,
        paymentId,
        status: 'completed'
      });

      await studentAccount.save();

      // Create student transaction (course purchase)
      const studentTransaction = new BillingTransaction({
        userId: studentId,
        type: 'debit',
        amount: totalAmount,
        description: `Course purchase - ${courseId}`,
        category: 'course_purchase',
        status: 'completed',
        balanceBefore: studentAccount.currentBalance + totalAmount,
        balanceAfter: studentAccount.currentBalance,
        relatedPayment: paymentId,
        relatedCourse: courseId,
        processedAt: new Date(),
        metadata: {
          paymentMethod,
          instructorId,
          adminFeeAmount,
          instructorAmount
        }
      });

      await studentTransaction.save();
      transactions.push(studentTransaction);
    }

    // INSTRUCTOR ACCOUNT UPDATES
    if (instructorAccount) {
      // Add course sale record
      instructorAccount.addCourseSale({
        courseId,
        studentId,
        saleAmount: totalAmount,
        commissionAmount: instructorAmount,
        adminFeeAmount,
        paymentMethod,
        paymentId
      });

      await instructorAccount.save();

      // Create instructor transaction (commission earned)
      const instructorTransaction = new BillingTransaction({
        userId: instructorId,
        type: 'credit',
        amount: instructorAmount,
        description: `Course commission - ${courseId}`,
        category: 'commission',
        status: 'completed',
        balanceBefore: instructorAccount.availableBalance - instructorAmount,
        balanceAfter: instructorAccount.availableBalance,
        relatedPayment: paymentId,
        relatedCourse: courseId,
        processedAt: new Date(),
        metadata: {
          paymentMethod,
          studentId,
          totalAmount,
          adminFeeAmount
        }
      });

      await instructorTransaction.save();
      transactions.push(instructorTransaction);

      // If direct transfer, create admin fee liability transaction
      if (paymentMethod === 'direct_transfer') {
        const adminFeeTransaction = new BillingTransaction({
          userId: instructorId,
          type: 'debit',
          amount: adminFeeAmount,
          description: `Admin fee liability - ${courseId}`,
          category: 'admin_fee_liability',
          status: 'pending',
          balanceBefore: instructorAccount.availableBalance,
          balanceAfter: instructorAccount.availableBalance, // No immediate balance change
          relatedPayment: paymentId,
          relatedCourse: courseId,
          processedAt: new Date(),
          metadata: {
            paymentMethod,
            studentId,
            totalAmount,
            dueForPayment: true
          }
        });

        await adminFeeTransaction.save();
        transactions.push(adminFeeTransaction);
      }
    }

    // ADMIN ACCOUNT UPDATES
    if (adminAccount) {
      if (paymentMethod === 'direct_transfer') {
        // Admin is owed the fee
        adminAccount.totalAdminFeesOwed = (adminAccount.totalAdminFeesOwed || 0) + adminFeeAmount;
      } else {
        // Admin collected the fee
        adminAccount.totalAdminFeesCollected = (adminAccount.totalAdminFeesCollected || 0) + adminFeeAmount;
        adminAccount.totalInstructorPayoutsOwed = (adminAccount.totalInstructorPayoutsOwed || 0) + instructorAmount;
      }

      adminAccount.totalRevenue = (adminAccount.totalRevenue || 0) + totalAmount;
      adminAccount.recalculateAll();
      await adminAccount.save();

      // Create admin transaction
      const adminTransaction = new BillingTransaction({
        userId: adminAccount.adminId || null,
        type: 'credit',
        amount: paymentMethod === 'direct_transfer' ? 0 : adminFeeAmount,
        description: `Admin fee ${paymentMethod === 'direct_transfer' ? 'receivable' : 'collected'} - ${courseId}`,
        category: 'admin_fee',
        status: 'completed',
        balanceBefore: adminAccount.platformBalance,
        balanceAfter: adminAccount.platformBalance,
        relatedPayment: paymentId,
        relatedCourse: courseId,
        processedAt: new Date(),
        metadata: {
          paymentMethod,
          studentId,
          instructorId,
          totalAmount,
          feeCollected: paymentMethod !== 'direct_transfer'
        }
      });

      await adminTransaction.save();
      transactions.push(adminTransaction);
    }

    logger.info('✅ Course purchase synchronization completed:', {
      transactionsCreated: transactions.length,
      studentBalance: studentAccount?.currentBalance,
      instructorBalance: instructorAccount?.availableBalance,
      adminRevenue: adminAccount?.totalRevenue
    });

    return {
      success: true,
      transactions,
      accounts: {
        student: studentAccount,
        instructor: instructorAccount,
        admin: adminAccount
      }
    };

  } catch (error) {
    logger.error('❌ Course purchase synchronization failed:', error);
    throw error;
  }
};

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

/**
 * 🔍 VALIDATION AND INTEGRITY CHECKS
 */

/**
 * Validate account balance integrity
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
  syncCoursePurchase,
  syncPayoutApproval,
  syncRefundApproval,
  syncAdminFeePaymentApproval,
  validateAccountIntegrity
};
