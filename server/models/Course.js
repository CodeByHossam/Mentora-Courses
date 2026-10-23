/**
 * Course Model
 *
 * Defines the schema for course documents in the database.
 * Includes comprehensive validation, virtual fields, and indexing for optimal performance.
 *
 * Features:
 * - Comprehensive field validation with custom error messages
 * - Virtual fields for calculated properties (ratings, duration, etc.)
 * - Proper indexing for search and filtering performance
 * - Automatic timestamp management
 * - Status management with backward compatibility
 */

const mongoose = require("mongoose");

// Constants for default values and validation
const COURSE_DEFAULTS = {
  AVATAR: `${
    process.env.SERVER_URL || "http://localhost:5000"
  }/images/course-default.png`,
  MIN_PRICE: 0,
  MAX_PRICE: 10000,
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TOPICS: 10,
};

const COURSE_LEVELS = ["General", "Beginner", "Intermediate", "Advanced"];
const COURSE_STATUSES = ["draft", "published", "archived"];

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

/* =========================================================
   VIRTUAL FIELDS
   
   Computed properties that are not stored in the database
   but calculated dynamically when accessed.
========================================================= */

// Virtual for associated lessons
courseSchema.virtual("lessons", {
  ref: "Lesson",
  localField: "_id",
  foreignField: "course",
  justOne: false,
});

// Virtual for calculated average rating
courseSchema.virtual("averageRating").get(function () {
  if (!this.ratings || this.ratings.length === 0) return 0;

  const sum = this.ratings.reduce((acc, rating) => acc + rating.value, 0);
  const average = sum / this.ratings.length;

  // Round to 1 decimal place
  return Math.round(average * 10) / 10;
});

// Virtual for total ratings count
courseSchema.virtual("ratingsCount").get(function () {
  return this.ratings ? this.ratings.length : 0;
});

// Virtual for total likes count
courseSchema.virtual("likesCount").get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual for total course duration (calculated from lessons)
courseSchema.virtual("totalDuration").get(function () {
  if (!this.lessons || this.lessons.length === 0) return "0m";

  // Calculate total duration from populated lessons
  const totalMinutes = this.lessons.reduce((acc, lesson) => {
    if (typeof lesson === "object" && lesson.duration) {
      return acc + (typeof lesson.duration === "number" ? lesson.duration : 0);
    }
    return acc;
  }, 0);

  // Format duration as "Xh Ym" or "Ym"
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
});

// Virtual for lesson count
courseSchema.virtual("lessonCount").get(function () {
  return this.lessons ? this.lessons.length : 0;
});

// Virtual for final price after discount
courseSchema.virtual("finalPrice").get(function () {
  if (this.isFree) return 0;

  const discount = this.discountPercentage || 0;
  const discountAmount = (this.price * discount) / 100;
  const finalPrice = this.price - discountAmount;

  // Round to 2 decimal places
  return Math.round(finalPrice * 100) / 100;
});

/* =========================================================
   MIDDLEWARE HOOKS
   
   Pre and post hooks for document lifecycle events.
========================================================= */

// Pre-save middleware for data validation and normalization
courseSchema.pre("save", function (next) {
  try {
    // Ensure imageUrl has a default value
    if (!this.imageUrl) {
      this.imageUrl = COURSE_DEFAULTS.AVATAR;
    }

    // Sync isPublished with status for backward compatibility
    this.isPublished = this.status === "published";

    // Set publishedAt timestamp when course is published
    if (this.status === "published" && !this.publishedAt) {
      this.publishedAt = new Date();
    }

    // Set archivedAt timestamp when course is archived
    if (this.status === "archived" && !this.archivedAt) {
      this.archivedAt = new Date();
    }

    // Reset timestamps if status changes away from published/archived
    if (this.status !== "published") {
      this.publishedAt = null;
    }
    if (this.status !== "archived") {
      this.archivedAt = null;
    }

    // Normalize topics (trim whitespace and remove duplicates)
    if (this.topics && Array.isArray(this.topics)) {
      this.topics = [
        ...new Set(this.topics.map((topic) => topic.trim()).filter(Boolean)),
      ];
    }

    // Sync students count with enrolledStudents array length
    if (this.enrolledStudents) {
      this.students = this.enrolledStudents.length;
    }

    // Handle isFree logic - if course is free, set price to 0 and discount to 0
    if (this.isFree) {
      this.price = 0;
      this.discountPercentage = 0;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-validate middleware for additional validation
courseSchema.pre("validate", function (next) {
  try {
    // Ensure no duplicate ratings from the same user
    if (this.ratings && this.ratings.length > 0) {
      const userIds = this.ratings.map((rating) => rating.user.toString());
      const uniqueUserIds = new Set(userIds);

      if (userIds.length !== uniqueUserIds.size) {
        return next(
          new Error("A user cannot rate the same course multiple times")
        );
      }
    }

    // Ensure no duplicate likes from the same user
    if (this.likes && this.likes.length > 0) {
      const userIds = this.likes.map((like) => like.user.toString());
      const uniqueUserIds = new Set(userIds);

      if (userIds.length !== uniqueUserIds.size) {
        return next(
          new Error("A user cannot like the same course multiple times")
        );
      }
    }

    // Ensure no duplicate enrolled students
    if (this.enrolledStudents && this.enrolledStudents.length > 0) {
      const studentIds = this.enrolledStudents.map((id) => id.toString());
      const uniqueStudentIds = new Set(studentIds);

      if (studentIds.length !== uniqueStudentIds.size) {
        return next(new Error("Duplicate student enrollments are not allowed"));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   DATABASE INDEXES
   
   Optimized indexes for common query patterns and performance.
========================================================= */

// Text search index for title and description
courseSchema.index(
  {
    title: "text",
    description: "text",
  },
  {
    weights: { title: 10, description: 5 },
    name: "course_text_search",
  }
);

// Compound indexes for common filter combinations
courseSchema.index({ status: 1, category: 1 });
courseSchema.index({ status: 1, level: 1 });
courseSchema.index({ status: 1, price: 1 });
courseSchema.index({ instructor: 1, status: 1 });

// Single field indexes for frequent queries
courseSchema.index({ category: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ enrolledStudents: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ updatedAt: -1 });

// Sparse indexes for optional fields
courseSchema.index({ publishedAt: -1 }, { sparse: true });
courseSchema.index({ archivedAt: -1 }, { sparse: true });

/* =========================================================
   INSTANCE METHODS
   
   Custom methods available on course document instances.
========================================================= */

// Method to check if a user has rated this course
courseSchema.methods.hasUserRated = function (userId) {
  return this.ratings.some(
    (rating) => rating.user.toString() === userId.toString()
  );
};

// Method to check if a user has liked this course
courseSchema.methods.hasUserLiked = function (userId) {
  return this.likes.some((like) => like.user.toString() === userId.toString());
};

// Method to check if a user is enrolled in this course
courseSchema.methods.isUserEnrolled = function (userId) {
  return this.enrolledStudents.some(
    (studentId) => studentId.toString() === userId.toString()
  );
};

// Method to get user's rating for this course
courseSchema.methods.getUserRating = function (userId) {
  const rating = this.ratings.find(
    (rating) => rating.user.toString() === userId.toString()
  );
  return rating ? rating.value : null;
};

module.exports = mongoose.model("Course", courseSchema);
