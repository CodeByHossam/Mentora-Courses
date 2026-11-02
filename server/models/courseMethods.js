module.exports = function (schema) {
/* =========================================================
   INSTANCE METHODS
   
   Custom methods available on course document instances.
========================================================= */

// Method to check if a user has rated this course
schema.methods.hasUserRated = function (userId) {
  return this.ratings.some(
    (rating) => rating.user.toString() === userId.toString()
  );
};

// Method to check if a user has liked this course
schema.methods.hasUserLiked = function (userId) {
  return this.likes.some((like) => like.user.toString() === userId.toString());
};

// Method to check if a user is enrolled in this course
schema.methods.isUserEnrolled = function (userId) {
  return this.enrolledStudents.some(
    (studentId) => studentId.toString() === userId.toString()
  );
};

// Method to get user's rating for this course
schema.methods.getUserRating = function (userId) {
  const rating = this.ratings.find(
    (rating) => rating.user.toString() === userId.toString()
  );
  return rating ? rating.value : null;
};
};
