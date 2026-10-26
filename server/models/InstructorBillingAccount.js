const logger = require('../utils/logger');
// models/InstructorBillingAccount.js
/**
 * InstructorBillingAccount
 *
 * Responsibilities:
 *  - Track instructor earnings, pending payouts, owed admin fees (liabilities)
 *  - Allow adding course sales (when sale recorded), request payouts, settle admin fees
 *
 * Equations:
 *  - availableBalance = welcomeCredits + totalCommissionEarned + adminCreditsAdded - totalPayoutsReceived - pendingPayouts - annualFees
 *  - owedAdminFees tracked separately (not deducted from balance as already accounted for in commission)
 *
 * Note: Methods mutate the document and call recalculateAll() for derived fields.
 */

const mongoose = require("mongoose");

const instructorBillingAccountSchema = new mongoose.Schema({
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

  // 📦 PERMANENT BOX FIELDS - These survive payment deletions
  totalCommissionEarned: { type: Number, default: 0 }, // Box: Total earned from all sales (HISTORY)
  totalPayoutsReceived: { type: Number, default: 0 }, // Box: Total paid out by admin
  pendingCommissions: { type: Number, default: 0 }, // Box: Current unpaid commissions (totalCommissionEarned - totalPayoutsReceived)
  totalGiftAmount: { type: Number, default: 0 }, // Box: Total gift cards received
  annualFees: { type: Number, default: 10 }, // Box: Annual subscription fees owed ($10/year)
  
  // 💰 SIMPLE BALANCE CALCULATION
  // availableBalance = pendingCommissions + totalGiftAmount - annualFees
  
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


  courseSales: [{
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    saleAmount: { type: Number, required: true },
    commissionAmount: { type: Number, required: true }, // what instructor gets
    adminFeeAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["stripe", "paypal", "direct_transfer", "card", "annual_fee"] },
    saleDate: { type: Date, default: Date.now },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" }
  }],

  // Payout history (completed payouts only, no pending requests)
  payoutRequests: [{
    requestId: { type: mongoose.Schema.Types.ObjectId },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["stripe", "paypal", "bank_transfer"] },
    status: { type: String, enum: ["pending", "approved", "processing", "completed", "rejected"], default: "pending" },
    requestDate: { type: Date, default: Date.now },
    processedDate: Date,
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: String,
    transactionId: String
  }],

  // Annual fee payment history
  feePayments: [{
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["bank_transfer"], default: "bank_transfer" },
    receiptUrl: { type: String, required: true },
    paidAt: { type: Date, default: Date.now },
    description: { type: String, required: true },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: Date
  }],

  payoutSettings: {
    minimumPayoutAmount: { type: Number, default: 50 },
    preferredPayoutMethod: { type: String, enum: ["stripe", "paypal", "bank_transfer"], default: "stripe" },
    autoPayoutEnabled: { type: Boolean, default: false },
    payoutSchedule: { type: String, enum: ["weekly", "monthly", "manual"], default: "monthly" },
    stripeAccountId: { type: String },
    paypalEmail: { type: String },
    bankDetails: {
      accountNumber: String,
      routingNumber: String,
      accountHolderName: String,
      bankName: String
    }
  },

  statistics: {
    totalCoursesSold: { type: Number, default: 0 },
    totalStudentsServed: { type: Number, default: 0 },
    averageCommissionPerSale: { type: Number, default: 0 },
    bestSellingCourse: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    lastSaleDate: { type: Date },
    lastPayoutDate: { type: Date },
    monthlyEarnings: { type: Number, default: 0 },
    yearlyEarnings: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },

  status: { type: String, enum: ["active", "suspended", "pending_verification", "inactive"], default: "active" },

  suspensionReason: String,
  suspendedAt: Date,
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, {
  timestamps: true,
  collection: "instructorbillingaccounts"
});

/**
 * calculateAvailableBalance - SIMPLIFIED
 * Uses pendingCommissions (not total history)
 */
instructorBillingAccountSchema.methods.calculateAvailableBalance = function () {
  const balance = (this.pendingCommissions || 0)
    + (this.totalGiftAmount || 0)
    - (this.annualFees || 0);

  return Math.max(0, balance);
};

/**
 * addCourseSale - SIMPLIFIED
 * Add commission to both total (history) and pending (current)
 */
instructorBillingAccountSchema.methods.addCourseSale = function (saleData = {}) {
  const now = new Date();
  const prevLastSale = this.statistics.lastSaleDate;
  const commissionAmount = saleData.commissionAmount || 0;
  
  logger.info(`📊 [INSTRUCTOR] Adding sale - Commission: $${commissionAmount}`);
  logger.info(`   Before: totalCommissionEarned=$${this.totalCommissionEarned}, pendingCommissions=$${this.pendingCommissions}`);
  
  // Add to sales history
  this.courseSales.push(Object.assign({ saleDate: now }, saleData));

  // 📦 ADD TO PERMANENT BOXES
  this.totalCommissionEarned += commissionAmount; // History (never decreases)
  this.pendingCommissions += commissionAmount; // Current unpaid amount
  
  logger.info(`   After: totalCommissionEarned=$${this.totalCommissionEarned}, pendingCommissions=$${this.pendingCommissions}`);
  
  // Update statistics
  this.statistics.totalCoursesSold = (this.statistics.totalCoursesSold || 0) + 1;
  
  // Monthly/yearly earnings
  if (!prevLastSale || prevLastSale.getMonth() !== now.getMonth() || prevLastSale.getFullYear() !== now.getFullYear()) {
    this.statistics.monthlyEarnings = 0;
  }
  if (!prevLastSale || prevLastSale.getFullYear() !== now.getFullYear()) {
    this.statistics.yearlyEarnings = 0;
  }
  this.statistics.monthlyEarnings += commissionAmount;
  this.statistics.yearlyEarnings += commissionAmount;
  this.statistics.lastSaleDate = now;

  this.recalculateAll();
};

/**
 * processPayout - SIMPLIFIED
 * Admin pays instructor directly, no request needed
 */
instructorBillingAccountSchema.methods.processPayout = function (amount, processedBy = null, notes = null) {
  if (amount > this.pendingCommissions) {
    throw new Error("Payout amount exceeds pending commissions");
  }

  // 📦 UPDATE PERMANENT BOXES
  this.pendingCommissions -= amount; // Decrease pending
  this.totalPayoutsReceived += amount; // Increase total paid

  // Record payout in history
  this.payoutRequests.push({
    requestId: new mongoose.Types.ObjectId(),
    amount,
    method: this.payoutSettings.preferredPayoutMethod,
    status: "completed",
    requestDate: new Date(),
    processedDate: new Date(),
    processedBy,
    notes: notes || `Admin payout: $${amount}`
  });

  this.recalculateAll();
  return this.payoutRequests[this.payoutRequests.length - 1].requestId;
};


/**
 * addGiftAmount - SIMPLIFIED
 * Add to permanent gift box and history array
 */
instructorBillingAccountSchema.methods.addGiftAmount = function (amount, description, giftType = 'gift_card', issuedBy = null, customNote = null, expiryDate = null) {
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
 * getTotalGiftAmount - SIMPLIFIED
 * Just return the permanent box value
 */
instructorBillingAccountSchema.methods.getTotalGiftAmount = function () {
  return this.totalGiftAmount || 0;
};

/**
 * addAnnualFee:
 *  - Adds annual subscription fee to instructor's account
 */
instructorBillingAccountSchema.methods.addAnnualFee = function (annualFeeAmount, year = new Date().getFullYear()) {
  const feeAmount = Number(annualFeeAmount) || 0;
  this.annualFees = (this.annualFees || 0) + feeAmount;
  
  // Add to course sales history for tracking
  this.courseSales.push({
    courseId: null,
    studentId: null,
    saleAmount: 0,
    commissionAmount: 0,
    adminFeeAmount: feeAmount,
    paymentMethod: 'annual_fee',
    saleDate: new Date(),
    description: `Annual fee for ${year}`
  });
  
  this.recalculateAll();
};

/**
 * payAnnualFee:
 *  - Pays annual subscription fees via external payment only (bank transfer with receipt)
 *  - No longer allows paying from internal balance for security and audit purposes
 */
instructorBillingAccountSchema.methods.payAnnualFee = function (paymentAmount, paymentMethod = 'bank_transfer', receiptUrl = null) {
  if (!receiptUrl) {
    throw new Error('Receipt is required for all fee payments');
  }
  
  if (paymentMethod !== 'bank_transfer') {
    throw new Error('Only bank transfer payments are allowed for annual fees');
  }
  
  const paidAmount = Math.min(paymentAmount, this.annualFees || 0);
  this.annualFees -= paidAmount;
  
  // Record the payment with receipt
  this.feePayments = this.feePayments || [];
  this.feePayments.push({
    amount: paidAmount,
    paymentMethod: 'bank_transfer',
    receiptUrl,
    paidAt: new Date(),
    description: `Annual fee payment - $${paidAmount}`
  });
  
  this.recalculateAll();
  return paidAmount;
};


/**
 * recalculateAll:
 *  - recomputes availableBalance and other derived fields
 */
instructorBillingAccountSchema.methods.recalculateAll = function () {
  this.availableBalance = this.calculateAvailableBalance();

  if (this.statistics.totalCoursesSold > 0) {
    this.statistics.averageCommissionPerSale = this.totalCommissionEarned / this.statistics.totalCoursesSold;
  }
  // unique students
  try {
    const uniqueStudents = new Set((this.courseSales || []).map(s => s.studentId ? s.studentId.toString() : null).filter(Boolean));
    this.statistics.totalStudentsServed = uniqueStudents.size;
  } catch (e) {
    this.statistics.totalStudentsServed = this.statistics.totalStudentsServed || 0;
  }
};

instructorBillingAccountSchema.index({ instructorId: 1 });

module.exports = mongoose.models.InstructorBillingAccount || mongoose.model("InstructorBillingAccount", instructorBillingAccountSchema);
