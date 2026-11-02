// Shared constants for this model.

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

module.exports = {
  SESSION_DEFAULTS,
  SESSION_STATUSES,
  SESSION_TYPES
};
