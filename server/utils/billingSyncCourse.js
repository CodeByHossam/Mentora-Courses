// Billing sync for course purchases. Split from billingSyncOperations.js; bodies unchanged.

const logger = require('./logger');
const BillingTransaction = require('../models/BillingTransaction');
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


module.exports = {
  syncCoursePurchase
};
