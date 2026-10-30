const { enrollInCourse } = require('./courseEnrollment_enrollInCourse');
const { getCourseStats } = require('./courseEnrollment_getCourseStats');
const { getInstructorCourses } = require('./courseEnrollment_getInstructorCourses');
const { getEnrolledCourses } = require('./courseEnrollment_getEnrolledCourses');
const { rateCourse } = require('./courseEnrollment_rateCourse');
const { likeCourse } = require('./courseEnrollment_likeCourse');
const { getCourseRatingInfo } = require('./courseEnrollment_getCourseRatingInfo');
const { updateCourseStatus } = require('./courseEnrollment_updateCourseStatus');
const { getAllCourses } = require('./courseEnrollment_getAllCourses');
const { getCourseStudents } = require('./courseEnrollment_getCourseStudents');

module.exports = {
  enrollInCourse,
  getCourseStats,
  getInstructorCourses,
  getEnrolledCourses,
  rateCourse,
  likeCourse,
  getCourseRatingInfo,
  updateCourseStatus,
  getAllCourses,
  getCourseStudents,
};
