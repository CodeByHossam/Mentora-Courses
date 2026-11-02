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

module.exports = gradeSchema;
