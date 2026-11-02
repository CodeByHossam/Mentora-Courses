// Receipt signed URLs and billing side effects of admin-fee approval. Split from adminFeeAdminController.js; bodies unchanged.

const logger = require('../../utils/logger');
const BillingTransaction = require("../../models/BillingTransaction");
const { getBillingAccountByRole } = require("../../utils/specializedBillingUtils");
const { getFile } = require("../../utils/aws");

/**
 * 🔄 HELPER FUNCTIONS
 */

/**
 * Get signed URL for receipt viewing
 */

const getReceiptSignedUrl = async (receiptKey) => {
  try {
    return await getFile(receiptKey, 3600); // 1 hour expiration
  } catch (error) {
    logger.error("Error generating signed URL:", error);
    throw new Error("Failed to generate receipt URL");
  }
};

/**
 * Process admin fee payment approval
 */

const processAdminFeePaymentApproval = async (
  payment,
  adminId,
  approvalNotes
) => {
  const instructorId = payment.instructorId._id;
  const paymentAmount = payment.paymentAmount;

  // Get billing accounts
  const instructorAccount = await getBillingAccountByRole(
    instructorId,
    "instructor"
  );
  const adminAccount = await getBillingAccountByRole(adminId, "admin");

  if (!instructorAccount) {
    throw new Error("Instructor billing account not found");
  }

  // Calculate actual payment allocation
  const currentOwedFees = instructorAccount.owedAdminFees || 0;
  const allocatedAmount = Math.min(paymentAmount, currentOwedFees);
  const excessAmount = Math.max(0, paymentAmount - currentOwedFees);

  // Process admin fee payment in instructor account
  const actualPayment = instructorAccount.processAdminFeePayment(
    allocatedAmount,
    `Admin fee payment - ${payment.description}`
  );

  // Update payment record with admin verification
  if (instructorAccount.feePayments.length > 0) {
    const lastPayment =
      instructorAccount.feePayments[instructorAccount.feePayments.length - 1];
    lastPayment.verifiedBy = adminId;
  }

  await instructorAccount.save();

  // Create billing transaction
  const billingTransaction = new BillingTransaction({
    userId: instructorId,
    type: "debit",
    amount: actualPayment,
    description: `Admin fee payment processed - ${payment.description}`,
    category: "admin_fee",
    status: "completed",
    balanceBefore: instructorAccount.availableBalance + actualPayment, // Before the payment was processed
    balanceAfter: instructorAccount.availableBalance,
    relatedAdminFeePayment: payment._id,
    processedBy: adminId,
    processedAt: new Date(),
    metadata: {
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      bankTransactionId: payment.bankTransactionId,
      receiptUrl: payment.receiptUrl,
    },
  });

  await billingTransaction.save();

  // Handle excess amount if any
  if (excessAmount > 0) {
    // Add excess as credit to instructor account
    instructorAccount.availableBalance += excessAmount;
    instructorAccount.adminCreditsAdded =
      (instructorAccount.adminCreditsAdded || 0) + excessAmount;
    instructorAccount.recalculateAll();
    await instructorAccount.save();

    // Create transaction for excess credit
    const excessTransaction = new BillingTransaction({
      userId: instructorId,
      type: "credit",
      amount: excessAmount,
      description: `Excess admin fee payment credited back`,
      category: "credit_addition",
      status: "completed",
      balanceBefore: instructorAccount.availableBalance - excessAmount,
      balanceAfter: instructorAccount.availableBalance,
      relatedAdminFeePayment: payment._id,
      processedBy: adminId,
      processedAt: new Date(),
      metadata: {
        excessFromPayment: paymentAmount,
        allocatedToFees: allocatedAmount,
      },
    });

    await excessTransaction.save();
  }

  // Update admin account
  if (adminAccount) {
    adminAccount.totalAdminFeesCollected =
      (adminAccount.totalAdminFeesCollected || 0) + actualPayment;
    adminAccount.recalculateAll();
    await adminAccount.save();
  }

  // Update payment record
  payment.approve(adminId, approvalNotes);
  payment.markProcessed(adminId, billingTransaction._id, actualPayment);
  await payment.save();

  logger.info("✅ Admin fee payment processed:", {
    paymentId: payment._id,
    instructorId,
    paymentAmount,
    allocatedAmount: actualPayment,
    excessAmount,
    newOwedFees: instructorAccount.owedAdminFees,
    newAvailableBalance: instructorAccount.availableBalance,
  });

  return {
    payment,
    billingTransaction,
    allocation: {
      allocatedAmount: actualPayment,
      excessAmount,
      newOwedFees: instructorAccount.owedAdminFees,
      newAvailableBalance: instructorAccount.availableBalance,
    },
  };
};

module.exports = {
  getReceiptSignedUrl,
  processAdminFeePaymentApproval
};
