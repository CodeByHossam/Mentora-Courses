const mongoose = require("mongoose");

const lessonSchema = mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please add a lesson title"],
    },
    description: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, "Please add a lesson duration in minutes"],
      min: 1,
    },
    image: {
      type: String,
    },
    videoRef: {
      publicId: { type: String },
      resourceType: { type: String, default: "video" },
      duration: { type: Number },
      format: { type: String },
      bytes: { type: Number },
      width: { type: Number },
      height: { type: Number },
      uploadedAt: { type: Date, default: Date.now },
    },
    content: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🔁 Virtual for Comment
lessonSchema.virtual("Comment", {
  ref: "Comment",
  localField: "_id",
  foreignField: "lesson",
  justOne: false,
});

// 🔁 Virtual for tests
lessonSchema.virtual("tests", {
  ref: "Test",
  localField: "_id",
  foreignField: "lesson",
  justOne: false,
});

// 🔁 Virtual for attachments
lessonSchema.virtual("attachments", {
  ref: "Attachment",
  localField: "_id",
  foreignField: "lesson",
  justOne: false,
});

module.exports = mongoose.model("Lesson", lessonSchema);
