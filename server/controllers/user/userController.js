module.exports = {
  ...require('./userCrudController'),
  ...require('./userQueryController'),
};

// Backward-compatible barrel.