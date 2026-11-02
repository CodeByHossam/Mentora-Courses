const logger = require('./logger');
const AdminBillingAccount = require("../models/AdminBillingAccount");
const InstructorBillingAccount = require("../models/InstructorBillingAccount");
const StudentBillingAccount = require("../models/StudentBillingAccount");
const BillingTransaction = require("../models/BillingTransaction");
const User = require("../models/User");

/**
 * SPECIALIZED BILLING UTILITIES - ROLE-BASED ACCOUNT MANAGEMENT
 *
 * =============================================================================
 * SPECIALIZED BILLING SYSTEM OVERVIEW:
 * =============================================================================
 *
 * This utility manages three distinct billing account types, each optimized
 * for specific user roles and financial operations:
 *
 * 🔴 ADMIN BILLING ACCOUNTS:
 *   - Platform revenue tracking and profit calculations
 *   - Instructor payout management and scheduling
 *   - Student refund processing and accounting
 *   - Monthly/yearly financial reporting
 *   - Platform expense tracking
 *
 * 🟡 INSTRUCTOR BILLING ACCOUNTS:
 *   - Commission earnings from course sales
 *   - Payout request management and processing
 *   - Course sales history and analytics
 *   - Welcome bonus and credit management
 *   - Admin fee liability tracking (for direct transfers)
 *
 * 🔵 STUDENT BILLING ACCOUNTS:
 *   - Course purchase history and tracking
 *   - Credit balance and payment management
 *   - Admin fee calculations and payments
 *   - Refund request processing
 *   - Payment method preferences
 *
 * 🔄 AUTOMATED WORKFLOWS:
 *   - Account creation based on user role
 *   - Balance calculations and updates
 *   - Transaction recording and audit trails
 *   - Cross-account reconciliation
 *
 * 🔐 SECURITY & INTEGRITY:
 *   - Duplicate operation prevention
 *   - Atomic transaction processing
 *   - Balance validation and verification
 *   - Comprehensive error handling
 *
 * =============================================================================
 * USAGE: Call appropriate functions based on user role and operation type
 * =============================================================================
 */

checkAndUpdateAccountStatus = async (userId, userKey) => {
  try {
    const account = await AdminBillingAccount.findOne({ [userKey]: userId });
    if (!account) {
      await AdminBillingAccount.create({
        userKey: userId,
        status: "active",
      });
    }
  } catch (error) {
    logger.error("Error creating admin billing account:", error);
  }
};
// Track ongoing operations to prevent duplicates
const ongoingBillingOperations = new Set();

/**
 * GET OR CREATE BILLING ACCOUNT BY ROLE
 *
 * Automatically creates the appropriate specialized billing account
 * based on user role if it doesn't exist. Handles welcome credits
 * and initial account setup.
 *
 * @param {ObjectId} userId - User ID
 * @param {String} userRole - User role (admin/instructor/student)
 * @returns {Object} Specialized billing account
 *
 * ACCOUNT CREATION LOGIC:
 * - Admin: Platform management account with revenue tracking
 * - Instructor: Earnings account with welcome credits (100 paid, 100k free)
 * - Student: Payment account with credit management
 */

async function processCoursePurchase({
  studentId,
  instructorId,
  courseId,
  paymentId,
  originalAmount,
  finalAmount,
  adminFee = 2,
  adminPercentage = 10,
  paymentMethod = "direct_transfer",
}) {
  const operationKey = `${paymentId}_${studentId}_${instructorId}`;

  // Prevent duplicate operations
  if (ongoingBillingOperations.has(operationKey)) {
    return { success: false, reason: "duplicate_operation" };
  }

  try {
    ongoingBillingOperations.add(operationKey);

    // STANDARDIZED COMMISSION CALCULATION
    // Admin gets: Fixed fee + percentage of course price
    // Instructor gets: Remaining amount after admin fees
    const baseAmount = originalAmount || finalAmount;
    const adminFixedFee = adminFee || 2; // Default $2 admin fee
    const adminPercentageFee = (baseAmount * (adminPercentage || 10)) / 100; // Default 10%
    const totalAdminProfit = adminFixedFee + adminPercentageFee;
    const instructorAmount = Math.max(0, baseAmount - totalAdminProfit); // Ensure never negative


    // Get user roles
    const [student, instructor] = await Promise.all([
      User.findById(studentId),
      User.findById(instructorId),
    ]);

    if (!student || !instructor) {
      throw new Error("Student or instructor not found");
    }

    // Get specialized billing accounts
    const [studentAccount, instructorAccount, adminAccount] = await Promise.all(
      [
        getBillingAccountByRole(studentId, "student"),
        getBillingAccountByRole(instructorId, "instructor"),
        getOrCreateAdminAccount(),
      ]
    );

    // Process student purchase - NO ADMIN FEES OWED BY STUDENT
    await processStudentPurchase(studentAccount, {
      courseId,
      instructorId,
      purchaseAmount: finalAmount,
      adminFeeAmount: 0, // Students never owe admin fees - they pay full amount upfront
      instructorAmount,
      paymentMethod,
      paymentId,
    });

    // Process instructor earnings
    await processInstructorEarnings(instructorAccount, {
      courseId,
      studentId,
      saleAmount: finalAmount,
      commissionAmount: instructorAmount,
      adminFeeAmount: totalAdminProfit,
      paymentMethod,
      paymentId,
    });

    // Process admin revenue
    await processAdminRevenue(adminAccount, {
      revenueAmount: totalAdminProfit,
      courseId,
      studentId,
      instructorId,
      paymentMethod,
    });

    // Create billing transactions
    const transactions = await createBillingTransactions({
      studentId,
      instructorId,
      courseId,
      paymentId,
      studentAmount: totalAdminProfit,
      instructorAmount,
      finalAmount,
      paymentMethod,
    });


    return {
      success: true,
      studentAccount: studentAccount._id,
      instructorAccount: instructorAccount._id,
      adminAccount: adminAccount._id,
      transactions,
      amounts: {
        totalAmount: finalAmount,
        adminRevenue: totalAdminProfit,
        instructorCommission: instructorAmount,
      },
    };
  } catch (error) {
    logger.error("❌ Error in specialized billing processing:", error);
    throw error;
  } finally {
    ongoingBillingOperations.delete(operationKey);
  }
}

/**
 * Process student course purchase - SIMPLIFIED
 * Just update permanent box
 */

async function processStudentPurchase(studentAccount, purchaseData) {
  try {
    // 📦 Add to permanent box (totalCoursePurchases)
    studentAccount.addCoursePurchase(purchaseData);
    await studentAccount.save();

  } catch (error) {
    logger.error("❌ Error processing student purchase:", error);
    throw error;
  }
}

/**
 * Process instructor earnings - SIMPLIFIED
 * Just update permanent box
 */

async function processInstructorEarnings(instructorAccount, earningsData) {
  try {
    // 📦 Add to permanent box (totalCommissionEarned)
    instructorAccount.addCourseSale(earningsData);
    await instructorAccount.save();

  } catch (error) {
    logger.error("❌ Error processing instructor earnings:", error);
    throw error;
  }
}

/**
 * Process admin revenue - SIMPLIFIED
 * Just update permanent box
 */

async function processAdminRevenue(adminAccount, revenueData) {
  try {
    // 📦 Add to permanent box (totalRevenue)
    adminAccount.totalRevenue += revenueData.revenueAmount;
    adminAccount.platformBalance = adminAccount.totalRevenue - adminAccount.totalInstructorPayouts;
    adminAccount.updateMonthlyRevenue(revenueData.revenueAmount, "revenue");
    adminAccount.statistics.totalTransactions += 1;
    adminAccount.statistics.totalCoursesSold += 1;

    await adminAccount.save();

  } catch (error) {
    logger.error("❌ Error processing admin revenue:", error);
    throw error;
  }
}

/**
 * Create billing transactions for course purchase
 */

async function createBillingTransactions({
  studentId,
  instructorId,
  courseId,
  paymentId,
  studentAmount,
  instructorAmount,
  finalAmount,
  paymentMethod,
}) {
  try {
    const transactions = [];
    // Resolve admin user once for direction purposes
    const adminUser = await User.findOne({ role: "admin" });

    // Student debit transaction (full course payment)
    const studentTransaction = await BillingTransaction.create({
      userId: studentId,
      type: "debit",
      amount: finalAmount, // ✅ Full course price, not just admin fee
      description: `Course purchase - $${finalAmount}`,
      category: "course_payment",
      status: "completed",
      balanceBefore: 0, // Will be updated by account methods
      balanceAfter: -finalAmount, // ✅ Student paid full amount
      relatedPayment: paymentId,
      relatedCourse: courseId,
      from: studentId,
      to: paymentMethod === "direct_transfer" ? instructorId : (adminUser ? adminUser._id : null), // ✅ Electronic: Student -> Admin; Direct: Student -> Instructor
      processedAt: new Date(),
      notes: "Full course payment made by student",
      metadata: {
        courseId,
        instructorId,
        originalAmount: finalAmount,
        finalAmount,
        paymentMethod,
        transactionType: "course_purchase", // ✅ Correct type
      },
    });

    transactions.push(studentTransaction);

    // Instructor credit transaction (commission)
    const instructorTransaction = await BillingTransaction.create({
      userId: instructorId,
      type: "credit",
      amount: instructorAmount,
      description: `Course sale commission - $${finalAmount} course payment`,
      category: "commission",
      status: "completed",
      balanceBefore: 0, // Will be updated by account methods
      balanceAfter: instructorAmount,
      relatedPayment: paymentId,
      relatedCourse: courseId,
      from: studentId,
      to: instructorId,
      processedAt: new Date(),
      notes: "Instructor commission from course sale",
      metadata: {
        courseId,
        studentId,
        originalAmount: finalAmount,
        finalAmount,
        paymentMethod,
        transactionType: "instructor_commission",
      },
    });

    transactions.push(instructorTransaction);

    // Admin credit transaction (fee collection) - for ALL payment methods
    // adminUser resolved earlier
    const adminTransaction = await BillingTransaction.create({
      userId: adminUser ? adminUser._id : null, // Admin user ID
      type: "credit", // ✅ Admin receives money (credit)
      amount: studentAmount, // Admin fee amount
      description: `Admin fee received from ${paymentMethod} - $${finalAmount} course payment`,
      category: "admin_fee",
      status: "completed",
      balanceBefore: 0, // Will be updated by account methods
      balanceAfter: studentAmount, // ✅ Positive balance
      relatedPayment: paymentId,
      relatedCourse: courseId,
      from: paymentMethod === "direct_transfer" ? instructorId : studentId, // Money source
      to: adminUser ? adminUser._id : null, // ✅ Money goes to admin
      processedAt: new Date(),
      notes: `Admin fee collected from ${paymentMethod} payment`,
      metadata: {
        courseId,
        instructorId,
        studentId,
        originalAmount: finalAmount,
        finalAmount,
        paymentMethod,
        transactionType: "admin_fee_received", // ✅ Correct type
      },
    });

    transactions.push(adminTransaction);


    return transactions;
  } catch (error) {
    logger.error("❌ Error creating billing transactions:", error);
    throw error;
  }
}

/**
 * Get or create admin billing account
 */

module.exports = {
  processCoursePurchase
};
