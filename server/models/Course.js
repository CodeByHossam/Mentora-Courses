const mongoose = require("mongoose");
const courseSchema = require("./courseSchema");

require("./courseVirtuals")(courseSchema);
require("./courseHooks")(courseSchema);
require("./courseIndexes")(courseSchema);
require("./courseMethods")(courseSchema);

module.exports = mongoose.model("Course", courseSchema);
