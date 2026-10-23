# LearnTrack Data Storage Schemas - Comprehensive Guide

## 📊 Database Schema Overview

This document consolidates all data storage schemas, models, and database structures used throughout the LearnTrack platform, focusing on financial and payment-related data storage.

## 💳 Course Purchase Data Storage

### Payment Model Schema (Unified Student → Admin, single finalizer)
```javascript
const paymentSchema = new mongoose.Schema({
  // Who pays and what
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },

  // Classification
  type: { type: String, enum: ['course_payment','billing_payment','annual_fee','commission_payment'], default: 'course_payment' },
  paymentSource: { type: String, enum: ['electronic','direct_transfer'], default: 'electronic' },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Amounts
  originalAmount: { type: Number },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },

  // Fees and shares (standardized)
  adminPercentage: { type: Number, default: 10 },
  adminFeeFixed: { type: Number, default: 0 },
  adminFee: { type: Number, default: 0 },
  instructorAmount: { type: Number, default: 0 },

  // Direction
  transactionType: { type: String, enum: ['student_to_admin','student_to_instructor','admin_to_instructor','instructor_to_admin','billing_payment'] },

  // Method and status
  method: { type: String, enum: ['stripe','paypal','direct_transfer','credit_payment','cash'], default: 'stripe' },
  status: { type: String, enum: ['pending','pending_admin_approval','processing','completed','paid','failed','refunded','rejected','cancelled'], default: 'pending' },
  paidAt: Date,
  completedAt: Date,

  // Admin approval (for direct transfers)
  adminApproval: {
    required: { type: Boolean, default: false },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: Date,
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectedAt: Date,
    adminNotes: String,
  },

  // Gateways
  stripePaymentIntentId: String,
  stripeSessionId: String,
  paypalOrderId: String,
  paypalPaymentId: String,
  paypalPayerId: String,

  // Payout tracking
  commissionPaidAmount: { type: Number, default: 0 },
  isCommissionSettled: { type: Boolean, default: false },

  // Soft-delete/void scaffolding
  isVoided: { type: Boolean, default: false },
  voidedAt: Date,
  voidReason: String,
  voidReversalId: { type: mongoose.Schema.Types.ObjectId, ref: 'BillingTransaction', default: null },

  // Misc
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
```

### Course Purchase Transaction Flow (Unified)
```javascript
// 1. Initiation (server-side calculation)
const payment = await Payment.create({
  userId: studentId,
  course: courseId,
  finalAmount: course.finalPrice,
  method: 'stripe',
  paymentSource: 'electronic',
});
payment.calculateShares();
await payment.save();

// 2. Gateway mapping
payment.stripeSessionId = session.id;
payment.stripePaymentIntentId = session.payment_intent;
await payment.save();

// 3. Finalization (authoritative)
payment.status = 'paid';
payment.paidAt = new Date();
await payment.save();
await payment.completePayment();
```

## 💰 Instructor Payout Data Storage

### InstructorBillingAccount Schema (with pendingEarnings/carryover)
```javascript
const instructorBillingAccountSchema = new mongoose.Schema({
  // Instructor Reference
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  
  // Account Information
  accountType: {
    type: String,
    enum: ['free', 'paid'],
    default: 'free',
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'closed'],
    default: 'active',
  },
  
  // Financial Balances
  welcomeCredits: {
    type: Number,
    default: function() {
      return this.accountType === 'free' ? 100000 : 100;
    },
  },
  totalCommissionEarned: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalPayoutsReceived: {
    type: Number,
    default: 0,
    min: 0,
  },
  pendingPayouts: { type: Number, default: 0, min: 0 },
  pendingEarnings: { type: Number, default: 0 },
  previousCarryover: { type: Number, default: 0 },
  totalApprovedPayouts: {
    type: Number,
    default: 0,
    min: 0,
  },
  adminCreditsAdded: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalGiftAmount: {
    default: 0,
    min: 0,
  },
  
  // Fee Management
  // DEPRECATED (per-sale): owedAdminFees, totalAdminFeesPaid
  // Keep only for legacy/annual fee workflows if needed
  // TODO: Remove in future versions
  owedAdminFees: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAdminFeesPaid: {
    type: Number,
    default: 0,
    min: 0,
  },
  annualFees: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  // Statistics
  statistics: {
    totalPaid: {
      type: Number,
      default: 0,
    },
    totalCharges: {
      type: Number,
      default: 0,
    },
    paymentCount: {
      type: Number,
      default: 0,
    },
    lastPaymentAmount: {
      type: Number,
      default: 0,
    },
    lastInstructorPaymentAmount: {
      type: Number,
      default: 0,
    },
    lastStudentPaymentAmount: {
      type: Number,
      default: 0,
    },
  },
  
  // Payout Requests
  payoutRequests: [{
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'completed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    approvedDate: Date,
    completedDate: Date,
    notes: String,
    receiptUrl: String,
    bankDetails: {
      accountName: String,
      accountNumber: String,
      bankName: String,
      routingNumber: String,
    },
  }],
  
  // Fee Payments
  feePayments: [{
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'wire_transfer'],
      required: true,
    },
    receiptUrl: String,
    paidAt: {
      type: Date,
      default: Date.now,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    status: {
      type: String,
      enum: ['pending_verification', 'verified', 'rejected'],
      default: 'pending_verification',
    },
    description: String,
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual: Calculate Available Balance
instructorBillingAccountSchema.virtual('availableBalance').get(function() {
  return this.welcomeCredits + 
         this.totalCommissionEarned + 
         this.adminCreditsAdded + 
         this.totalGiftAmount - 
         this.totalPayoutsReceived - 
         this.pendingPayouts - 
         this.totalApprovedPayouts - 
         this.annualFees - 
         Math.max(0, this.owedAdminFees - this.totalAdminFeesPaid);
});
```

### PayoutRequest Schema
```javascript
const payoutRequestSchema = new mongoose.Schema({
  // Instructor Information
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // Request Details
  amount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  method: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe'],
    required: true,
  },
  description: String,
  
  // Bank Details (for bank transfers)
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    routingNumber: String,
    swiftCode: String,
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'rejected', 'cancelled'],
    default: 'pending',
  },
  
  // Processing Information
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  
  // Receipt Management
  receiptUrl: String,
  receiptUploadedAt: Date,
  receiptUploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  
  // Timestamps
  requestDate: {
    type: Date,
    default: Date.now,
  },
  approvedAt: Date,
  completedAt: Date,
  rejectedAt: Date,
  
  // Notes
  instructorNotes: String,
  adminNotes: String,
  rejectionReason: String,
  
  // Related Records
  relatedBillingTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BillingTransaction",
  },
});
```

## 🔄 Refund Processing Data Storage

### RefundRequest Schema
```javascript
const refundRequestSchema = new mongoose.Schema({
  // User Information
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requesterType: {
    type: String,
    enum: ['student', 'instructor'],
    required: true,
  },
  
  // Request Details
  refundType: {
    type: String,
    enum: ['course_purchase', 'admin_fee_overpayment', 'annual_fee', 'credit_refund'],
    required: true,
  },
  requestedAmount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  originalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500,
  },
  description: {
    type: String,
    maxlength: 1000,
  },
  
  // Related Records
  relatedCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
  relatedPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
  relatedBillingTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BillingTransaction",
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'processed', 'cancelled'],
    default: 'pending',
  },
  
  // Admin Processing
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  adminNotes: {
    type: String,
    maxlength: 1000,
  },
  rejectionReason: {
    type: String,
    maxlength: 500,
  },
  
  // Supporting Documents
  supportingDocuments: [{
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  // Financial Impact
  approvedAmount: {
    type: Number,
    min: 0,
  },
  processedAmount: {
    type: Number,
    min: 0,
  },
  refundMethod: {
    type: String,
    enum: ['account_credit', 'bank_transfer', 'original_payment_method'],
  },
  
  // Timestamps
  requestDate: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: Date,
  approvedAt: Date,
  processedAt: Date,
  rejectedAt: Date,
  
  // Audit Trail
  statusHistory: [{
    status: {
      type: String,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  }],
  
  // Related Refund Transaction
  refundTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BillingTransaction",
  },
});
```

## 💳 Admin Fee Payment Data Storage

### AdminFeePayment Schema
```javascript
const adminFeePaymentSchema = new mongoose.Schema({
  // Instructor Information
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // Payment Details
  paymentAmount: {
    type: Number,
    required: true,
    min: 0.01,
  },
  paymentDate: {
    type: Date,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'wire_transfer', 'check'],
    required: true,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  referenceNumber: {
    type: String,
    maxlength: 100,
  },
  
  // Receipt Documentation
  receiptUrl: {
    type: String,
    required: true,
  },
  receiptFileName: {
    type: String,
    required: true,
  },
  receiptFileSize: {
    type: Number,
    min: 0,
  },
  receiptUploadedAt: {
    type: Date,
    default: Date.now,
  },
  
  // Status Management
  status: {
    type: String,
    enum: ['pending', 'under_review', 'verified', 'approved', 'processed', 'rejected'],
    default: 'pending',
  },
  
  // Admin Processing
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  
  // Admin Notes
  verificationNotes: {
    type: String,
    maxlength: 1000,
  },
  approvalNotes: {
    type: String,
    maxlength: 1000,
  },
  rejectionReason: {
    type: String,
    maxlength: 500,
  },
  
  // Financial Impact
  outstandingFeesBeforePayment: {
    type: Number,
    required: true,
    min: 0,
  },
  outstandingFeesAfterPayment: {
    type: Number,
    required: true,
    min: 0,
  },
  allocatedToFees: {
    type: Number,
    required: true,
    min: 0,
  },
  excessAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: Date,
  verifiedAt: Date,
  approvedAt: Date,
  processedAt: Date,
  rejectedAt: Date,
  
  // Related Records
  relatedBillingTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BillingTransaction",
  },
  relatedExcessCreditTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BillingTransaction",
  },
  
  // Audit Trail
  statusHistory: [{
    status: {
      type: String,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  }],
});
```

## 📊 Billing Transaction Schema

### BillingTransaction Schema
```javascript
const billingTransactionSchema = new mongoose.Schema({
  // User Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  // Transaction Details
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    enum: [
      'course_purchase', 'commission', 'admin_fee_received',
      'payout', 'instructor_payout', 'annual_fee', 'admin_fee_payment',
      'credit_addition', 'credit_payment', 'refund', 'refund_expense',
      'admin_fee', 'direct_transfer', 'payment_gateway'
    ],
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  
  // Balance Tracking
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'approved'],
    default: 'completed',
  },
  
  // Related Records
  relatedPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },
  relatedCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
  relatedPayoutRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PayoutRequest",
  },
  relatedRefundRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RefundRequest",
  },
  relatedAdminFeePayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdminFeePayment",
  },
  
  // Processing Information
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
  
  // Additional Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for Performance
billingTransactionSchema.index({ userId: 1, createdAt: -1 });
billingTransactionSchema.index({ category: 1, createdAt: -1 });
billingTransactionSchema.index({ status: 1 });
billingTransactionSchema.index({ relatedPayment: 1 });
```

## 🔍 Database Indexes and Performance

### Recommended Indexes
```javascript
// Payment Collection
db.payments.createIndex({ userId: 1, createdAt: -1 });
db.payments.createIndex({ courseId: 1 });
db.payments.createIndex({ status: 1 });
db.payments.createIndex({ method: 1 });
db.payments.createIndex({ stripeSessionId: 1 });

// InstructorBillingAccount Collection
db.instructorbillingaccounts.createIndex({ instructorId: 1 }, { unique: true });
db.instructorbillingaccounts.createIndex({ accountStatus: 1 });
db.instructorbillingaccounts.createIndex({ "payoutRequests.status": 1 });

// BillingTransaction Collection
db.billingtransactions.createIndex({ userId: 1, createdAt: -1 });
db.billingtransactions.createIndex({ category: 1, createdAt: -1 });
db.billingtransactions.createIndex({ status: 1 });
db.billingtransactions.createIndex({ relatedPayment: 1 });

// RefundRequest Collection
db.refundrequests.createIndex({ requesterId: 1, createdAt: -1 });
db.refundrequests.createIndex({ status: 1 });
db.refundrequests.createIndex({ refundType: 1 });
db.refundrequests.createIndex({ relatedPayment: 1 });

// AdminFeePayment Collection
db.adminfeepayments.createIndex({ instructorId: 1, createdAt: -1 });
db.adminfeepayments.createIndex({ status: 1 });
db.adminfeepayments.createIndex({ paymentDate: -1 });
```

## 🔧 Data Validation Rules

### Validation Middleware
```javascript
// Pre-save validation for financial consistency
billingTransactionSchema.pre('save', function(next) {
  // Validate balance calculation
  if (this.type === 'credit') {
    if (this.balanceAfter !== this.balanceBefore + this.amount) {
      return next(new Error('Invalid balance calculation for credit transaction'));
    }
  } else if (this.type === 'debit') {
    if (this.balanceAfter !== this.balanceBefore - this.amount) {
      return next(new Error('Invalid balance calculation for debit transaction'));
    }
  }
  next();
});

// Validate payout request amounts
payoutRequestSchema.pre('save', function(next) {
  if (this.amount <= 0) {
    return next(new Error('Payout amount must be positive'));
  }
  next();
});

// Validate refund amounts
refundRequestSchema.pre('save', function(next) {
  if (this.requestedAmount > this.originalAmount) {
    return next(new Error('Refund amount cannot exceed original amount'));
  }
  next();
});
```

## 📊 Data Aggregation Queries

### Common Aggregation Pipelines
```javascript
// Calculate instructor total earnings
const instructorEarnings = await BillingTransaction.aggregate([
  {
    $match: {
      userId: instructorId,
      category: 'commission',
      status: 'completed'
    }
  },
  {
    $group: {
      _id: null,
      totalEarnings: { $sum: '$amount' },
      transactionCount: { $sum: 1 }
    }
  }
]);

// Get monthly revenue breakdown
const monthlyRevenue = await Payment.aggregate([
  {
    $match: {
      status: 'paid',
      paidAt: {
        $gte: new Date(new Date().getFullYear(), 0, 1)
      }
    }
  },
  {
    $group: {
      _id: {
        year: { $year: '$paidAt' },
        month: { $month: '$paidAt' }
      },
      totalRevenue: { $sum: '$amount' },
      paymentCount: { $sum: 1 }
    }
  },
  {
    $sort: { '_id.year': 1, '_id.month': 1 }
  }
]);

// Calculate outstanding admin fees by instructor
const outstandingFees = await InstructorBillingAccount.aggregate([
  {
    $match: {
      owedAdminFees: { $gt: 0 }
    }
  },
  {
    $lookup: {
      from: 'users',
      localField: 'instructorId',
      foreignField: '_id',
      as: 'instructor'
    }
  },
  {
    $project: {
      instructorName: { $arrayElemAt: ['$instructor.name', 0] },
      instructorEmail: { $arrayElemAt: ['$instructor.email', 0] },
      outstandingAmount: '$owedAdminFees',
      totalPaid: '$totalAdminFeesPaid'
    }
  }
]);
```

---

*This comprehensive guide consolidates all data storage schemas and database structures used in the LearnTrack financial system.*
