module.exports = function (schema) {
/* =========================================================
   INSTANCE METHODS
========================================================= */

// Method to check if user can join session
schema.methods.canUserJoin = function(userId) {
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
schema.methods.addParticipant = function(userId) {
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
schema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant && participant.joinedAt && !participant.leftAt) {
    participant.leftAt = new Date();
  }
  
  return this.save();
};

// Method to start session
schema.methods.startSession = function() {
  this.status = "live";
  this.actualStartTime = new Date();
  return this.save();
};

// Method to end session
schema.methods.endSession = function() {
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
};
