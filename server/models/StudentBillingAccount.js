const mongoose = require("mongoose");
const studentBillingAccountSchema = require("./studentBillingAccountSchema");

require("./studentBillingAccountMethods")(studentBillingAccountSchema);

module.exports = mongoose.models.StudentBillingAccount || mongoose.model("StudentBillingAccount", studentBillingAccountSchema);
