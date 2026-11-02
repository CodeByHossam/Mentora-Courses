module.exports = {
  ...require('./userCrudController'),
  ...require('./userQueryController'),
};

// Import from this barrel only. Never deep-path into this folder.