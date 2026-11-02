module.exports = {
  ...require('./courseController'),
  ...require('./courseUpdateController'),
  ...require('./courseEnrollmentController'),
  ...require('./courseInteractionController'),
  ...require('./commentController'),
  ...require('./testController'),
  ...require('./attachmentController'),
};

// Import from this barrel only. Never deep-path into this folder.