const { submitRequest } = require('./instructorRequestSubmissionController');
const { getRequests } = require('./instructorRequestQueryController');
const {
  updateRequest,
  deleteRequest,
  addNote,
  editNote,
  deleteNote,
} = require('./instructorRequestReviewController');

module.exports = {
  submitRequest,
  getRequests,
  updateRequest,
  deleteRequest,
  addNote,
  editNote,
  deleteNote,
};
