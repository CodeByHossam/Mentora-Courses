// utils/billingEngine.js
// Thin wrapper around specialized billing utilities.
// Intent: centralize billing entry points and prepare deprecation of legacy billingUtils.js
// Phase: Transitional. Prefer importing from this module moving forward.

const specialized = require('./specializedBillingUtils');

// Re-export selective APIs that should be considered stable entry points
module.exports = {
  // Accounts
  getBillingAccountByRole: specialized.getBillingAccountByRole,
  getOrCreateAdminAccount: specialized.getOrCreateAdminAccount,

  // Transactions (audit trail helpers)
  createBillingTransactions: specialized.createBillingTransactions,

  // High-level processing (legacy compatibility; consider replacing with Payment.completePayment())
  processCoursePurchase: specialized.processCoursePurchase,

  // Aggregations / reports (if present)
  reconcileAllAccounts: specialized.reconcileAllAccounts,
};
