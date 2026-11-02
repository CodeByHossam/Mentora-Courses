module.exports = {
  ...require('./bulkDeleteController'),
  ...require('./bulkDeleteSensitiveController'),
};

// Backward-compatible barrel.