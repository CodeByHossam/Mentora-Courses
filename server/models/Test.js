const mongoose = require("mongoose");
const validator = require("validator");

const SubmissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  answerFileUrl: {
    type: String,
    required: true,
    validate: {
      validator: (v) => validator.isURL(v),
      message: "Invalid answer file URL",
    },
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  grade: {
    type: Number,
    min: [0, "Grade cannot be less than 0"],
    max: [100, "Grade cannot exceed 100"],
  },
  feedback: {
    type: String,
    maxlength: [2000, "Feedback cannot exceed 2000 characters"],
  },
  gradedAt: {
    type: Date,
  },
});

const TestSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, "Test title must be at least 3 characters long"],
      maxlength: [200, "Test title cannot exceed 200 characters"],
    },
    testType: {
      type: String,
      enum: ['progress', 'final'],
      default: 'progress',
      required: true,
      comment: 'Type of test: progress (for regular tests) or final (for final exam)'
    },
    totalPoints: {
      type: Number,
      required: true,
      default: 100,
      min: [1, "Total points must be at least 1"],
      max: [1000, "Total points cannot exceed 1000"],
      comment: 'Maximum score/points for this test'
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    fileUrl: {
      type: String,
      required: true,
    },
    answerKey: {
      type: String,
      required: false,
      comment: 'S3 key for the answer key file (optional)'
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      validate: {
        validator: (v) => !v || v > Date.now(),
        message: "Due date must be in the future",
      },
    },
    submissions: [SubmissionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Test", TestSchema);
