const mongoose = require("mongoose");
const paymentSchema = require("./paymentSchema");
const attachMethods = require("./paymentMethods");
attachMethods(paymentSchema);
module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
