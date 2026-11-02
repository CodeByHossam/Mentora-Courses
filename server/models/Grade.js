const mongoose = require("mongoose");
const gradeSchema = require("./gradeSchema");

require("./gradeBehavior")(gradeSchema);
require("./gradeStatics")(gradeSchema);

module.exports = mongoose.model("Grade", gradeSchema);
