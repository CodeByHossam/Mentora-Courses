const {
  getPendingRefunds,
  getAllRefunds,
  getRefundStats,
  getRefundDetails,
} = require('./adminRefundQueryController');
const {
  approveRefund,
  rejectRefund,
  cancelRefund,
} = require('./adminRefundDecisionController');

module.exports = {
  getPendingRefunds,
  approveRefund,
  rejectRefund,
  getAllRefunds,
  getRefundStats,
  getRefundDetails,
  cancelRefund,
};
