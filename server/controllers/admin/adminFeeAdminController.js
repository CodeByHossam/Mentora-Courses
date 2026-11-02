const {
  getPendingPayments,
  verifyPayment,
  approvePayment,
  rejectPayment,
} = require('./adminFeeReviewController');
const {
  getAdminFeePaymentStats,
  getAllAdminFeePayments,
} = require('./adminFeeReportController');

module.exports = {
  getPendingPayments,
  verifyPayment,
  approvePayment,
  rejectPayment,
  getAdminFeePaymentStats,
  getAllAdminFeePayments,
};
