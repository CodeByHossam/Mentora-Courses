const mongoose = require("mongoose");

module.exports = function (schema) {
// 🔧 STATIC METHODS
schema.statics.createGiftCard = async function(userId, amount, giftCardType, expiryDate, options = {}) {
  const giftCard = new this({
    userId,
    amount,
    originalAmount: amount,
    giftCardType,
    expiryDate,
    description: options.description,
    issuedBy: options.issuedBy,
    adminNotes: options.adminNotes,
    metadata: options.metadata || {}
  });
  
  // Generate unique card number
  let cardNumber;
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    cardNumber = giftCard.generateCardNumber();
    const existing = await this.findOne({ cardNumber });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }
  
  if (!isUnique) {
    throw new Error('Failed to generate unique card number');
  }
  
  giftCard.cardNumber = cardNumber;
  return giftCard.save();
};

schema.statics.getUserActiveGiftCards = function(userId) {
  return this.find({
    userId,
    isActive: true,
    isRedeemed: false,
    expiryDate: { $gt: new Date() }
  }).sort({ expiryDate: 1 });
};

schema.statics.getExpiringGiftCards = function(daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    isActive: true,
    isRedeemed: false,
    expiryDate: { $lte: futureDate, $gt: new Date() }
  }).populate('userId', 'name email');
};

// 📊 AGGREGATION HELPERS
schema.statics.getGiftCardStats = function(userId = null) {
  const matchStage = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalCards: { $sum: 1 },
        activeCards: {
          $sum: {
            $cond: [
              { $and: ['$isActive', { $not: '$isRedeemed' }, { $gt: ['$expiryDate', new Date()] }] },
              1,
              0
            ]
          }
        },
        totalValue: { $sum: '$originalAmount' },
        remainingValue: { $sum: '$amount' },
        expiredCards: {
          $sum: {
            $cond: [{ $lte: ['$expiryDate', new Date()] }, 1, 0]
          }
        },
        redeemedCards: {
          $sum: {
            $cond: ['$isRedeemed', 1, 0]
          }
        }
      }
    }
  ]);
};
};
