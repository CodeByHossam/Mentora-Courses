const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema(
  {
    // Student and Course Information
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Grade Types
    gradeType: {
      type: String,
      enum: [
        "final_grade",
        "test_grade",
        "assignment_grade",
        "participation_grade",
      ],
      required: true,
    },

    // Final Course Grade (for overall course performance)
    finalGrade: {
      letter: {
        type: String,
        enum: [
          "A+",
          "A",
          "A-",
          "B+",
          "B",
          "B-",
          "C+",
          "C",
          "C-",
          "D+",
          "D",
          "F",
        ],
        required: function () {
          return this.gradeType === "final_grade";
        },
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        required: function () {
          return this.gradeType === "final_grade";
        },
      },
      gpa: {
        type: Number,
        min: 0,
        max: 4.0,
        required: function () {
          return this.gradeType === "final_grade";
        },
      },
    },

    // Test/Assignment Grade (for individual assessments)
    testGrade: {
      testId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
        required: function () {
          return this.gradeType === "test_grade";
        },
      },
      testName: {
        type: String,
        required: function () {
          return this.gradeType === "test_grade";
        },
      },
      testType: {
        type: String,
        enum: ["progress", "final"],
        required: function () {
          return this.gradeType === "test_grade";
        },
      },
      totalPoints: {
        type: Number,
        required: function () {
          return this.gradeType === "test_grade";
        },
        min: 0,
      },
      earnedPoints: {
        type: Number,
        required: function () {
          return this.gradeType === "test_grade";
        },
        min: 0,
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
        required: function () {
          return this.gradeType === "test_grade";
        },
      },
    },

    // Comment and Feedback
    Comment: {
      type: String,
      maxlength: 1000,
    },
    feedback: {
      type: String,
      maxlength: 2000,
    },

    // Status and Metadata
    status: {
      type: String,
      enum: ["draft", "published", "revised"],
      default: "draft",
    },
    isVisible: {
      type: Boolean,
      default: true,
    },

    // Timestamps
    gradedAt: {
      type: Date,
      default: Date.now,
    },
    publishedAt: {
      type: Date,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
gradeSchema.index({ studentId: 1, courseId: 1 });
gradeSchema.index({ courseId: 1, gradeType: 1 });
gradeSchema.index({ instructorId: 1, courseId: 1 });

// Virtual for calculated percentage (for test grades)
gradeSchema.virtual("calculatedPercentage").get(function () {
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
gradeSchema.methods.getLetterGrade = function (percentage) {
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
gradeSchema.methods.getGPA = function (letterGrade) {
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
gradeSchema.pre("save", function (next) {
  this.lastModified = new Date();

  // Calculate percentage for test grades
  if (this.gradeType === "test_grade") {
    console.log("Pre-save middleware - testGrade data:", {
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
      console.log("Calculated percentage:", this.testGrade.percentage);
    } else {
      console.log(
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

// Static method to get student's course summary
gradeSchema.statics.getStudentCourseSummary = async function (
  studentId,
  courseId
) {
  const grades = await this.find({
    studentId,
    courseId,
    status: "published",
  }).populate("testGrade.testId", "title testType");

  const finalGrade = grades.find((g) => g.gradeType === "final_grade");
  const testGrades = grades.filter((g) => g.gradeType === "test_grade");

  // Separate progress and final test grades
  const progressTests = testGrades.filter(
    (g) => g.testGrade.testType === "progress"
  );
  const finalTests = testGrades.filter((g) => g.testGrade.testType === "final");

  // Calculate progress tests average (simple average, no weights)
  let progressAverage = 0;
  if (progressTests.length > 0) {
    const totalPercentage = progressTests.reduce(
      (sum, grade) => sum + grade.testGrade.percentage,
      0
    );
    progressAverage =
      Math.round((totalPercentage / progressTests.length) * 100) / 100;
  }

  // Get final test result (should be only one)
  const finalTestResult =
    finalTests.length > 0 ? finalTests[0].testGrade.percentage : null;

  return {
    finalGrade: finalGrade || null,
    testGrades,
    progressTests,
    finalTests,
    progressAverage: progressTests.length > 0 ? progressAverage : null,
    finalTestResult,
    totalTests: testGrades.length,
    totalProgressTests: progressTests.length,
    totalFinalTests: finalTests.length,
  };
};

// Static method to get course grade statistics
gradeSchema.statics.getCourseStatistics = async function (courseId) {
  const pipeline = [
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        status: "published",
      },
    },
    {
      $group: {
        _id: "$gradeType",
        count: { $sum: 1 },
        averagePercentage: {
          $avg: {
            $cond: {
              if: { $eq: ["$gradeType", "final_grade"] },
              then: "$finalGrade.percentage",
              else: "$testGrade.percentage",
            },
          },
        },
        grades: { $push: "$$ROOT" },
      },
    },
  ];

  return await this.aggregate(pipeline);
};

module.exports = mongoose.model("Grade", gradeSchema);
