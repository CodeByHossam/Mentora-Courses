const mongoose = require("mongoose");
const {
  COURSE_DEFAULTS,
  COURSE_LEVELS,
  COURSE_STATUSES,
} = require("./courseConstants");

const courseSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      minlength: [
        COURSE_DEFAULTS.MIN_TITLE_LENGTH,
        `Title must be at least ${COURSE_DEFAULTS.MIN_TITLE_LENGTH} characters long`,
      ],
      maxlength: [
        COURSE_DEFAULTS.MAX_TITLE_LENGTH,
        `Title cannot exceed ${COURSE_DEFAULTS.MAX_TITLE_LENGTH} characters`,
      ],
      validate: {
        validator: function (title) {
          // Ensure title contains meaningful content (not just spaces/special chars)
          return (
            /^[a-zA-Z0-9\s\-_.,!?()]+$/.test(title) &&
            title.trim().length >= COURSE_DEFAULTS.MIN_TITLE_LENGTH
          );
        },
        message: "Title must contain valid characters and meaningful content",
      },
    },

    description: {
      type: String,
      required: [true, "Course description is required"],
      trim: true,
      minlength: [
        COURSE_DEFAULTS.MIN_DESCRIPTION_LENGTH,
        `Description must be at least ${COURSE_DEFAULTS.MIN_DESCRIPTION_LENGTH} characters long`,
      ],
      maxlength: [
        COURSE_DEFAULTS.MAX_DESCRIPTION_LENGTH,
        `Description cannot exceed ${COURSE_DEFAULTS.MAX_DESCRIPTION_LENGTH} characters`,
      ],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Course category is required"],
      validate: {
        validator: function (categoryId) {
          return mongoose.Types.ObjectId.isValid(categoryId);
        },
        message: "Invalid category ID format",
      },
    },

    level: {
      type: String,
      required: [true, "Course level is required"],
      default: "General",
      enum: {
        values: COURSE_LEVELS,
        message: `Level must be one of: ${COURSE_LEVELS.join(", ")}`,
      },
    },

    price: {
      type: Number,
      required: [true, "Course price is required"],
      min: [
        COURSE_DEFAULTS.MIN_PRICE,
        `Price cannot be less than ${COURSE_DEFAULTS.MIN_PRICE}`,
      ],
      max: [
        COURSE_DEFAULTS.MAX_PRICE,
        `Price cannot exceed ${COURSE_DEFAULTS.MAX_PRICE}`,
      ],
      validate: {
        validator: function (price) {
          // Ensure price has at most 2 decimal places
          return (
            Number.isFinite(price) && /^\d+(\.\d{1,2})?$/.test(price.toString())
          );
        },
        message: "Price must be a valid number with at most 2 decimal places",
      },
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, "Discount percentage cannot be negative"],
      max: [100, "Discount percentage cannot exceed 100%"],
      validate: {
        validator: function (discount) {
          return (
            Number.isFinite(discount) &&
            /^\d+(\.\d{1,2})?$/.test(discount.toString())
          );
        },
        message:
          "Discount percentage must be a valid number with at most 2 decimal places",
      },
    },

    isFree: {
      type: Boolean,
      default: false,
    },

    topics: {
      type: [String],
      required: [true, "At least one topic is required"],
      validate: [
        {
          validator: function (topics) {
            return (
              topics &&
              topics.length > 0 &&
              topics.length <= COURSE_DEFAULTS.MAX_TOPICS
            );
          },
          message: `Must have 1-${COURSE_DEFAULTS.MAX_TOPICS} topics`,
        },
        {
          validator: function (topics) {
            // Ensure all topics are non-empty strings
            return topics.every(
              (topic) =>
                typeof topic === "string" &&
                topic.trim().length > 0 &&
                topic.trim().length <= 50
            );
          },
          message:
            "Each topic must be a non-empty string with maximum 50 characters",
        },
      ],
    },

    imageUrl: {
      type: String,
      default: COURSE_DEFAULTS.AVATAR,
      validate: {
        validator: function (url) {
          if (!url) return true; // Allow empty/default
          // Enhanced URL validation for various image services
          const urlPattern = /^https?:\/\/.+/i;
          const imageExtPattern = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
          const unsplashPattern = /unsplash\.com/i;
          const cloudinaryPattern = /cloudinary\.com/i;

          // Must be a valid HTTP/HTTPS URL
          if (!urlPattern.test(url)) return false;

          // Allow Unsplash URLs (they don't always end with image extensions)
          if (unsplashPattern.test(url)) return true;

          // Allow Cloudinary URLs (they don't always end with image extensions)
          if (cloudinaryPattern.test(url)) return true;

          // For other URLs, require image extension
          return imageExtPattern.test(url);
        },
        message:
          "Image URL must be a valid HTTP/HTTPS URL pointing to an image file",
      },
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Course instructor is required"],
      validate: {
        validator: function (instructorId) {
          return mongoose.Types.ObjectId.isValid(instructorId);
        },
        message: "Invalid instructor ID format",
      },
    },

    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Rating user is required"],
        },
        value: {
          type: Number,
          required: [true, "Rating value is required"],
          min: [1, "Rating must be at least 1"],
          max: [5, "Rating cannot exceed 5"],
          validate: {
            validator: function (rating) {
              return Number.isInteger(rating);
            },
            message: "Rating must be a whole number between 1 and 5",
          },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "Like user is required"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    students: {
      type: Number,
      default: 0,
      min: [0, "Student count cannot be negative"],
      validate: {
        validator: function (count) {
          return Number.isInteger(count);
        },
        message: "Student count must be a whole number",
      },
    },

    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        validate: {
          validator: function (studentId) {
            return mongoose.Types.ObjectId.isValid(studentId);
          },
          message: "Invalid student ID format",
        },
      },
    ],

    // 🔗 RELATIONSHIP ARRAYS - Added for proper data linking
    liveSessions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LiveSession",
      },
    ],

    tests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
      },
    ],

    Comment: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    payments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
      },
    ],

    enrollmentRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EnrollmentRequest",
      },
    ],

    status: {
      type: String,
      enum: {
        values: COURSE_STATUSES,
        message: `Status must be one of: ${COURSE_STATUSES.join(", ")}`,
      },
      default: "draft",
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    // Additional metadata fields
    publishedAt: {
      type: Date,
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // Optimize for common queries
    optimisticConcurrency: true,
  }
);

module.exports = courseSchema;
