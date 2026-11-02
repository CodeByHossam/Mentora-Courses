module.exports = function (schema) {
/* =========================================================
   DATABASE INDEXES
   
   Optimized indexes for common query patterns and performance.
========================================================= */

// Text search index for title and description
schema.index(
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
schema.index({ status: 1, category: 1 });
schema.index({ status: 1, level: 1 });
schema.index({ status: 1, price: 1 });
schema.index({ instructor: 1, status: 1 });

// Single field indexes for frequent queries
schema.index({ category: 1 });
schema.index({ instructor: 1 });
schema.index({ enrolledStudents: 1 });
schema.index({ createdAt: -1 });
schema.index({ updatedAt: -1 });

// Sparse indexes for optional fields
schema.index({ publishedAt: -1 }, { sparse: true });
schema.index({ archivedAt: -1 }, { sparse: true });
};
