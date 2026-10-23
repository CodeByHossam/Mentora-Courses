const mongoose = require("mongoose");

const testAnswerSchema = new mongoose.Schema(
  {
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    answerFileUrl: {
      type: String,
      required: true,
    },
    grade: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    feedback: {
      type: String,
      trim: true,
      default: "",
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Optional: Prevent multiple submissions per student per test (unique index)
testAnswerSchema.index({ test: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("TestAnswer", testAnswerSchema);
