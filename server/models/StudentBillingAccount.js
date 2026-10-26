const logger = require('../utils/logger');
// models/StudentBillingAccount.js
/**
 * StudentBillingAccount
 *
 * Responsibilities:
 *  - Track student credits, purchases, outstanding admin fees
 *  - Add purchases, add credits, pay admin fees, request refunds
 *
 * Equations:
 *  - currentBalance = availableCredits - outstandingAdminFees - annualFees
 *
 * Note:
 *  - addCoursePurchase should be used when Payment completes
 */

const mongoose = require("mongoose");

const studentBillingAccountSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

  // 📦 PERMANENT BOX FIELDS
  totalCoursePurchases: { type: Number, default: 0 }, // Box: Total spent on courses
  annualFees: { type: Number, default: 0 }, // Box: Annual subscription fees (default: 0)
  
  // 💳 NO BALANCE - Students pay per course or use gift cards
  // Gift cards are course-specific (one card = one course)
  
  // Gift card/bonus amounts with descriptions
  giftAmount: [{
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['gift_card', 'refund', 'bonus', 'compensation', 'promotional', 'welcome', 'loyalty', 'custom'], default: 'gift_card' },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    issuedAt: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    isActive: { type: Boolean, default: true },
    customNote: { type: String }
  }],

  currentBalance: { type: Number, default: 0 },
  creditLimit: { type: Number, default: 100 },

  coursePurchases: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    purchaseAmount: { type: Number, required: true },
    adminFeeAmount: { type: Number, required: true },
    instructorAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["stripe", "paypal", "direct_transfer", "credits"], required: true },
    purchaseDate: { type: Date, default: Date.now },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    status: { type: String, enum: ["completed", "pending", "refunded"], default: "completed" }
  }],

  creditTransactions: [{
    type: { type: String, enum: ["addition", "deduction", "refund", "bonus", "penalty"], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    relatedCourse: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    relatedPayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    processedAt: { type: Date, default: Date.now },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true }
  }],

  refundRequests: [{
    requestId: { type: mongoose.Schema.Types.ObjectId },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    originalPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    refundAmount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "processing", "completed", "rejected"], default: "pending" },
    requestDate: { type: Date, default: Date.now },
    processedDate: { type: Date },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    adminNotes: { type: String },
    refundMethod: { type: String, enum: ["original_payment", "credits", "bank_transfer"] }
  }],

  // Track external fee payments with receipts (no balance payments allowed)
  feePayments: [{
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["bank_transfer"], default: "bank_transfer" },
    receiptUrl: { type: String, required: true },
    paidAt: { type: Date, default: Date.now },
    description: { type: String, required: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date
  }],

  paymentMethods: [{
    type: { type: String, enum: ["stripe", "paypal", "bank_account"] },
    isDefault: { type: Boolean, default: false },
    stripeCustomerId: String,
    stripePaymentMethodId: String,
    paypalEmail: String,
    lastFour: String,
    expiryMonth: Number,
    expiryYear: Number,
    addedAt: { type: Date, default: Date.now }
  }],

  statistics: {
    totalCoursesEnrolled: { type: Number, default: 0 },
    totalInstructorsSupported: { type: Number, default: 0 },
    averageSpendingPerCourse: { type: Number, default: 0 },
    favoriteInstructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastPurchaseDate: { type: Date },
    monthlySpending: { type: Number, default: 0 },
    yearlySpending: { type: Number, default: 0 },
    totalRefundsReceived: { type: Number, default: 0 },
    accountAge: { type: Number, default: 0 }
  },

  preferences: {
    autoPayAdminFees: { type: Boolean, default: true },
    preferredPaymentMethod: { type: String, enum: ["stripe", "paypal", "credits"] },
    emailNotifications: {
      purchaseConfirmation: { type: Boolean, default: true },
      paymentReminders: { type: Boolean, default: true },
      refundUpdates: { type: Boolean, default: true },
      promotionalOffers: { type: Boolean, default: false }
    }
  },

  status: { type: String, enum: ["active", "suspended", "delinquent", "closed"], default: "active" },

  suspensionReason: String,
  suspendedAt: Date,
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, {
  timestamps: true,
  collection: "studentbillingaccounts"
});

/**
 * getAvailableGiftCards - Get unused gift cards
 * Returns array of unused, non-expired gift cards
 */
studentBillingAccountSchema.methods.getAvailableGiftCards = function () {
  const now = new Date();
  return this.giftCards.filter(card => 
    !card.isUsed && 
    (!card.expiryDate || card.expiryDate > now)
  );
};

/**
 * getGiftCardForCourse - Check if student has gift card for specific course
 */
studentBillingAccountSchema.methods.getGiftCardForCourse = function (courseId) {
  const now = new Date();
  return this.giftCards.find(card => 
    card.courseId.toString() === courseId.toString() &&
    !card.isUsed && 
    (!card.expiryDate || card.expiryDate > now)
  );
};

/**
 * calculateCurrentBalance - SIMPLIFIED
 * Students don't have balance, only track purchases and annual fees
 */
studentBillingAccountSchema.methods.calculateCurrentBalance = function () {
  // Students don't maintain a balance in the simplified system
  // They pay for courses directly, no credits or outstanding amounts
  return 0;
};

/**
 * addCoursePurchase - SIMPLIFIED
 * Just add to permanent box and update statistics
 */
studentBillingAccountSchema.methods.addCoursePurchase = function (purchaseData = {}) {
  const now = new Date();
  const prevLastPurchase = this.statistics.lastPurchaseDate;

  logger.info(`📊 [STUDENT] Adding purchase - Amount: $${purchaseData.purchaseAmount || 0}`);
  logger.info(`   Before: totalCoursePurchases=$${this.totalCoursePurchases}`);

  // Add to purchase history
  this.coursePurchases.push(Object.assign({ purchaseDate: now }, purchaseData));
  
  // 📦 ADD TO PERMANENT BOX
  this.totalCoursePurchases += (purchaseData.purchaseAmount || 0);
  
  logger.info(`   After: totalCoursePurchases=$${this.totalCoursePurchases}`);
  
  // Update statistics
  this.statistics.totalCoursesEnrolled = (this.statistics.totalCoursesEnrolled || 0) + 1;

  // Monthly/yearly spending
  if (!prevLastPurchase || prevLastPurchase.getMonth() !== now.getMonth() || prevLastPurchase.getFullYear() !== now.getFullYear()) {
    this.statistics.monthlySpending = 0;
  }
  if (!prevLastPurchase || prevLastPurchase.getFullYear() !== now.getFullYear()) {
    this.statistics.yearlySpending = 0;
  }
  this.statistics.monthlySpending += (purchaseData.purchaseAmount || 0);
  this.statistics.yearlySpending += (purchaseData.purchaseAmount || 0);
  this.statistics.lastPurchaseDate = now;

  this.recalculateAll();
};

/**
 * addAnnualFee:
 *  - Adds annual fee to outstanding admin fees
 */
studentBillingAccountSchema.methods.addAnnualFee = function (annualFeeAmount, year = new Date().getFullYear()) {
  // Ensure annualFeeAmount is a valid number
  const feeAmount = Number(annualFeeAmount) || 0;
  
  this.annualFees = (this.annualFees || 0) + feeAmount;
  
  // Log the annual fee transaction
  this.creditTransactions.push({
    type: 'deduction', // Use valid enum value
    amount: feeAmount,
    description: `Annual fee for ${year}`,
    date: new Date(),
    balanceBefore: this.currentBalance || 0,
    balanceAfter: (this.currentBalance || 0) - feeAmount
  });
  
  this.recalculateAll();
};

/**
 * payAnnualFee:
 *  - Pays outstanding annual fees via external payment only (bank transfer with receipt)
 *  - No longer allows paying from internal balance for security and audit purposes
 */
studentBillingAccountSchema.methods.payAnnualFee = function (paymentAmount, receiptUrl, description = 'Annual fee payment') {
  if (!receiptUrl) {
    throw new Error('Receipt is required for all fee payments');
  }
  
  const paidAmount = Math.min(paymentAmount, this.annualFees);
  
  this.annualFees -= paidAmount;
  this.totalAdminFeesPaid += paidAmount;
  
  // Record the payment with receipt
  this.feePayments = this.feePayments || [];
  this.feePayments.push({
    amount: paidAmount,
    paymentMethod: 'bank_transfer',
    receiptUrl,
    paidAt: new Date(),
    description: `${description} - $${paidAmount}`
  });
  
  this.recalculateAll();
  return paidAmount;
};


/**
 * addGiftAmount - SIMPLIFIED
 * Add to permanent gift box and history array
 */
studentBillingAccountSchema.methods.addGiftAmount = function (amount, description, giftType = 'gift_card', issuedBy = null, customNote = null, expiryDate = null) {
  // 📦 ADD TO PERMANENT BOX
  this.totalGiftAmount += amount;
  
  // Add to history array
  this.giftAmount = this.giftAmount || [];
  this.giftAmount.push({
    amount,
    description,
    type: giftType,
    issuedBy,
    issuedAt: new Date(),
    expiryDate,
    isActive: true,
    customNote
  });

  this.recalculateAll();
  return this.giftAmount[this.giftAmount.length - 1];
};

/**
 * useGiftCard - Mark gift card as used
 */
studentBillingAccountSchema.methods.useGiftCard = function (giftCardId) {
  const card = this.giftCards.find(c => c.giftCardId.toString() === giftCardId.toString());
  if (card) {
    card.isUsed = true;
    card.usedAt = new Date();
  }
  return card;
};


/**
 * requestRefund:
 *  - push refund request and return id. Validation should be handled by controller
 */
studentBillingAccountSchema.methods.requestRefund = function (courseId, originalPaymentId, refundAmount, reason) {
  const refundRequest = {
    requestId: new mongoose.Types.ObjectId(),
    courseId,
    originalPaymentId,
    refundAmount,
    reason,
    status: "pending",
    requestDate: new Date()
  };

  this.refundRequests.push(refundRequest);
  return refundRequest.requestId;
};

/**
 * recalculateAll:
 *  - updates currentBalance, average spending, unique instructors and account age
 */
studentBillingAccountSchema.methods.recalculateAll = function () {
  this.currentBalance = this.calculateCurrentBalance();

  if (this.statistics.totalCoursesEnrolled > 0) {
    this.statistics.averageSpendingPerCourse = this.totalCoursePurchases / this.statistics.totalCoursesEnrolled;
  }

  // unique instructors
  try {
    const uniqueInstructors = new Set((this.coursePurchases || []).map(p => p.instructorId ? p.instructorId.toString() : null).filter(Boolean));
    this.statistics.totalInstructorsSupported = uniqueInstructors.size;
  } catch (e) {
    this.statistics.totalInstructorsSupported = this.statistics.totalInstructorsSupported || 0;
  }

  // account age (days since first purchase)
  if ((this.coursePurchases || []).length > 0) {
    const firstPurchase = (this.coursePurchases || []).reduce((earliest, p) => {
      if (!earliest) return p;
      return new Date(p.purchaseDate) < new Date(earliest.purchaseDate) ? p : earliest;
    }, null);
    if (firstPurchase) {
      const daysDiff = Math.floor((new Date() - new Date(firstPurchase.purchaseDate)) / (1000 * 60 * 60 * 24));
      this.statistics.accountAge = daysDiff;
    }
  }

  // delinquent check
  if (this.currentBalance < -this.creditLimit) {
    this.status = "delinquent";
  } else if (this.status === "delinquent" && this.currentBalance >= -this.creditLimit) {
    this.status = "active";
  }
};

studentBillingAccountSchema.index({ studentId: 1 });

module.exports = mongoose.models.StudentBillingAccount || mongoose.model("StudentBillingAccount", studentBillingAccountSchema);
