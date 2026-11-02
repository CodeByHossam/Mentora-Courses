module.exports = function (schema) {
/* =========================================================
   DATABASE INDEXES
========================================================= */

// Compound indexes for common queries
schema.index({ course: 1, scheduledDate: 1 });
schema.index({ instructor: 1, status: 1 });
schema.index({ status: 1, scheduledDate: 1 });
schema.index({ course: 1, status: 1 });

// Single field indexes
schema.index({ scheduledDate: 1 });
schema.index({ status: 1 });
schema.index({ zoomMeetingId: 1 }, { sparse: true });

// Text search index
schema.index({ 
  title: "text", 
  description: "text" 
}, {
  weights: { title: 10, description: 5 },
  name: "session_text_search"
});
};
