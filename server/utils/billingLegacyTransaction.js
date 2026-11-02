const logger = require('./logger');
const BillingTransaction = require("../models/BillingTransaction");
const User = require("../models/User");

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
    logger.info("⚠️ Billing operation already in progress for:", operationKey);
    throw new Error("Billing operation already in progress for this payment");
  }

  // Mark operation as in progress
  ongoingBillingOperations.add(operationKey);

  try {
    logger.info("Creating billing transactions for course payment:", {
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
      logger.info("Creating new billing account for student:", studentId);
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
      logger.info("Creating new billing account for instructor:", instructorId);
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
    logger.info("Saving billing accounts:", {
      studentId: studentId.toString(),
      instructorId: instructorId.toString(),
      sameUser: studentId.toString() === instructorId.toString(),
      studentAccountId: studentBillingAccount._id.toString(),
      instructorAccountId: instructorBillingAccount._id.toString(),
    });

    try {
      // Recalculate and save student account first
      studentBillingAccount.recalculateAll();
      logger.info("Saving student billing account...");
      await studentBillingAccount.save();
      logger.info("✅ Student billing account saved");

      // Only save instructor account if it's different from student account
      if (
        studentId.toString() !== instructorId.toString() &&
        studentBillingAccount._id.toString() !==
          instructorBillingAccount._id.toString()
      ) {
        instructorBillingAccount.recalculateAll();
        logger.info("Saving instructor billing account...");
        await instructorBillingAccount.save();
        logger.info("✅ Instructor billing account saved");
      } else {
        logger.info("Same account - skipping instructor save");
      }
    } catch (saveError) {
      logger.error("Error saving billing accounts:", saveError);
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

    logger.info("Created billing transactions:", {
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
    logger.error(
      "Error creating billing transactions for course payment:",
      error
    );
    throw error;
  } finally {
    // Always clean up the operation tracking
    ongoingBillingOperations.delete(operationKey);
  }
};

module.exports = {
  createLegacyBillingTransaction_DISABLED
};
