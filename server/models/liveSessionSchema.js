/**
 * Live Session Model
 * 
 * Defines the schema for live session documents in the database.
 * Includes comprehensive validation, virtual fields, and indexing for optimal performance.
 * 
 * Features:
 * - Session scheduling and management
 * - Zoom integration support
 * - Recording management
 * - Participant tracking
 * - Status management
 */

const mongoose = require("mongoose");
const { SESSION_DEFAULTS, SESSION_STATUSES, SESSION_TYPES } = require("./liveSessionConstants");

const liveSessionSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
      minlength: [SESSION_DEFAULTS.MIN_TITLE_LENGTH, `Title must be at least ${SESSION_DEFAULTS.MIN_TITLE_LENGTH} characters long`],
      maxlength: [SESSION_DEFAULTS.MAX_TITLE_LENGTH, `Title cannot exceed ${SESSION_DEFAULTS.MAX_TITLE_LENGTH} characters`],
      validate: {
        validator: function(title) {
          return /^[a-zA-Z0-9\s\-_.,!?()]+$/.test(title) && title.trim().length >= SESSION_DEFAULTS.MIN_TITLE_LENGTH;
        },
        message: "Title must contain valid characters and meaningful content"
      }
    },
    
    description: {
      type: String,
      required: [true, "Session description is required"],
      trim: true,
      minlength: [SESSION_DEFAULTS.MIN_DESCRIPTION_LENGTH, `Description must be at least ${SESSION_DEFAULTS.MIN_DESCRIPTION_LENGTH} characters long`],
      maxlength: [SESSION_DEFAULTS.MAX_DESCRIPTION_LENGTH, `Description cannot exceed ${SESSION_DEFAULTS.MAX_DESCRIPTION_LENGTH} characters`]
    },
    
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
      validate: {
        validator: function(courseId) {
          return mongoose.Types.ObjectId.isValid(courseId);
        },
        message: "Invalid course ID format"
      }
    },
    
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Instructor is required"],
      validate: {
        validator: function(instructorId) {
          return mongoose.Types.ObjectId.isValid(instructorId);
        },
        message: "Invalid instructor ID format"
      }
    },
    
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
      validate: {
        validator: function(date) {
          // Only validate scheduling time for new documents
          if (this.isNew) {
            // Session must be scheduled at least 1 hour in the future
            const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
            return date > oneHourFromNow;
          }
          // For existing documents, just ensure it's a valid date
          return date instanceof Date && !isNaN(date);
        },
        message: "Session must be scheduled at least 1 hour in advance"
      }
    },
    
    duration: {
      type: Number, // Duration in minutes
      required: [true, "Session duration is required"],
      min: [SESSION_DEFAULTS.MIN_DURATION, `Duration must be at least ${SESSION_DEFAULTS.MIN_DURATION} minutes`],
      max: [SESSION_DEFAULTS.MAX_DURATION, `Duration cannot exceed ${SESSION_DEFAULTS.MAX_DURATION} minutes`],
      validate: {
        validator: function(duration) {
          return Number.isInteger(duration) && duration % 15 === 0; // Must be in 15-minute increments
        },
        message: "Duration must be a whole number in 15-minute increments"
      }
    },
    
    sessionType: {
      type: String,
      enum: {
        values: SESSION_TYPES,
        message: `Session type must be one of: ${SESSION_TYPES.join(', ')}`
      },
      default: "lecture"
    },
    
    status: {
      type: String,
      enum: {
        values: SESSION_STATUSES,
        message: `Status must be one of: ${SESSION_STATUSES.join(', ')}`
      },
      default: "scheduled"
    },
    
    // Zoom integration fields
    zoomMeetingId: {
      type: String,
      default: null,
      validate: {
        validator: function(meetingId) {
          if (!meetingId) return true; // Allow null/empty
          return /^\d{9,11}$/.test(meetingId); // Zoom meeting IDs are 9-11 digits
        },
        message: "Invalid Zoom meeting ID format"
      }
    },
    
    zoomJoinUrl: {
      type: String,
      default: null,
      validate: {
        validator: function(url) {
          if (!url) return true; // Allow null/empty
          return /^https:\/\/.*\.zoom\.us\/j\/\d+/.test(url);
        },
        message: "Invalid Zoom join URL format"
      }
    },
    
    zoomStartUrl: {
      type: String,
      default: null,
      validate: {
        validator: function(url) {
          if (!url) return true; // Allow null/empty
          return /^https:\/\/.*\.zoom\.us\/s\/\d+/.test(url);
        },
        message: "Invalid Zoom start URL format"
      }
    },
    
    zoomPassword: {
      type: String,
      default: null,
      maxlength: [10, "Zoom password cannot exceed 10 characters"]
    },
    
    // Session management
    maxParticipants: {
      type: Number,
      default: 100,
      min: [1, "Maximum participants must be at least 1"],
      max: [500, "Maximum participants cannot exceed 500"],
      validate: {
        validator: function(count) {
          return Number.isInteger(count);
        },
        message: "Maximum participants must be a whole number"
      }
    },
    
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        joinedAt: {
          type: Date,
          default: null
        },
        leftAt: {
          type: Date,
          default: null
        },
        duration: {
          type: Number, // Duration in minutes
          default: 0
        }
      }
    ],
    
    // Recording management
    recordingUrl: {
      type: String,
      default: null,
      validate: {
        validator: function(url) {
          if (!url) return true; // Allow null/empty
          return /^https?:\/\/.+/.test(url);
        },
        message: "Recording URL must be a valid HTTP/HTTPS URL"
      }
    },
    
    recordingPassword: {
      type: String,
      default: null,
      maxlength: [20, "Recording password cannot exceed 20 characters"]
    },
    
    recordingDuration: {
      type: Number, // Duration in minutes
      default: 0,
      min: [0, "Recording duration cannot be negative"]
    },
    
    // Session metadata
    actualStartTime: {
      type: Date,
      default: null
    },
    
    actualEndTime: {
      type: Date,
      default: null
    },
    
    isRecorded: {
      type: Boolean,
      default: false
    },
    
    isRecordingPublic: {
      type: Boolean,
      default: false
    },
    
    // Reminder settings
    reminderSent: {
      type: Boolean,
      default: false
    },
    
    reminderSentAt: {
      type: Date,
      default: null
    },
    
    // Additional notes from instructor
    instructorNotes: {
      type: String,
      maxlength: [2000, "Instructor notes cannot exceed 2000 characters"],
      default: ""
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = liveSessionSchema;
