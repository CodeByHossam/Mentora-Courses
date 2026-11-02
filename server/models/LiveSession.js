const mongoose = require("mongoose");
const liveSessionSchema = require("./liveSessionSchema");

require("./liveSessionVirtuals")(liveSessionSchema);
require("./liveSessionHooks")(liveSessionSchema);
require("./liveSessionIndexes")(liveSessionSchema);
require("./liveSessionMethods")(liveSessionSchema);

module.exports = mongoose.model("LiveSession", liveSessionSchema);
