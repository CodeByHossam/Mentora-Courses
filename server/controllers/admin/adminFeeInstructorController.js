const { submitAdminFeePayment } = require('./adminFeeInstructorSubmissionController');
const { getInstructorPayments, getOutstandingAdminFees } = require('./adminFeeInstructorQueryController');
const { cancelAdminFeePayment } = require('./adminFeeInstructorCancelController');

module.exports = {
  submitAdminFeePayment,
  getInstructorPayments,
  getOutstandingAdminFees,
  cancelAdminFeePayment,
};
