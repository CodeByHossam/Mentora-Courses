const { createLiveSession } = require('./liveSessionCreateController');
const {
  getSessionsByCourse,
  getLiveSession,
} = require('./liveSessionLookupController');
const {
  getInstructorSessions,
  getStudentSessions,
  getAllLiveSessions,
} = require('./liveSessionListController');
const {
  updateLiveSession,
  deleteLiveSession,
  cancelLiveSession,
} = require('./liveSessionMutationController');

module.exports = {
  createLiveSession,
  getSessionsByCourse,
  getInstructorSessions,
  getStudentSessions,
  getLiveSession,
  updateLiveSession,
  deleteLiveSession,
  getAllLiveSessions,
  cancelLiveSession,
};
