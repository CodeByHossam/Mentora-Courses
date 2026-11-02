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

studentBillingAccountSchema.index({ studentId: 1 });

module.exports = studentBillingAccountSchema;
