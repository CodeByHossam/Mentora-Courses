module.exports = {
  ...require('./bulkDeleteController'),
  ...require('./bulkDeleteSensitiveController'),
  ...require('./adminFeeInstructorController'),
  ...require('./adminFeeAdminController'),
  ...require('./adminUserManagementController'),
  ...require('./adminReportsController'),
  ...require('./adminSettingsController'),
};

// Import from this barrel only. Never deep-path into this folder.