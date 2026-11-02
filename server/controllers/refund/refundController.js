module.exports = {
  ...require('./studentRefundController'),
  ...require('./instructorRefundController'),
  ...require('./adminRefundController'),
};

// Backward-compatible barrel.