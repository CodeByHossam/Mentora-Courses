const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User", // adjust this to your actual user model name
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Commentchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    course: {
      type: mongoose.Schema.ObjectId,
      ref: "Course", // adjust to match your course model
      required: true,
    },
    lesson: {
      type: mongoose.Schema.ObjectId,
      ref: "Lesson", // adjust to match your lesson model
      required: false, // Make lesson optional for course-level Comment
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User", // the user who made the comment
      required: true,
    },
    responses: [responseSchema], // nested replies
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Comment", Commentchema);
