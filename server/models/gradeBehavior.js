const logger = require("../utils/logger");

module.exports = function (schema) {
// Virtual for calculated percentage (for test grades)
schema.virtual("calculatedPercentage").get(function () {
  if (this.gradeType === "test_grade" && this.testGrade.totalPoints > 0) {
    return (
      Math.round(
        (this.testGrade.earnedPoints / this.testGrade.totalPoints) * 100 * 100
      ) / 100
    );
  }
  return this.testGrade?.percentage || this.finalGrade?.percentage || 0;
});

// Method to convert percentage to letter grade
schema.methods.getLetterGrade = function (percentage) {
  if (percentage >= 97) return "A+";
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 60) return "D";
  return "F";
};

// Method to convert letter grade to GPA
schema.methods.getGPA = function (letterGrade) {
  const gpaScale = {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    F: 0.0,
  };
  return gpaScale[letterGrade] || 0.0;
};

// Pre-save middleware to calculate derived values
schema.pre("save", function (next) {
  this.lastModified = new Date();

  // Calculate percentage for test grades
  if (this.gradeType === "test_grade") {
    logger.info("Pre-save middleware - testGrade data:", {
      totalPoints: this.testGrade.totalPoints,
      earnedPoints: this.testGrade.earnedPoints,
      totalPointsType: typeof this.testGrade.totalPoints,
      earnedPointsType: typeof this.testGrade.earnedPoints,
    });

    if (this.testGrade.totalPoints > 0) {
      this.testGrade.percentage =
        Math.round(
          (this.testGrade.earnedPoints / this.testGrade.totalPoints) * 100 * 100
        ) / 100;
      logger.info("Calculated percentage:", this.testGrade.percentage);
    } else {
      logger.info(
        "Cannot calculate percentage - totalPoints is 0 or undefined"
      );
    }
  }

  // Calculate letter grade and GPA for final grades
  if (
    this.gradeType === "final_grade" &&
    this.finalGrade.percentage !== undefined
  ) {
    this.finalGrade.letter = this.getLetterGrade(this.finalGrade.percentage);
    this.finalGrade.gpa = this.getGPA(this.finalGrade.letter);
  }

  // Set published date when status changes to published
  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});
};
