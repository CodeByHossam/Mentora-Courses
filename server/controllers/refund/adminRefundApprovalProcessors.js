// Billing side effects of approved student/instructor refunds. Split from adminRefundController.js; bodies unchanged.

const BillingTransaction = require("../../models/BillingTransaction");
const { getBillingAccountByRole } = require("../../utils/specializedBillingUtils");

/**
 * Process student refund approval
 */

const processStudentRefundApproval = async (refundRequest, adminId) => {
  const studentId = refundRequest.requesterId._id;
  const refundAmount = refundRequest.requestedAmount;

  // Get billing accounts
  const studentAccount = await getBillingAccountByRole(studentId, "student");
  const adminAccount = await getBillingAccountByRole(adminId, "admin");

  // Create billing transaction for student refund
  const billingTransaction = new BillingTransaction({
    userId: studentId,
    type: "credit",
    amount: refundAmount,
    description: `Course refund - ${
      refundRequest.relatedCourse?.title || "Course"
    }`,
    category: "refund",
    status: "completed",
    balanceBefore: studentAccount.currentBalance,
    balanceAfter: studentAccount.currentBalance + refundAmount,
    relatedRefund: refundRequest._id,
    processedBy: adminId,
    processedAt: new Date(),
    metadata: {
      refundType: "course_purchase",
      originalPayment: refundRequest.relatedPayment?._id,
      courseId: refundRequest.relatedCourse,
    },
  });

  await billingTransaction.save();

  // Update student account
  studentAccount.availableCredits += refundAmount;
  studentAccount.statistics.totalRefundsReceived =
    (studentAccount.statistics.totalRefundsReceived || 0) + refundAmount;
  studentAccount.recalculateAll();
  await studentAccount.save();

  // Update admin account (platform expense)
  if (adminAccount) {
    adminAccount.totalRefundsIssued =
      (adminAccount.totalRefundsIssued || 0) + refundAmount;
    adminAccount.recalculateAll();
    await adminAccount.save();
  }

  return billingTransaction;
};

/**
 * Process instructor refund approval
 */

const processInstructorRefundApproval = async (refundRequest, adminId) => {
  const instructorId = refundRequest.requesterId._id;
  const refundAmount = refundRequest.requestedAmount;

  // Get billing accounts
  const instructorAccount = await getBillingAccountByRole(
    instructorId,
    "instructor"
  );
  const adminAccount = await getBillingAccountByRole(adminId, "admin");

  // Create billing transaction for instructor refund
  const billingTransaction = new BillingTransaction({
    userId: instructorId,
    type: "credit",
    amount: refundAmount,
    description: `Admin fee refund - Overpayment`,
    category: "refund",
    status: "completed",
    balanceBefore: instructorAccount.availableBalance,
    balanceAfter: instructorAccount.availableBalance + refundAmount,
    relatedRefund: refundRequest._id,
    processedBy: adminId,
    processedAt: new Date(),
    metadata: {
      refundType: "admin_fee_overpayment",
    },
  });

  await billingTransaction.save();

  // Update instructor account
  instructorAccount.availableBalance += refundAmount;
  instructorAccount.totalAdminFeesPaid = Math.max(
    0,
    (instructorAccount.totalAdminFeesPaid || 0) - refundAmount
  );
  instructorAccount.recalculateAll();
  await instructorAccount.save();

  // Update admin account
  if (adminAccount) {
    adminAccount.totalRefundsIssued =
      (adminAccount.totalRefundsIssued || 0) + refundAmount;
    adminAccount.recalculateAll();
    await adminAccount.save();
  }

  return billingTransaction;
};

module.exports = {
  processStudentRefundApproval,
  processInstructorRefundApproval
};
