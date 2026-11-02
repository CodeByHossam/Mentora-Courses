module.exports = {
  ...require('./studentRefundController'),
  ...require('./instructorRefundController'),
  ...require('./adminRefundController'),
};

// Import from this barrel only. Never deep-path into this folder.