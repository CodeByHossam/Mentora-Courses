const logger = require('../utils/logger');
const mongoose = require("mongoose");

// Import billing models
const StudentBillingAccount = require("./StudentBillingAccount");
const InstructorBillingAccount = require("./InstructorBillingAccount");
const AdminBillingAccount = require("./AdminBillingAccount");
const BillingTransaction = require("./BillingTransaction");



// models/Payment.js
/**
 * PAYMENT MODEL - COMPREHENSIVE ACCOUNTING SYSTEM
 * 
 * =============================================================================
 * BUSINESS LOGIC OVERVIEW:
 * =============================================================================
 * 
 * This model handles ALL payment flows in the Mentora platform:
 * 
 * 📋 PAYMENT TYPES:
 *   1. COURSE PAYMENTS - Student purchases course
 *   2. BILLING PAYMENTS - Credit additions, fee payments
 * 
 * 💰 PAYMENT FLOWS:
 * 
 *   🏦 DIRECT TRANSFER FLOW:
 *   Student → Instructor (full amount) → Instructor owes Admin (fees)
 *   - Student pays $100 to instructor directly
 *   - Instructor receives $100 immediately
 *   - Instructor owes admin $15 (admin fees)
 *   - Net instructor earning: $85
 * 
 *   💳 ELECTRONIC FLOW (Card/PayPal/Stripe):
 *   Student → Admin (full amount) → Admin owes Instructor (commission)
 *   - Student pays $100 to platform/admin
 *   - Admin receives $100 immediately
 *   - Admin keeps $15 (admin fees)
 *   - Admin owes instructor $85 (commission)
 * 
 * 🔄 TRANSACTION RECORDING:
 *   - Creates BillingTransaction records for audit trail
 *   - Updates specialized billing accounts (Admin/Instructor/Student)
 *   - Maintains balance tracking and financial integrity
 * 
 * 📊 CALCULATIONS:
 *   - adminFee = (finalAmount × adminPercentage ÷ 100) + adminFeeFixed
 *   - instructorAmount = finalAmount - adminFee
 *   - All amounts tracked with precision for accounting
 * 
 * 🔐 APPROVAL WORKFLOW:
 *   - Electronic payments: Auto-approved via gateway
 *   - Direct transfers: Require admin/instructor approval
 *   - Status tracking: pending → processing → completed/failed
 * 
 * =============================================================================
 * USAGE: Controllers should create Payment and call payment.completePayment(adminId)
 * =============================================================================






/**
 * CALCULATE PAYMENT SHARES & FEES
 * 
 * Automatically calculates admin fees and instructor amounts based on
 * platform settings and payment type. Sets transaction type based on
 * payment source for proper financial flow tracking.
 * 
 * CALCULATION FORMULAS:
 * - adminFee = (finalAmount × adminPercentage ÷ 100) + adminFeeFixed
 * - instructorAmount = finalAmount - adminFee
 * 
 * TRANSACTION TYPE LOGIC:
 * - Electronic payments: student_to_admin (platform receives payment)
 * - Direct transfers: student_to_instructor (instructor receives payment)
 * - Billing payments: billing_payment (credit operations)
 * 
 * @returns {Object} { adminFee, instructorAmount } - Calculated amounts
 */

// create a payment schema

const paymentSchema = new mongoose.Schema(
  {
    // 🔹 Who is paying
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Related entities
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    enrollmentRequest: { type: mongoose.Schema.Types.ObjectId, ref: "EnrollmentRequest" },

    // Payment classification
    type: { 
      type: String, 
      enum: ["course_payment", "billing_payment", "annual_fee", "commission_payment"], 
      default: "course_payment" 
    },
    paymentSource: { type: String, enum: ["electronic", "direct_transfer"], required: true, default: "electronic" },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // PAYMENT AMOUNTS
    originalAmount: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },

    // 📊 FEES
    adminPercentage: { type: Number, default: 10, min: 0, max: 100 },
    adminFeeFixed: { type: Number, default: 0, min: 0 },
    adminFee: { type: Number, default: 0, min: 0 },
    instructorAmount: { type: Number, default: 0, min: 0 },

    // 🔄 Transaction type
    transactionType: {
      type: String,
      enum: [
        "student_to_admin",
        "student_to_instructor",
        "admin_to_instructor",
        "instructor_to_admin",
        "billing_payment"
      ]
    },

    // 💳 Payment method
    method: {
      type: String,
      enum: ["stripe", "paypal", "direct_transfer", "credit_payment", "cash"],
      default: "stripe"
    },

    // 📋 Payment status
    status: {
      type: String,
      enum: [
        "pending",
        "pending_admin_approval",
        "processing",
        "completed",
        "paid",
        "failed",
        "refunded",
        "rejected",
        "cancelled"
      ],
      default: "pending"
    },
    paidAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // 📝 Metadata
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    // 🧾 Direct transfer info
    transfer: {
      receiptUrl: String,
      s3Key: String,
      bankName: String,
      accountNumberMasked: String,
      transferAmount: Number,
      transferDate: Date,
      referenceNumber: String,
      notes: String,
      submittedAt: Date
    },

    // ✅ Admin approval workflow
    adminApproval: {
      required: { type: Boolean, default: false },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      approvedAt: Date,
      rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      rejectedAt: Date,
      adminNotes: String
    },

    // 🔗 External gateway references
    stripePaymentIntentId: { type: String, sparse: true },
    stripeSessionId: { type: String, sparse: true },
    paypalOrderId: { type: String, sparse: true },
    paypalPaymentId: { type: String, sparse: true },
    paypalPayerId: { type: String, sparse: true },

    // 💸 Commission settlement tracking (for Admin -> Instructor payouts)
    commissionPaidAmount: { type: Number, default: 0 },
    isCommissionSettled: { type: Boolean, default: false },

    // 🗑️ Soft delete / void scaffolding
    isVoided: { type: Boolean, default: false },
    voidedAt: { type: Date, default: null },
    voidReason: { type: String, default: null },
    voidReversalId: { type: mongoose.Schema.Types.ObjectId, ref: "BillingTransaction", default: null }
  },
  { timestamps: true }
);

module.exports = paymentSchema;
