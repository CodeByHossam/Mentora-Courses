module.exports = function (schema) {
/* =========================================================
   MIDDLEWARE HOOKS
========================================================= */

// Pre-save middleware
schema.pre("save", function (next) {
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
schema.pre("validate", function (next) {
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
};
