module.exports = {
  ...require('./messageQueryController'),
  ...require('./messageMutationController'),
};

// Import from this barrel only. Never deep-path into this folder.