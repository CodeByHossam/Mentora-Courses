const { getBillingAccount, getAdminBillingAccount } = require('./billingAccountQueryController');
const { payoutInstructorCommission } = require('./billingCommissionController');

module.exports = {
  getBillingAccount,
  getAdminBillingAccount,
  payoutInstructorCommission,
};
