const AdminBillingAccount = require("../models/AdminBillingAccount");
const InstructorBillingAccount = require("../models/InstructorBillingAccount");
const StudentBillingAccount = require("../models/StudentBillingAccount");
const BillingTransaction = require("../models/BillingTransaction");
const User = require("../models/User");
const Payment = require("../models/Payment");
const AdminSettings = require("../models/AdminSettings");

// Import specialized billing utilities
const {
  processCoursePurchase: processSpecializedCoursePurchase,
  getBillingAccountByRole,
  getBillingSummary: getSpecializedBillingSummary,
  getOrCreateBillingAccount,
  getOrCreateAdminAccount,
  checkAndUpdateAccountStatus,
} = require("./specializedBillingUtils");

/**
 * Enhanced billing system with specialized account types
 * Now uses specialized accounts by default
 */

/**
 * Process annual fees for all users
 * Runs daily to check if annual fees are due
 */
const processAnnualFees = async () => {
  try {
    console.log("💰 Starting annual fee processing...");

    // Get admin settings for fee amounts
    const adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      console.log("⚠️ No admin settings found, skipping annual fee processing");
      return [];
    }

    const studentAnnualFee =
      adminSettings.paymentSettings?.studentAnnualFee || 10;
    const instructorAnnualFee =
      adminSettings.paymentSettings?.instructorAnnualFee || 10;

    const results = [];
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();

    // Process student annual fees
    const students = await User.find({ role: "student", isActive: true });
    for (const student of students) {
      try {
        const studentAccount = await StudentBillingAccount.findOne({
          studentId: student._id,
        });
        if (!studentAccount) continue;

        // Check if annual fee is due (account created more than a year ago)
        const accountAge = Math.floor(
          (currentDate - studentAccount.createdAt) /
            (365.25 * 24 * 60 * 60 * 1000)
        );

        if (accountAge >= 1) {
          // Check if annual fee for current year has been processed
          const hasCurrentYearFee = studentAccount.creditTransactions.some(
            (t) => t.description.includes(`Annual fee for ${currentYear}`)
          );

          if (!hasCurrentYearFee) {
            studentAccount.addAnnualFee(studentAnnualFee, currentYear);
            await studentAccount.save();

            results.push({
              userId: student._id,
              userType: "student",
              feeAmount: studentAnnualFee,
              year: currentYear,
            });

            console.log(
              `💳 Added annual fee of $${studentAnnualFee} for student ${student.email}`
            );
          }
        }
      } catch (error) {
        console.error(
          `❌ Error processing annual fee for student ${student.email}:`,
          error.message
        );
      }
    }

    // Process instructor annual fees
    const instructors = await User.find({ role: "instructor", isActive: true });
    for (const instructor of instructors) {
      try {
        const instructorAccount = await InstructorBillingAccount.findOne({
          instructorId: instructor._id,
        });
        if (!instructorAccount) continue;

        // Check if annual fee is due (account created more than a year ago)
        const accountAge = Math.floor(
          (currentDate - instructorAccount.createdAt) /
            (365.25 * 24 * 60 * 60 * 1000)
        );

        if (accountAge >= 1) {
          // Check if annual fee for current year has been processed
          const hasCurrentYearFee = instructorAccount.courseSales.some(
            (sale) =>
              sale.description &&
              sale.description.includes(`Annual fee for ${currentYear}`)
          );

          if (!hasCurrentYearFee) {
            // Add annual fee as owed amount
            instructorAccount.owedAdminFees =
              (instructorAccount.owedAdminFees || 0) + instructorAnnualFee;
            await instructorAccount.save();

            results.push({
              userId: instructor._id,
              userType: "instructor",
              feeAmount: instructorAnnualFee,
              year: currentYear,
            });

            console.log(
              `💳 Added annual fee of $${instructorAnnualFee} for instructor ${instructor.email}`
            );
          }
        }
      } catch (error) {
        console.error(
          `❌ Error processing annual fee for instructor ${instructor.email}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Annual fee processing completed. Processed ${results.length} users.`
    );
    return results;
  } catch (error) {
    console.error("❌ Error in processAnnualFees:", error);
    throw error;
  }
};

// Always use specialized billing accounts
const USE_SPECIALIZED_BILLING = true;

/**
 * Main course purchase processing function
 * Uses specialized billing system
 */
const createBillingTransactionForCoursePayment = async (paymentData) => {
  try {
    console.log("🆕 Using ONLY specialized billing system (legacy disabled)");
    return await processSpecializedCoursePurchase(paymentData);
  } catch (error) {
    console.error(
      "❌ Error in specialized billing transaction creation:",
      error
    );
    throw error;
  }
};

/**
 * LEGACY BILLING SYSTEM - DISABLED
 * This system has been replaced by the specialized billing system
 * to prevent double-counting and improve accuracy
 */
// LEGACY SYSTEM DISABLED - DO NOT USE
// const ongoingBillingOperations = new Set();

// LEGACY FUNCTION DISABLED - DO NOT USE
const createLegacyBillingTransaction_DISABLED = async (paymentData) => {
  const {
    studentId,
    courseId,
    instructorId,
    originalAmount,
    finalAmount,
    adminFee,
    adminPercentage,
    instructorAmount,
    paymentId,
    method,
  } = paymentData;

  // Create a unique key for this operation
  const operationKey = `${paymentId}_${studentId}_${instructorId}`;

  // Check if this operation is already in progress
  if (ongoingBillingOperations.has(operationKey)) {
    console.log("⚠️ Billing operation already in progress for:", operationKey);
    throw new Error("Billing operation already in progress for this payment");
  }

  // Mark operation as in progress
  ongoingBillingOperations.add(operationKey);

  try {
    console.log("Creating billing transactions for course payment:", {
      studentId,
      courseId,
      instructorId,
      originalAmount,
      finalAmount,
      adminFee,
      adminPercentage,
      instructorAmount,
      paymentId,
      method,
    });

    // Validate userId inputs
    if (!studentId) {
      throw new Error("Student ID is required but was null or undefined");
    }
    if (!instructorId) {
      throw new Error("Instructor ID is required but was null or undefined");
    }

    // Get or create student billing account - CONSISTENT FIELD NAME
    let studentBillingAccount = await BillingAccount.findOne({
      userId: studentId,
    });
    if (!studentBillingAccount) {
      console.log("Creating new billing account for student:", studentId);
      const student = await User.findById(studentId);
      studentBillingAccount = await BillingAccount.create({
        userId: studentId,
        accountOwner: {
          name: student?.name || "",
          email: student?.email || "",
          role: student?.role || "student",
        },
        welcomeCredits: 0, // Students don't get welcome credits
        totalUserCredits: 0,
        CreditAvailableBalance: 0,
        creditLimit: 100, // Default credit limit for students
      });
    } else {
      // Update account owner info if account exists but owner info is missing
      if (!studentBillingAccount.accountOwner?.name) {
        const student = await User.findById(studentId);
        studentBillingAccount.updateAccountOwner(student);
        await studentBillingAccount.save();
      }
    }

    // Get or create instructor billing account - CONSISTENT FIELD NAME
    let instructorBillingAccount = await BillingAccount.findOne({
      userId: instructorId,
    });
    if (!instructorBillingAccount) {
      console.log("Creating new billing account for instructor:", instructorId);
      const instructor = await User.findById(instructorId);
      const welcomeCredits = instructor?.accountType === "free" ? 100000 : 100;

      instructorBillingAccount = await BillingAccount.create({
        userId: instructorId,
        accountOwner: {
          name: instructor?.name || "",
          email: instructor?.email || "",
          role: instructor?.role || "instructor",
        },
        welcomeCredits,
        totalUserCredits: welcomeCredits,
        CreditAvailableBalance: welcomeCredits,
        creditLimit: 500, // Higher credit limit for instructors
      });
    } else {
      // Update account owner info if account exists but owner info is missing
      if (!instructorBillingAccount.accountOwner?.name) {
        const instructor = await User.findById(instructorId);
        instructorBillingAccount.updateAccountOwner(instructor);
        await instructorBillingAccount.save();
      }
    }

    // Calculate admin profit (total deduction from instructor earnings)
    const totalAdminProfit =
      (adminFee || 0) +
      ((originalAmount || finalAmount) * (adminPercentage || 0)) / 100;

    // Add course purchase bill to student's account
    // For Card/PayPal: Student pays full amount to platform, NO admin fees owed
    // For Direct Transfer: Student pays instructor, admin fees tracked for reference
    const coursePurchaseBill = {
      relatedPayment: paymentId,
      totalAmount: finalAmount,
      AdminFees: method === "direct_transfer" ? totalAdminProfit : 0, // Only for direct transfers
      InstructorPayable: instructorAmount,
      createdAt: new Date(),
    };

    studentBillingAccount.CorsesPurchaseBills.push(coursePurchaseBill);

    // Update student billing account totals
    studentBillingAccount.totalCoursesPurchase += finalAmount;
    studentBillingAccount.totalStudentsPaymentsHistory += finalAmount;
    // IMPORTANT: Student pays FULL course amount - NO outstanding fees
    // Admin fees are handled between instructor and admin based on payment method

    // Update instructor billing account based on payment method
    instructorBillingAccount.totalInstructorProfitsHistory += instructorAmount;
    instructorBillingAccount.totalAdminFeesHistory += totalAdminProfit;

    if (method === "direct_transfer") {
      // Direct Transfer: Instructor receives full amount, owes admin fees
      instructorBillingAccount.CreditAvailableBalance += finalAmount; // Full amount received
      instructorBillingAccount.instructorPayable += instructorAmount; // Net earnings after fees

      // Add admin fee bill to instructor's account (they owe admin)
      const instructorAdminFeeBill = {
        relatedPayment: paymentId,
        totalAmount: 0, // No course purchase for instructor
        AdminFees: totalAdminProfit, // Admin fees they owe
        InstructorPayable: 0, // Not applicable for instructor's own bill
        createdAt: new Date(),
      };
      instructorBillingAccount.CorsesPurchaseBills.push(instructorAdminFeeBill);
    } else {
      // Card/PayPal: Admin receives full amount, owes instructor commission
      instructorBillingAccount.CreditAvailableBalance += instructorAmount; // Commission only
      instructorBillingAccount.instructorPayable += instructorAmount; // What admin owes instructor
    }

    // Update statistics
    studentBillingAccount.statistics.lastStudentPaymentAmount = finalAmount;
    instructorBillingAccount.statistics.lastInstructorPaymentAmount =
      instructorAmount;

    // Save billing accounts sequentially to prevent parallel save errors
    console.log("Saving billing accounts:", {
      studentId: studentId.toString(),
      instructorId: instructorId.toString(),
      sameUser: studentId.toString() === instructorId.toString(),
      studentAccountId: studentBillingAccount._id.toString(),
      instructorAccountId: instructorBillingAccount._id.toString(),
    });

    try {
      // Recalculate and save student account first
      studentBillingAccount.recalculateAll();
      console.log("Saving student billing account...");
      await studentBillingAccount.save();
      console.log("✅ Student billing account saved");

      // Only save instructor account if it's different from student account
      if (
        studentId.toString() !== instructorId.toString() &&
        studentBillingAccount._id.toString() !==
          instructorBillingAccount._id.toString()
      ) {
        instructorBillingAccount.recalculateAll();
        console.log("Saving instructor billing account...");
        await instructorBillingAccount.save();
        console.log("✅ Instructor billing account saved");
      } else {
        console.log("Same account - skipping instructor save");
      }
    } catch (saveError) {
      console.error("Error saving billing accounts:", saveError);
      throw saveError;
    }

    // Create BillingTransaction for student course payment (debit)
    const studentBalanceBefore = studentBillingAccount.CreditAvailableBalance;
    const studentTransaction = await BillingTransaction.create({
      userId: studentId,
      type: "debit",
      amount: finalAmount, // Student pays FULL course amount
      description: `Course purchase payment - ${finalAmount}`,
      category: "course_payment",
      status: "completed",
      balanceBefore: studentBalanceBefore,
      balanceAfter: studentBalanceBefore - finalAmount, // Full amount deducted
      relatedPayment: paymentId,
      relatedCourse: courseId,
      from: studentId,
      to: method === "direct_transfer" ? instructorId : null, // Direct to instructor or admin
      processedBy: null,
      processedAt: new Date(),
      notes: `Course payment via ${method}`,
      metadata: {
        courseId: courseId,
        instructorId: instructorId,
        originalAmount: originalAmount || finalAmount,
        finalAmount: finalAmount,
        adminFee: adminFee,
        adminPercentage: adminPercentage,
        paymentMethod: method,
        transactionType: "course_payment",
      },
    });

    // Create BillingTransaction for instructor earnings (credit) - CONSISTENT FIELD NAME
    const instructorBalanceBefore =
      instructorBillingAccount.CreditAvailableBalance - instructorAmount; // Before addition
    const instructorTransaction = await BillingTransaction.create({
      userId: instructorId,
      type: "credit",
      amount: instructorAmount,
      description: `Course sale commission - ${finalAmount} course payment`,
      category: "commission",
      status: "completed",
      balanceBefore: instructorBalanceBefore,
      balanceAfter: instructorBillingAccount.CreditAvailableBalance,
      relatedPayment: paymentId,
      relatedCourse: courseId,
      from: studentId,
      to: instructorId,
      processedBy: null, // System processed
      processedAt: new Date(),
      notes: `Instructor commission from course sale`,
      metadata: {
        courseId: courseId,
        studentId: studentId,
        originalAmount: originalAmount || finalAmount,
        finalAmount: finalAmount,
        adminFee: adminFee,
        adminPercentage: adminPercentage,
        paymentMethod: method,
        transactionType: "instructor_commission",
      },
    });

    // Create admin fee transaction based on payment method
    let adminFeeTransaction = null;
    if (method === "direct_transfer") {
      // Direct Transfer: Create debit transaction for instructor (owes admin fees)
      adminFeeTransaction = await BillingTransaction.create({
        userId: instructorId,
        type: "debit",
        amount: totalAdminProfit,
        description: `Admin fees owed for direct transfer course sale - ${finalAmount}`,
        category: "commission",
        status: "pending", // Pending until instructor pays
        balanceBefore: instructorBillingAccount.CreditAvailableBalance,
        balanceAfter:
          instructorBillingAccount.CreditAvailableBalance - totalAdminProfit,
        relatedPayment: paymentId,
        relatedCourse: courseId,
        from: instructorId,
        to: null, // To admin
        processedBy: null,
        processedAt: new Date(),
        notes: `Admin fees owed for direct transfer payment`,
        metadata: {
          courseId: courseId,
          studentId: studentId,
          originalAmount: originalAmount || finalAmount,
          finalAmount: finalAmount,
          adminFee: adminFee,
          adminPercentage: adminPercentage,
          paymentMethod: method,
          transactionType: "admin_fee_owed",
        },
      });
    } else {
      // Card/PayPal: Create credit transaction for admin (receives admin fees)
      adminFeeTransaction = await BillingTransaction.create({
        userId: null, // Admin transaction (could link to admin user)
        type: "credit",
        amount: totalAdminProfit,
        description: `Admin fees collected from ${method} course sale - ${finalAmount}`,
        category: "commission",
        status: "completed",
        balanceBefore: 0, // Admin balance tracking would be separate
        balanceAfter: totalAdminProfit,
        relatedPayment: paymentId,
        relatedCourse: courseId,
        from: studentId,
        to: null, // Admin
        processedBy: null,
        processedAt: new Date(),
        notes: `Admin fees collected from ${method} payment`,
        metadata: {
          courseId: courseId,
          studentId: studentId,
          instructorId: instructorId,
          originalAmount: originalAmount || finalAmount,
          finalAmount: finalAmount,
          adminFee: adminFee,
          adminPercentage: adminPercentage,
          paymentMethod: method,
          transactionType: "admin_fee_collected",
        },
      });
    }

    console.log("Created billing transactions:", {
      studentTransaction: studentTransaction._id,
      instructorTransaction: instructorTransaction._id,
      adminFeeTransaction: adminFeeTransaction._id,
      paymentMethod: method,
      studentAmount: finalAmount,
      instructorAmount,
      adminFeeAmount: totalAdminProfit,
    });

    return {
      success: true,
      studentBillingAccount: studentBillingAccount._id,
      instructorBillingAccount: instructorBillingAccount._id,
      studentTransaction: studentTransaction._id,
      instructorTransaction: instructorTransaction._id,
      adminFeeTransaction: adminFeeTransaction._id,
      paymentMethod: method,
      amounts: {
        coursePrice: finalAmount,
        adminFees: totalAdminProfit,
        instructorCommission: instructorAmount,
      },
      flow:
        method === "direct_transfer"
          ? "Student → Instructor (full amount), Instructor owes Admin (fees)"
          : "Student → Admin (full amount), Admin owes Instructor (commission)",
    };
  } catch (error) {
    console.error(
      "Error creating billing transactions for course payment:",
      error
    );
    throw error;
  } finally {
    // Always clean up the operation tracking
    ongoingBillingOperations.delete(operationKey);
  }
};

/**
 * Get comprehensive billing summary for a user
 * Works with the specialized billing account models
 */
const getUserBillingSummary = async (userId) => {
  try {
    console.log(`🔍 Getting billing summary for user: ${userId}`);
    console.log(
      `🔍 UserId type: ${typeof userId}, value: ${JSON.stringify(userId)}`
    );

    if (!userId) {
      throw new Error("User ID is required but was null or undefined");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found with ID: ${userId}`);
    }

    console.log(`User found: ${user.name} (${user.role})`);

    // Use specialized billing summary
    return await getSpecializedBillingSummary(userId);
  } catch (error) {
    console.error("Error getting billing summary:", error);
    throw error;
  }
};

/**
 * Fix instructor billing accounts missing admin fee bills for direct transfers
 * Now uses specialized InstructorBillingAccount model
 */
const fixInstructorDirectTransferFees = async () => {
  try {
    console.log(
      "🔧 Fixing instructor billing accounts missing direct transfer admin fees..."
    );

    // Find instructor accounts that have admin fee history but no admin fees in bills
    const instructorAccounts = await InstructorBillingAccount.find({
      totalAdminFeesHistory: { $gt: 0 },
      // Add additional criteria based on the new model structure
    });

    console.log(
      `Found ${instructorAccounts.length} instructor accounts with missing admin fee bills`
    );

    for (const account of instructorAccounts) {
      console.log(`Fixing instructor account: ${account.instructorId}`);

      // Find direct transfer payments for this instructor
      const directTransferPayments = await Payment.find({
        course: { $exists: true },
        method: "direct_transfer",
        status: "paid",
      }).populate("course", "instructor");

      let hasChanges = false;
      for (const payment of directTransferPayments) {
        if (
          payment.course?.instructor?.toString() ===
          account.instructorId.toString()
        ) {
          // Check if we already have a sale record for this payment
          const existingSale = account.courseSales.find(
            (sale) => sale.paymentId?.toString() === payment._id.toString()
          );

          if (!existingSale) {
            // Calculate admin fees for this payment
            const adminSettings = await AdminSettings.findOne();
            const adminFee =
              adminSettings?.paymentSettings?.studentAdminFee ||
              adminSettings?.studentAdminFee ||
              2;
            const adminPercentage =
              adminSettings?.paymentSettings?.globalDeductionPercentage ||
              adminSettings?.globalDeductionPercentage ||
              10;
            const paymentAmount = payment.finalAmount || payment.amount;
            const totalAdminProfit =
              adminFee + (paymentAmount * adminPercentage) / 100;
            const instructorAmount = paymentAmount - totalAdminProfit;

            console.log(
              `  Adding course sale record (${instructorAmount} commission, ${totalAdminProfit} admin fee) for payment ${payment._id}`
            );

            // Add course sale to instructor's account
            const courseSale = {
              courseId: payment.course._id,
              studentId: payment.userId,
              saleAmount: paymentAmount,
              commissionAmount: instructorAmount,
              adminFeeAmount: totalAdminProfit,
              paymentMethod: "direct_transfer",
              saleDate: payment.paidAt || payment.createdAt || new Date(),
              paymentId: payment._id,
            };
            account.courseSales.push(courseSale);
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        // Recalculate totals using the model's method
        account.recalculateAll();
        await account.save();
        console.log(
          `  ✅ Fixed instructor account - New balance: ${account.availableBalance}`
        );
      }
    }

    console.log("✅ Instructor billing account fix completed");
  } catch (error) {
    console.error("❌ Error fixing instructor billing accounts:", error);
  }
};

/**
 * Fix student billing accounts that incorrectly have outstanding admin fees
 * Now uses specialized StudentBillingAccount model
 */
const fixStudentOutstandingBalances = async () => {
  try {
    console.log(
      "🔧 Fixing student billing accounts with incorrect outstanding balances..."
    );

    // Find all student billing accounts with outstanding admin fees
    const studentAccounts = await StudentBillingAccount.find({
      outstandingAdminFees: { $gt: 0 },
    });

    console.log(
      `Found ${studentAccounts.length} student accounts with admin fees to fix`
    );

    for (const account of studentAccounts) {
      console.log(`Fixing student account: ${account.studentId}`);

      // Update course purchases to remove admin fees for non-direct transfers
      let hasChanges = false;
      for (const purchase of account.coursePurchases) {
        // If this was a Card/PayPal payment, remove admin fees
        const payment = await Payment.findById(purchase.paymentId);
        if (
          payment &&
          payment.method !== "direct_transfer" &&
          purchase.adminFeeAmount > 0
        ) {
          console.log(
            `  Removing admin fees (${purchase.adminFeeAmount}) from ${payment.method} payment`
          );
          purchase.adminFeeAmount = 0;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        // Recalculate totals using the model's method
        account.recalculateAll();
        await account.save();
        console.log(
          `  ✅ Fixed account - New balance: ${account.currentBalance}`
        );
      }
    }

    console.log("✅ Student billing account fix completed");
  } catch (error) {
    console.error("❌ Error fixing student billing accounts:", error);
  }
};

/**
 * Recalculate billing account statistics from actual transactions
 * Now works with specialized billing account models
 */
const recalculateBillingAccountStatistics = async (userId) => {
  try {
    console.log(`Recalculating billing statistics for user: ${userId}`);

    // Validate userId
    if (!userId) {
      throw new Error("User ID is required but was null or undefined");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get the appropriate billing account based on user role
    const billingAccount = await getBillingAccountByRole(userId, user.role);
    if (!billingAccount) {
      throw new Error("Billing account not found");
    }

    // Get all transactions for this user
    const allTransactions = await BillingTransaction.find({ userId });
    const creditTransactions = allTransactions.filter(
      (t) => t.type === "credit"
    );
    const debitTransactions = allTransactions.filter((t) => t.type === "debit");

    // Calculate totals
    const totalCredits = creditTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const totalDebits = debitTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Recalculate all totals using the model's method
    billingAccount.recalculateAll();
    await billingAccount.save();

    console.log(`Updated billing account statistics:`, {
      totalCredits,
      totalDebits,
      userRole: user.role,
      accountType: billingAccount.constructor.modelName,
    });

    return billingAccount;
  } catch (error) {
    console.error("Error recalculating billing statistics:", error);
    throw error;
  }
};

/**
 * Create middleware for handling credit payments (without course data)
 */
const createCreditPaymentMiddleware = () => {
  return async (req, res, next) => {
    try {
      // This middleware handles payments that are for adding credits only
      if (req.body.paymentType === "credit_addition") {
        // Remove course-related validations
        req.skipCourseValidation = true;

        // Set default values for missing course data
        req.body.courseId = null;
        req.body.instructorId = null;

        // Mark as credit payment
        req.isCreditPayment = true;
      }

      next();
    } catch (error) {
      console.error("Credit payment middleware error:", error);
      next(error);
    }
  };
};

/**
 * Enhanced billing summary - now always uses specialized accounts
 */
const getEnhancedBillingSummary = async (userId) => {
  try {
    console.log("🆕 Using specialized billing summary");
    return await getSpecializedBillingSummary(userId);
  } catch (error) {
    console.error("❌ Error in billing summary:", error);
    throw error;
  }
};

// Specialized billing is now always enabled - these functions are kept for compatibility
const enableSpecializedBilling = () => {
  console.log("✅ Specialized billing system is always enabled");
};

const disableSpecializedBilling = () => {
  console.log(
    "⚠️ Cannot disable specialized billing - it is now the default system"
  );
};

module.exports = {
  createBillingTransactionForCoursePayment,
  getBillingSummary: getSpecializedBillingSummary,
  processCoursePurchase: processSpecializedCoursePurchase,
  getOrCreateBillingAccount,
  getOrCreateAdminAccount,
  checkAndUpdateAccountStatus,
  processAnnualFees,
  recalculateBillingAccountStatistics,
  fixStudentOutstandingBalances,
  fixInstructorDirectTransferFees,
  createCreditPaymentMiddleware,
  enableSpecializedBilling,
  disableSpecializedBilling,
  // Export specialized utilities for direct access
  getBillingAccountByRole,
  processSpecializedCoursePurchase: processSpecializedCoursePurchase,
};
