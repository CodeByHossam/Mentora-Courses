const { getCourseGrades, getCourseTests } = require('./gradeCourseQueryController');
const { getStudentGrades, getAllStudentGrades } = require('./gradeStudentQueryController');

module.exports = {
  getCourseGrades,
  getStudentGrades,
  getAllStudentGrades,
  getCourseTests,
};
