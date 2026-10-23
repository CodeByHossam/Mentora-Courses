const mongoose = require('mongoose');

const giftCardSchema = new mongoose.Schema({
  // 🎁 GIFT CARD IDENTIFICATION
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    comment: 'Unique gift card number (16 digits)'
  },
  
  // 👤 OWNERSHIP
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    comment: 'User who owns this gift card'
  },
  
  // 💰 FINANCIAL DETAILS
  amount: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Gift card value in USD'
  },
  
  originalAmount: {
    type: Number,
    required: true,
    min: 0,
    comment: 'Original gift card value (for tracking usage)'
  },
  
  // 📝 GIFT CARD INFORMATION
  description: {
    type: String,
    maxlength: 500,
    comment: 'Description or reason for gift card'
  },
  
  giftCardType: {
    type: String,
    enum: [
      'welcome_bonus',      // Welcome bonus for new instructors
      'commission_reward',  // Reward for high commission earnings
      'referral_bonus',     // Referral program bonus
      'achievement_reward', // Achievement milestone reward
      'admin_issued',       // Manually issued by admin
      'promotional',        // Promotional campaigns
      'compensation',       // Compensation for issues
      'course_purchase'     // For student course purchases
    ],
    default: 'admin_issued',
    comment: 'Type/category of gift card'
  },
  
  // ⏰ VALIDITY PERIOD
  issuedDate: {
    type: Date,
    default: Date.now,
    comment: 'Date when gift card was issued'
  },
  
  expiryDate: {
    type: Date,
    required: true,
    comment: 'Date when gift card expires'
  },
  
  // 🔄 STATUS TRACKING
  isActive: {
    type: Boolean,
    default: true,
    comment: 'Whether gift card is active and usable'
  },
  
  isRedeemed: {
    type: Boolean,
    default: false,
    comment: 'Whether gift card has been fully redeemed'
  },
  
  // 📊 USAGE TRACKING
  usageHistory: [{
    usedAmount: {
      type: Number,
      required: true,
      min: 0
    },
    usedDate: {
      type: Date,
      default: Date.now
    },
    usedFor: {
      type: String,
      required: true,
      comment: 'What the gift card was used for'
    },
    relatedTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BillingTransaction',
      comment: 'Related billing transaction'
    },
    remainingBalance: {
      type: Number,
      required: true,
      min: 0,
      comment: 'Remaining balance after this usage'
    }
  }],
  
  // 🏷️ METADATA
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
    comment: 'Additional metadata (source, campaign, etc.)'
  },
  
  // 👨‍💼 ADMINISTRATIVE
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    comment: 'Admin who issued this gift card'
  },
  
  adminNotes: {
    type: String,
    maxlength: 1000,
    comment: 'Internal admin notes'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 🔍 INDEXES FOR PERFORMANCE
giftCardSchema.index({ userId: 1, isActive: 1 });
giftCardSchema.index({ cardNumber: 1 }, { unique: true });
giftCardSchema.index({ expiryDate: 1 });
giftCardSchema.index({ giftCardType: 1 });
giftCardSchema.index({ isActive: 1, isRedeemed: 1 });

// 🧮 VIRTUAL PROPERTIES
giftCardSchema.virtual('remainingAmount').get(function() {
  const totalUsed = this.usageHistory.reduce((sum, usage) => sum + usage.usedAmount, 0);
  return Math.max(0, this.originalAmount - totalUsed);
});

giftCardSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

giftCardSchema.virtual('daysUntilExpiry').get(function() {
  const now = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

giftCardSchema.virtual('usagePercentage').get(function() {
  if (this.originalAmount === 0) return 100;
  const totalUsed = this.usageHistory.reduce((sum, usage) => sum + usage.usedAmount, 0);
  return Math.round((totalUsed / this.originalAmount) * 100);
});

// 🔧 INSTANCE METHODS
giftCardSchema.methods.generateCardNumber = function() {
  // Generate a 16-digit card number
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return timestamp + random;
};

giftCardSchema.methods.useGiftCard = function(amount, usedFor, relatedTransaction = null) {
  if (!this.isActive || this.isExpired || this.isRedeemed) {
    throw new Error('Gift card is not available for use');
  }
  
  const remaining = this.remainingAmount;
  if (amount > remaining) {
    throw new Error(`Insufficient gift card balance. Available: $${remaining}`);
  }
  
  // Add usage record
  this.usageHistory.push({
    usedAmount: amount,
    usedFor,
    relatedTransaction,
    remainingBalance: remaining - amount
  });
  
  // Update amount (current balance)
  this.amount = remaining - amount;
  
  // Mark as redeemed and inactive if fully used
  if (this.amount === 0) {
    this.isRedeemed = true;
    this.isActive = false; // Also mark as inactive
  }
  
  return this.save();
};

giftCardSchema.methods.deactivate = function(reason = 'Deactivated by admin') {
  this.isActive = false;
  this.adminNotes = (this.adminNotes || '') + `\n${new Date().toISOString()}: ${reason}`;
  return this.save();
};

giftCardSchema.methods.extend = function(newExpiryDate) {
  if (new Date(newExpiryDate) <= new Date()) {
    throw new Error('New expiry date must be in the future');
  }
  this.expiryDate = newExpiryDate;
  return this.save();
};

// 🔧 STATIC METHODS
giftCardSchema.statics.createGiftCard = async function(userId, amount, giftCardType, expiryDate, options = {}) {
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

giftCardSchema.statics.getUserActiveGiftCards = function(userId) {
  return this.find({
    userId,
    isActive: true,
    isRedeemed: false,
    expiryDate: { $gt: new Date() }
  }).sort({ expiryDate: 1 });
};

giftCardSchema.statics.getExpiringGiftCards = function(daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    isActive: true,
    isRedeemed: false,
    expiryDate: { $lte: futureDate, $gt: new Date() }
  }).populate('userId', 'name email');
};

// 🔄 PRE-SAVE MIDDLEWARE
giftCardSchema.pre('save', function(next) {
  // Auto-deactivate if expired
  if (this.isExpired && this.isActive) {
    this.isActive = false;
  }
  
  // Validate expiry date
  if (this.expiryDate <= this.issuedDate) {
    return next(new Error('Expiry date must be after issued date'));
  }
  
  next();
});

// 📊 AGGREGATION HELPERS
giftCardSchema.statics.getGiftCardStats = function(userId = null) {
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

module.exports = mongoose.model('GiftCard', giftCardSchema);
