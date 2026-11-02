module.exports = {
  ...require('./enrollmentRequestCrudController'),
  ...require('./enrollmentRequestAdminController'),
  ...require('./enrollmentAdminNoteController'),
};

// Import from this barrel only. Never deep-path into this folder.