const {
  createPayment,
  getStudentPayments,
  deletePayment,
  updatePayment,
} = require('./paymentCoreController');
const { getPaymentReports } = require('./paymentReportController');
const {
  getPaymentStats,
  getPaymentBreakdown,
} = require('./paymentBreakdownController');
const {
  initiatePayment,
  confirmStripePayment,
} = require('./paymentInitiationController');
const { confirmPayPalPayment } = require('./paymentPaypalController');
const {
  handleDirectTransfer,
  approveDirectTransferPayment,
} = require('./paymentTransferFlowController');
const {
  instructorApproveDirectTransfer,
  approveDirectTransfer,
  rejectDirectTransfer,
} = require('./paymentTransferApprovalController');
const {
  getPendingDirectTransfers,
  getInstructorPendingTransfers,
  submitDirectTransfer,
  verifyPayment,
} = require('./paymentTransferQueryController');
const {
  checkStripePaymentStatus,
  getPendingStripePayments,
} = require('./paymentStripeStatusController');
const {
  getAllPayments,
  getUserPayments,
  getUserBills,
  getUserPaymentsAndBills,
  checkPaymentStatus,
} = require('./paymentQueryController');
const { getPaymentReceipt } = require('./paymentReceiptController');
const {
  initiateCreditPayment,
  getUserBillingSummary,
  processAnnualFeesEndpoint,
} = require('./paymentBillingController');
const {
  processAdminFeePayment,
  uploadAdminFeeReceipt,
} = require('./paymentAdminFeeController');
const { createCreditPaymentMiddleware } = require('../../utils/billingUtils');

module.exports = {
  createPayment,
  getStudentPayments,
  deletePayment,
  updatePayment,
  getPaymentStats,
  getPaymentReports,
  getPaymentBreakdown,
  initiatePayment,
  verifyPayment,
  confirmStripePayment,
  confirmPayPalPayment,
  handleDirectTransfer,
  approveDirectTransferPayment,
  getAllPayments,
  getUserPayments,
  getUserBills,
  getUserPaymentsAndBills,
  getPendingDirectTransfers,
  approveDirectTransfer,
  rejectDirectTransfer,
  submitDirectTransfer,
  getInstructorPendingTransfers,
  instructorApproveDirectTransfer,
  initiateCreditPayment,
  getUserBillingSummary,
  processAnnualFeesEndpoint,
  checkPaymentStatus,
  createCreditPaymentMiddleware,
  checkStripePaymentStatus,
  getPendingStripePayments,
  getPaymentReceipt,
  processAdminFeePayment,
  uploadAdminFeeReceipt,
};
