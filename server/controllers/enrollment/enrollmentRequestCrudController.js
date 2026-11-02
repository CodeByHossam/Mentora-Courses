const { createEnrollmentRequest } = require('./enrollmentRequestCreateController');
const {
  getEnrollmentRequests,
  getUserEnrollmentRequests,
  getInstructorEnrollmentRequests,
  getEnrollmentRequest,
} = require('./enrollmentRequestQueryController');
const {
  updateEnrollmentRequest,
  deleteEnrollmentRequest,
} = require('./enrollmentRequestMutationController');

module.exports = {
  createEnrollmentRequest,
  getEnrollmentRequests,
  updateEnrollmentRequest,
  getUserEnrollmentRequests,
  getInstructorEnrollmentRequests,
  deleteEnrollmentRequest,
  getEnrollmentRequest,
};
