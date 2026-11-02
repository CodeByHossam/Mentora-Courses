module.exports = function (schema) {
/* =========================================================
   VIRTUAL FIELDS
========================================================= */

// Virtual for session end time
schema.virtual("endTime").get(function () {
  if (!this.scheduledDate || !this.duration) return null;
  return new Date(this.scheduledDate.getTime() + this.duration * 60 * 1000);
});

// Virtual for time until session
schema.virtual("timeUntilSession").get(function () {
  if (!this.scheduledDate) return null;
  const now = new Date();
  const timeDiff = this.scheduledDate.getTime() - now.getTime();
  return Math.max(0, timeDiff);
});

// Virtual for session status based on time
schema.virtual("currentStatus").get(function () {
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
schema.virtual("participantCount").get(function () {
  return this.participants ? this.participants.length : 0;
});

// Virtual for active participants (currently in session)
schema.virtual("activeParticipants").get(function () {
  if (!this.participants) return [];
  return this.participants.filter(p => p.joinedAt && !p.leftAt);
});

// Virtual for actual duration
schema.virtual("actualDuration").get(function () {
  if (!this.actualStartTime || !this.actualEndTime) return 0;
  return Math.round((this.actualEndTime - this.actualStartTime) / (1000 * 60));
});
};
