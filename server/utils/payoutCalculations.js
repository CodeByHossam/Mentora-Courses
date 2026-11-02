const logger = require('./logger');

const calculateAdminFees = (amount, adminPercentage = 10, adminFeeFixed = 0) => {
  const percentageFee = (amount * adminPercentage) / 100;
  const totalAdminFee = percentageFee + adminFeeFixed;
  const instructorAmount = amount - totalAdminFee;

  return {
    originalAmount: amount,
    adminPercentage,
    adminFeeFixed,
    adminFeePercentage: percentageFee,
    totalAdminFee,
    instructorAmount,
    netAmount: instructorAmount
  };
};

/**
 * Process direct transfer payment
 * For direct transfers, the instructor receives the full amount but owes admin fees
 * @param {Object} payment - Payment object
 * @param {Object} instructor - Instructor user object
 * @returns {Object} Processing result
 */

module.exports = {
  calculateAdminFees
};
