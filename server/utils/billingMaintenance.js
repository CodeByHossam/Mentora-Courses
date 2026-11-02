const logger = require('./logger');
const InstructorBillingAccount = require("../models/InstructorBillingAccount");
const StudentBillingAccount = require("../models/StudentBillingAccount");
const BillingTransaction = require("../models/BillingTransaction");
const User = require("../models/User");
const Payment = require("../models/Payment");
const AdminSettings = require("../models/AdminSettings");
const { getBillingAccountByRole } = require("./specializedBillingUtils");

/**
 * Fix instructor billing accounts missing admin fee bills for direct transfers
 * Now uses specialized InstructorBillingAccount model
 */
const fixInstructorDirectTransferFees = async () => {
  try {
    logger.info(
      "🔧 Fixing instructor billing accounts missing direct transfer admin fees..."
    );

    // Find instructor accounts that have admin fee history but no admin fees in bills
    const instructorAccounts = await InstructorBillingAccount.find({
      totalAdminFeesHistory: { $gt: 0 },
      // Add additional criteria based on the new model structure
    });

    logger.info(
      `Found ${instructorAccounts.length} instructor accounts with missing admin fee bills`
    );

    for (const account of instructorAccounts) {
      logger.info(`Fixing instructor account: ${account.instructorId}`);

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

            logger.info(
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
        logger.info(
          `  ✅ Fixed instructor account - New balance: ${account.availableBalance}`
        );
      }
    }

    logger.info("✅ Instructor billing account fix completed");
  } catch (error) {
    logger.error("❌ Error fixing instructor billing accounts:", error);
  }
};

/**
 * Fix student billing accounts that incorrectly have outstanding admin fees
 * Now uses specialized StudentBillingAccount model
 */
const fixStudentOutstandingBalances = async () => {
  try {
    logger.info(
      "🔧 Fixing student billing accounts with incorrect outstanding balances..."
    );

    // Find all student billing accounts with outstanding admin fees
    const studentAccounts = await StudentBillingAccount.find({
      outstandingAdminFees: { $gt: 0 },
    });

    logger.info(
      `Found ${studentAccounts.length} student accounts with admin fees to fix`
    );

    for (const account of studentAccounts) {
      logger.info(`Fixing student account: ${account.studentId}`);

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
          logger.info(
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
        logger.info(
          `  ✅ Fixed account - New balance: ${account.currentBalance}`
        );
      }
    }

    logger.info("✅ Student billing account fix completed");
  } catch (error) {
    logger.error("❌ Error fixing student billing accounts:", error);
  }
};

/**
 * Recalculate billing account statistics from actual transactions
 * Now works with specialized billing account models
 */
const recalculateBillingAccountStatistics = async (userId) => {
  try {
    logger.info(`Recalculating billing statistics for user: ${userId}`);

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

    logger.info(`Updated billing account statistics:`, {
      totalCredits,
      totalDebits,
      userRole: user.role,
      accountType: billingAccount.constructor.modelName,
    });

    return billingAccount;
  } catch (error) {
    logger.error("Error recalculating billing statistics:", error);
    throw error;
  }
};

module.exports = {
  fixInstructorDirectTransferFees,
  fixStudentOutstandingBalances,
  recalculateBillingAccountStatistics
};
