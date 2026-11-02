module.exports = {
  ...require('./gradeCrudController'),
  ...require('./gradeQueryController'),
};

// Import from this barrel only. Never deep-path into this folder.