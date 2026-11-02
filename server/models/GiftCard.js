const mongoose = require("mongoose");
const giftCardSchema = require("./giftCardSchema");

require("./giftCardBehavior")(giftCardSchema);
require("./giftCardStatics")(giftCardSchema);

module.exports = mongoose.model('GiftCard', giftCardSchema);
