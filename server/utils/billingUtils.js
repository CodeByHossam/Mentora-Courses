const specialized = require('./specializedBillingUtils');
const { processAnnualFees } = require('./billingFeeProcessing');
const {
  createBillingTransactionForCoursePayment,
  createCreditPaymentMiddleware,
  enableSpecializedBilling,
  disableSpecializedBilling,
} = require('./billingCoursePayment');
const {
  recalculateBillingAccountStatistics,
  fixStudentOutstandingBalances,
  fixInstructorDirectTransferFees,
} = require('./billingMaintenance');

// Import from this barrel only. Never deep-path into the specialized modules.

module.exports = {
  createBillingTransactionForCoursePayment,
  getBillingSummary: specialized.getBillingSummary,
  processCoursePurchase: specialized.processCoursePurchase,
  getOrCreateBillingAccount: specialized.getOrCreateBillingAccount,
  getOrCreateAdminAccount: specialized.getOrCreateAdminAccount,
  checkAndUpdateAccountStatus: specialized.checkAndUpdateAccountStatus,
  processAnnualFees,
  recalculateBillingAccountStatistics,
  fixStudentOutstandingBalances,
  fixInstructorDirectTransferFees,
  createCreditPaymentMiddleware,
  enableSpecializedBilling,
  disableSpecializedBilling,
  // Export specialized utilities for direct access
  getBillingAccountByRole: specialized.getBillingAccountByRole,
  processSpecializedCoursePurchase: specialized.processCoursePurchase,
};
