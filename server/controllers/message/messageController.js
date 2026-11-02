module.exports = {
  ...require('./messageQueryController'),
  ...require('./messageMutationController'),
};

// Backward-compatible barrel.