const { getReports } = require('./adminReportsQueryController');
const { getDeletionStatistics, bulkDeleteComment, bulkDeleteTests, protectedModelDeletion } = require('./adminReportsBulkDeleteController');

module.exports = {
  getReports,
  getDeletionStatistics,
  bulkDeleteComment,
  bulkDeleteTests,
  protectedModelDeletion,
};
