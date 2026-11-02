const { COURSE_DEFAULTS } = require("./courseConstants");
module.exports = function (schema) {
/* =========================================================
   MIDDLEWARE HOOKS
   
   Pre and post hooks for document lifecycle events.
========================================================= */

// Pre-save middleware for data validation and normalization
schema.pre("save", function (next) {
  try {
    // Ensure imageUrl has a default value
    if (!this.imageUrl) {
      this.imageUrl = COURSE_DEFAULTS.AVATAR;
    }

    // Sync isPublished with status for backward compatibility
    this.isPublished = this.status === "published";

    // Set publishedAt timestamp when course is published
    if (this.status === "published" && !this.publishedAt) {
      this.publishedAt = new Date();
    }

    // Set archivedAt timestamp when course is archived
    if (this.status === "archived" && !this.archivedAt) {
      this.archivedAt = new Date();
    }

    // Reset timestamps if status changes away from published/archived
    if (this.status !== "published") {
      this.publishedAt = null;
    }
    if (this.status !== "archived") {
      this.archivedAt = null;
    }

    // Normalize topics (trim whitespace and remove duplicates)
    if (this.topics && Array.isArray(this.topics)) {
      this.topics = [
        ...new Set(this.topics.map((topic) => topic.trim()).filter(Boolean)),
      ];
    }

    // Sync students count with enrolledStudents array length
    if (this.enrolledStudents) {
      this.students = this.enrolledStudents.length;
    }

    // Handle isFree logic - if course is free, set price to 0 and discount to 0
    if (this.isFree) {
      this.price = 0;
      this.discountPercentage = 0;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-validate middleware for additional validation
schema.pre("validate", function (next) {
  try {
    // Ensure no duplicate ratings from the same user
    if (this.ratings && this.ratings.length > 0) {
      const userIds = this.ratings.map((rating) => rating.user.toString());
      const uniqueUserIds = new Set(userIds);

      if (userIds.length !== uniqueUserIds.size) {
        return next(
          new Error("A user cannot rate the same course multiple times")
        );
      }
    }

    // Ensure no duplicate likes from the same user
    if (this.likes && this.likes.length > 0) {
      const userIds = this.likes.map((like) => like.user.toString());
      const uniqueUserIds = new Set(userIds);

      if (userIds.length !== uniqueUserIds.size) {
        return next(
          new Error("A user cannot like the same course multiple times")
        );
      }
    }

    // Ensure no duplicate enrolled students
    if (this.enrolledStudents && this.enrolledStudents.length > 0) {
      const studentIds = this.enrolledStudents.map((id) => id.toString());
      const uniqueStudentIds = new Set(studentIds);

      if (studentIds.length !== uniqueStudentIds.size) {
        return next(new Error("Duplicate student enrollments are not allowed"));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});
};
