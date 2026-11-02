const mongoose = require("mongoose");

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

module.exports = giftCardSchema;
