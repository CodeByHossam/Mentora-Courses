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

// Constants for validation
const SESSION_DEFAULTS = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_DURATION: 15, // 15 minutes
  MAX_DURATION: 480, // 8 hours
};

const SESSION_STATUSES = ["scheduled", "live", "completed", "cancelled"];
const SESSION_TYPES = ["lecture", "workshop", "qa", "review", "exam"];

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

/* =========================================================
   VIRTUAL FIELDS
========================================================= */

// Virtual for session end time
liveSessionSchema.virtual("endTime").get(function () {
  if (!this.scheduledDate || !this.duration) return null;
  return new Date(this.scheduledDate.getTime() + this.duration * 60 * 1000);
});

// Virtual for time until session
liveSessionSchema.virtual("timeUntilSession").get(function () {
  if (!this.scheduledDate) return null;
  const now = new Date();
  const timeDiff = this.scheduledDate.getTime() - now.getTime();
  return Math.max(0, timeDiff);
});

// Virtual for session status based on time
liveSessionSchema.virtual("currentStatus").get(function () {
  const now = new Date();
  const sessionStart = this.scheduledDate;
  const sessionEnd = this.endTime;
  
  if (this.status === "cancelled") return "cancelled";
  if (this.status === "completed") return "completed";
  
  if (now < sessionStart) return "upcoming";
  if (now >= sessionStart && now <= sessionEnd) return "live";
  if (now > sessionEnd) return "ended";
  
  return this.status;
});

// Virtual for participant count
liveSessionSchema.virtual("participantCount").get(function () {
  return this.participants ? this.participants.length : 0;
});

// Virtual for active participants (currently in session)
liveSessionSchema.virtual("activeParticipants").get(function () {
  if (!this.participants) return [];
  return this.participants.filter(p => p.joinedAt && !p.leftAt);
});

// Virtual for actual duration
liveSessionSchema.virtual("actualDuration").get(function () {
  if (!this.actualStartTime || !this.actualEndTime) return 0;
  return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60));
});

/* =========================================================
   MIDDLEWARE HOOKS
========================================================= */

// Pre-save middleware
liveSessionSchema.pre("save", function (next) {
  try {
    // Auto-complete session if end time has passed
    const now = new Date();
    const sessionEnd = this.endTime;
    
    if (sessionEnd && now > sessionEnd && this.status === "live") {
      this.status = "completed";
      if (!this.actualEndTime) {
        this.actualEndTime = sessionEnd;
      }
    }
    
    // Calculate participant durations
    if (this.participants && this.participants.length > 0) {
      this.participants.forEach(participant => {
        if (participant.joinedAt && participant.leftAt) {
          participant.duration = Math.round(
            (participant.leftAt - participant.joinedAt) / (1000 * 60)
          );
        }
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-validate middleware
liveSessionSchema.pre("validate", function (next) {
  try {
    // Ensure no duplicate participants
    if (this.participants && this.participants.length > 0) {
      const userIds = this.participants.map(p => p.user.toString());
      const uniqueUserIds = new Set(userIds);
      
      if (userIds.length !== uniqueUserIds.size) {
        return next(new Error("Duplicate participants are not allowed"));
      }
    }
    
    // Validate actual times
    if (this.actualStartTime && this.actualEndTime) {
      if (this.actualEndTime <= this.actualStartTime) {
        return next(new Error("Actual end time must be after start time"));
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

/* =========================================================
   DATABASE INDEXES
========================================================= */

// Compound indexes for common queries
liveSessionSchema.index({ course: 1, scheduledDate: 1 });
liveSessionSchema.index({ instructor: 1, status: 1 });
liveSessionSchema.index({ status: 1, scheduledDate: 1 });
liveSessionSchema.index({ course: 1, status: 1 });

// Single field indexes
liveSessionSchema.index({ scheduledDate: 1 });
liveSessionSchema.index({ status: 1 });
liveSessionSchema.index({ zoomMeetingId: 1 }, { sparse: true });

// Text search index
liveSessionSchema.index({ 
  title: "text", 
  description: "text" 
}, {
  weights: { title: 10, description: 5 },
  name: "session_text_search"
});

/* =========================================================
   INSTANCE METHODS
========================================================= */

// Method to check if user can join session
liveSessionSchema.methods.canUserJoin = function(userId) {
  const now = new Date();
  const sessionStart = this.scheduledDate;
  const sessionEnd = this.endTime;
  
  // Session must be live or about to start (within 1 hour for testing)
  const canJoinTime = new Date(sessionStart.getTime() - 60 * 60 * 1000);
  
  return (
    this.status !== "cancelled" &&
    this.status !== "completed" &&
    now >= canJoinTime &&
    now <= sessionEnd &&
    this.participantCount < this.maxParticipants
  );
};

// Method to add participant
liveSessionSchema.methods.addParticipant = function(userId) {
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      joinedAt: new Date()
    });
  } else if (!existingParticipant.joinedAt) {
    existingParticipant.joinedAt = new Date();
    existingParticipant.leftAt = null;
  }
  
  return this.save();
};

// Method to remove participant
liveSessionSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant && participant.joinedAt && !participant.leftAt) {
    participant.leftAt = new Date();
  }
  
  return this.save();
};

// Method to start session
liveSessionSchema.methods.startSession = function() {
  this.status = "live";
  this.actualStartTime = new Date();
  return this.save();
};

// Method to end session
liveSessionSchema.methods.endSession = function() {
  this.status = "completed";
  this.actualEndTime = new Date();
  
  // Mark all active participants as left
  this.participants.forEach(participant => {
    if (participant.joinedAt && !participant.leftAt) {
      participant.leftAt = new Date();
    }
  });
  
  return this.save();
};

module.exports = mongoose.model("LiveSession", liveSessionSchema);
