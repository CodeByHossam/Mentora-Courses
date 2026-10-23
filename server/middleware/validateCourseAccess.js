// Validate course access
const Course = require("../models/Course");
const { NotFoundError, AuthorizationError } = require("../utils/errors");
const validateCourseAccess = async (courseId, user) => {
  const course = await Course.findById(courseId);
  if (!course) throw new NotFoundError("Course not found");

  const userId = user._id.toString();

  const isEnrolled = course.enrolledStudents.some(
    (id) => id.toString() === userId
  );
  const isCourseInstructor = course.instructor.toString() === userId;

  if (!isEnrolled && !isCourseInstructor && user.role !== "admin") {
    throw new AuthorizationError(
      "You are not enrolled in this course. Please enroll first."
    );
  }

  return course;
};
module.exports = validateCourseAccess;
