// Shared constants for the Course model.

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


module.exports = {
  COURSE_DEFAULTS,
  COURSE_LEVELS,
  COURSE_STATUSES,
};
