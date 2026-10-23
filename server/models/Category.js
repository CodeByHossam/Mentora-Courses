const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a category name"],
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    icon: {
      type: String,
      required: [true, "Please add an icon"],
      default: "book",
    },
    imageUrl: {
      type: String,
      required: [true, "Please add an image URL"],
      default: "https://placehold.co/600x400?text=Category",
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    courseCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add index for name for better query performance
categorySchema.index({ name: 1 });

module.exports = mongoose.model("Category", categorySchema);
