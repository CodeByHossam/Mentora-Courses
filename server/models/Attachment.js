const mongoose = require("mongoose");
const validator = require("validator");

const AttachmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Attachment title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: false,
      validate: {
        validator: (v) => !v || mongoose.Types.ObjectId.isValid(v),
        message: "Invalid lesson ID",
      },
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [1, "File size must be at least 1 byte"],
    },
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Uploader ID is required"],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Attachment", AttachmentSchema);
