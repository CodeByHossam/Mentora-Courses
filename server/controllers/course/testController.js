// Test controller barrel. Split from the original monolithic testController.js;
// function bodies are unchanged. The model/middleware imports below are kept so
// the original module load behaviour is unchanged.
const logger = require('../../utils/logger');
const Comment = require("../../models/Comment");
const Test = require("../../models/Test");
const TestAnswer = require("../../models/TestAnswer");
const Attachment = require("../../models/Attachment");
const validateCourseAccess = require("../../middleware/validateCourseAccess");
const { uploadFile, getFile, deleteFile } = require("../../utils/aws");

const {
  NotFoundError,
  AuthorizationError,
  ValidationError,
} = require("../../utils/errors");

const {
  addTest,
  editTest,
  deleteTest,
} = require('./testAuthoringController');
const {
  uploadAnswerKey,
  downloadAnswerKey,
} = require('./testAnswerKeyController');
const {
  submitTestAnswer,
  gradeTestSubmission,
  deleteTestAnswer,
} = require('./testSubmissionController');

module.exports = {
  addTest,
  editTest,
  deleteTest,
  uploadAnswerKey,
  downloadAnswerKey,
  submitTestAnswer,
  gradeTestSubmission,
  deleteTestAnswer,
};
