module.exports = {
  ...require('./authCoreController'),
  ...require('./authProfileController'),
};

// Import from this barrel only. Never deep-path into this folder.