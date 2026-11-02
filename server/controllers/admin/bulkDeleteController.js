const { getDeletionStatistics } = require('./bulkDeleteStatisticsController');
const {
  bulkDeleteComment,
  bulkDeleteTests,
  bulkDeleteNotifications,
  bulkDeleteMessages,
} = require('./bulkDeleteContentController');
const {
  bulkDeleteLiveSessions,
  bulkDeleteCertificates,
  bulkDeleteEnrollmentRequests,
} = require('./bulkDeleteSessionDataController');
const {
  protectedModelDeletion,
  bulkDeleteAllNonCritical,
} = require('./bulkDeleteAllController');

module.exports = {
  getDeletionStatistics,
  bulkDeleteComment,
  bulkDeleteTests,
  bulkDeleteNotifications,
  bulkDeleteMessages,
  bulkDeleteLiveSessions,
  bulkDeleteCertificates,
  bulkDeleteEnrollmentRequests,
  protectedModelDeletion,
  bulkDeleteAllNonCritical,
};
