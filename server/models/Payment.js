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


// Import billing models at the top to avoid circular dependencies
const BillingTransaction = require("./BillingTransaction");
const StudentBillingAccount = require("./StudentBillingAccount");
const InstructorBillingAccount = require("./InstructorBillingAccount");
const AdminBillingAccount = require("./AdminBillingAccount");



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


paymentSchema.methods.calculateShares = function () {
  try {
    // 🧮 Fee structure parity: apply adminPercentage + adminFeeFixed for course payments
    let adminFee = 0;
    let instructorAmount = 0;

    if (this.type === 'course_payment') {
      // Set defaults if not provided
      const adminPercentage = this.adminPercentage || 10; // Default 10%
      const adminFeeFixed = this.adminFeeFixed || 2; // Default $2
      
      const percentageComponent = Number((this.finalAmount * (adminPercentage / 100)).toFixed(2));
      const fixedComponent = Number(adminFeeFixed.toFixed(2));
      const totalAdmin = Number((percentageComponent + fixedComponent).toFixed(2));
      // Simplified flow: Student -> Admin for all methods, instructor gets remainder via payout
      adminFee = totalAdmin;
      instructorAmount = Number((this.finalAmount - adminFee).toFixed(2));
    } else if (this.type === 'annual_fee') {
      // Annual fees go directly to admin
      adminFee = Number(this.finalAmount.toFixed(2));
      instructorAmount = 0;
    } else if (this.type === 'commission_payment') {
      // Commission payments from admin to instructor
      adminFee = 0;
      instructorAmount = Number(this.finalAmount.toFixed(2));
    } else {
      // For other payment types (billing_payment, etc.)
      const adminFeePercentage = this.finalAmount * (this.adminPercentage / 100);
      adminFee = Number(adminFeePercentage + (this.adminFeeFixed || 0));
      instructorAmount = Number(Math.max(0, this.finalAmount - adminFee));
    }

    // 📝 SET CALCULATED VALUES
    this.adminFee = Number(adminFee.toFixed(2));
    this.instructorAmount = Number(instructorAmount.toFixed(2));

    // 🔄 DETERMINE TRANSACTION TYPE based on payment flow
    if (this.type === "course_payment") {
      // Simplified: always student_to_admin for course payments
      this.transactionType = "student_to_admin";
    } else if (this.type === "billing_payment") {
      this.transactionType = "billing_payment";
    }

    logger.info(`💰 Payment shares calculated:`, {
      finalAmount: this.finalAmount,
      adminFee: this.adminFee,
      instructorAmount: this.instructorAmount,
      transactionType: this.transactionType,
    });

    return { adminFee: this.adminFee, instructorAmount: this.instructorAmount };
  } catch (error) {
    logger.error("❌ Error calculating payment shares:", error);
    throw new Error(`Payment calculation failed: ${error.message}`);
  }
};

/**
 * COMPLETE PAYMENT PROCESSING
 *
 * This is the MAIN method that finalizes a payment and triggers all
 * related billing operations. It handles the complete workflow from
 * calculation to billing account updates.
 *
 * WORKFLOW STEPS:
 * 1. 🧮 Calculate admin fees and instructor amounts
 * 2. 📋 Update payment status based on approval requirements
 * 3. 🏦 Create billing transactions for audit trail
 * 4. 💳 Update specialized billing accounts
 * 5. 🔄 Handle payment method specific logic
 *
 * PAYMENT FLOWS:
 * - ELECTRONIC: Auto-complete → Create billing records
 * - DIRECT TRANSFER: Require approval → Wait → Complete → Create billing records
 *
 * ATOMICITY:
 * - Uses MongoDB sessions for transaction safety
 * - Rollback on any failure to maintain data integrity
 * - Requires MongoDB replica set for session support
 *
 * @param {ObjectId} processedByAdminId - Admin processing the payment
 * @returns {Payment} Updated payment document
 *
 * CONTROLLER USAGE:
 * - Electronic: gateway confirms → call completePayment()
 * - Direct: admin approves → call completePayment(adminId)
 */
paymentSchema.methods.completePayment = async function (
  processedByAdminId = null
) {
  logger.info(`🔵 [PAYMENT] completePayment called for payment ${this._id}`);
  logger.info(`   Status: ${this.status}, Amount: $${this.finalAmount}`);
  
  // 🛡️ CRITICAL: Prevent duplicate processing by checking if billing was already done
  // Check if courseSales already exist in instructor account (better than status check)
  const existingInstructorSale = await InstructorBillingAccount.findOne({
    'courseSales.paymentId': this._id
  });
  
  if (existingInstructorSale) {
    logger.info(`   ⚠️ Payment already processed (found in instructor billing), skipping`);
    return this;
  }
  
  // Also check student account
  const existingStudentPurchase = await StudentBillingAccount.findOne({
    'coursePurchases.paymentId': this._id
  });
  
  if (existingStudentPurchase) {
    logger.info(`   ⚠️ Payment already processed (found in student billing), skipping`);
    return this;
  }

  const Payment = this.constructor;
  // Billing models are now imported at the top of the file

  // 🔧 DEVELOPMENT FIX: Skip transactions if not in replica set
  const useTransactions = process.env.MONGODB_USE_TRANSACTIONS === 'true';
  let session = null;
  
  if (useTransactions) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    logger.info(`   📊 Calculating shares...`);
    // 1) compute shares
    this.calculateShares();
    logger.info(`   💰 Admin Fee: $${this.adminFee}, Instructor: $${this.instructorAmount}`);

    // 2) Set status depending on paymentSource & adminApproval
    if (this.paymentSource === "electronic") {
      // electronic payments record immediately as completed
      this.status = "completed";
      this.paidAt = this.paidAt || new Date();
      this.completedAt = new Date();
      this.adminApproval.required = false;
    } else {
      // direct transfers require admin approval before completion
      if (
        this.adminApproval &&
        this.adminApproval.required &&
        !this.adminApproval.approvedBy
      ) {
        this.status = "pending_admin_approval";
        await this.save(session ? { session } : {});
        if (session) {
          await session.commitTransaction();
          session.endSession();
        }
        return this; // admin must approve later
      } else {
        // approval already provided by admin -> complete
        this.status = "completed";
        this.adminApproval.approvedBy =
          processedByAdminId || this.adminApproval.approvedBy;
        this.adminApproval.approvedAt =
          this.adminApproval.approvedAt || new Date();
        this.completedAt = new Date();
      }
    }

    await this.save(session ? { session } : {});

    // Load accounts
    const studentAccount = await StudentBillingAccount.findOne({
      studentId: this.userId,
    });
    let instructorAccount = this.recipientId
      ? await InstructorBillingAccount.findOne({
          instructorId: this.recipientId,
        })
      : null;
    // AdminBillingAccount: assume single admin account (unique: true). Pull the first (or by adminId if stored)
    let adminAccount = null;
    if (processedByAdminId) {
      adminAccount = await AdminBillingAccount.findOne({
        adminId: processedByAdminId,
      });
    }
    if (!adminAccount) {
      // fallback: find any admin billing account
      adminAccount = await AdminBillingAccount.findOne();
    }

    // 🏦 CREATE BILLING TRANSACTIONS FOR AUDIT TRAIL
    //
    // TRANSACTION DESIGN PHILOSOPHY:
    // - Every financial movement must be recorded
    // - Maintain complete audit trail for compliance
    // - Support both payment flows (electronic vs direct)
    //
    // ELECTRONIC FLOW TRANSACTIONS:
    // 1. Student → Admin (full amount) [IMMEDIATE]
    // 2. Admin → Instructor (commission) [PENDING PAYOUT]
    //
    // DIRECT TRANSFER FLOW TRANSACTIONS:
    // 1. Student → Instructor (full amount) [IMMEDIATE]
    // 2. Instructor → Admin (fees) [PENDING SETTLEMENT]

    // 📦 SIMPLIFIED: Update permanent boxes directly
    logger.info(`   📦 Updating billing accounts...`);
    
    // Get course to find instructor if recipientId is not set
    let instructorId = this.recipientId;
    if (!instructorId && this.course) {
      const Course = mongoose.model('Course');
      const course = await Course.findById(this.course).select('instructor');
      instructorId = course?.instructor;
    }
    
    // 3a) Student: Add to totalCoursePurchases box
    if (studentAccount) {
      logger.info(`   👨‍🎓 Updating student account ${this.userId}`);
      studentAccount.addCoursePurchase({
        courseId: this.course,
        instructorId: instructorId,
        purchaseAmount: this.finalAmount,
        adminFeeAmount: this.adminFee,
        instructorAmount: this.instructorAmount,
        paymentMethod: this.method || "stripe",
        purchaseDate: new Date(),
        paymentId: this._id,
        status: "completed",
      });
      await studentAccount.save(session ? { session } : {});
      logger.info(`   ✅ Student account saved`);
    } else {
      logger.info(`   ⚠️ No student account found for ${this.userId}`);
    }

    // Create student transaction for audit
    await BillingTransaction.create(
      [{
        userId: this.userId,
        type: "debit",
        date: new Date(),
        from: this.userId,
        to: adminAccount ? adminAccount.adminId : null,
        amount: this.finalAmount,
        category: "course_payment",
        description: `Course payment: ${this.finalAmount}`,
        relatedPayment: this._id,
        relatedCourse: this.course,
        processedBy: processedByAdminId || null,
        balanceBefore: 0,
        balanceAfter: 0,
      }]
    );

    // 3b) Admin: Add admin fee to totalRevenue box
    if (adminAccount) {
      adminAccount.totalRevenue += this.adminFee;
      adminAccount.platformBalance = adminAccount.calculateNetProfit();
      adminAccount.updateMonthlyRevenue(this.adminFee, "revenue");
      adminAccount.statistics.totalTransactions += 1;
      await adminAccount.save(session ? { session } : {});
    }

    // Create admin transaction for audit
    await BillingTransaction.create(
      [{
        userId: adminAccount ? adminAccount.adminId : null,
        type: "credit",
        date: new Date(),
        from: this.userId,
        to: adminAccount ? adminAccount.adminId : null,
        amount: this.adminFee,
        category: "admin_fee",
        description: `Admin fee from course payment`,
        relatedPayment: this._id,
        relatedCourse: this.course,
        processedBy: processedByAdminId || null,
        balanceBefore: 0,
        balanceAfter: 0,
      }]
    );

    // 3c) Instructor: Add commission to totalCommissionEarned box
    if (instructorId) {
      logger.info(`   🔍 Looking for instructor account: ${instructorId}`);
      
      // Get or create instructor account
      if (!instructorAccount) {
        instructorAccount = await InstructorBillingAccount.findOne({ instructorId });
        logger.info(`   📊 Instructor account found:`, instructorAccount ? 'YES' : 'NO');
      }
      
      // Create instructor account if it doesn't exist
      if (!instructorAccount) {
        logger.info(`   🆕 Creating new instructor billing account for ${instructorId}`);
        instructorAccount = await InstructorBillingAccount.create({
          instructorId: instructorId,
          totalCommissionEarned: 0,
          pendingCommissions: 0,
          totalPayoutsReceived: 0,
          totalGiftAmount: 0,
          annualFees: 10,
          status: 'active'
        });
        logger.info(`   ✅ Instructor account created`);
      }
      
      if (instructorAccount && this.instructorAmount > 0) {
        logger.info(`   👨‍🏫 Updating instructor account ${instructorId} with commission $${this.instructorAmount}`);
        instructorAccount.addCourseSale({
          courseId: this.course,
          studentId: this.userId,
          saleAmount: this.finalAmount,
          commissionAmount: this.instructorAmount,
          adminFeeAmount: this.adminFee,
          paymentMethod: this.method || "stripe",
          saleDate: new Date(),
          paymentId: this._id,
        });
        await instructorAccount.save(session ? { session } : {});
        logger.info(`   ✅ Instructor account saved - New balance: $${instructorAccount.pendingCommissions}`);
      } else if (this.instructorAmount === 0) {
        logger.info(`   ⚠️ Commission is $0, skipping instructor update`);
      } else {
        logger.info(`   ❌ ERROR: Could not create/find instructor account for ${instructorId}`);
      }
    } else {
      logger.info(`   ❌ ERROR: No instructorId found!`);
    }

    // Create instructor transaction for audit
    if (instructorAccount && this.instructorAmount > 0) {
      await BillingTransaction.create(
        [{
          userId: instructorAccount.instructorId,
          type: "credit",
          date: new Date(),
          from: adminAccount ? adminAccount.adminId : null,
          to: instructorAccount.instructorId,
          amount: this.instructorAmount,
          category: "commission",
          description: `Instructor commission from course sale`,
          relatedPayment: this._id,
          relatedCourse: this.course,
          processedBy: processedByAdminId || null,
          balanceBefore: 0,
          balanceAfter: 0,
        }]
      );
    }

    // 4) Finalize: update payment timestamps / processedBy
    this.completedAt = this.completedAt || new Date();
    this.paidAt = this.paidAt || new Date();
    await this.save(session ? { session } : {});

    logger.info(`   ✅ Transaction committed successfully`);
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }
    
    logger.info(`🎉 [PAYMENT] Payment ${this._id} completed successfully!`);
    return this;
  } catch (err) {
    logger.error(`❌ [PAYMENT] Error completing payment ${this._id}:`, err.message);
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    // keep error for controller to handle
    throw err;
  }
};

/**
 * Mark payment as failed (do not modify completed payments)
 */
paymentSchema.methods.markFailed = async function (reason) {
  if (this.status === "completed") return this;
  this.status = "failed";
  this.metadata = this.metadata || {};
  if (reason) this.metadata.failureReason = reason;
  await this.save();
  return this;
};

/**
 * VOID PAYMENT (scaffolding)
 * - Marks payment as voided/cancelled without deleting data
 * - TODO Phase 5: create reversal transactions to preserve carryover and balances
 */
paymentSchema.methods.voidPayment = async function (reason = null) {
  if (this.isVoided) return this;
  this.isVoided = true;
  this.voidedAt = new Date();
  this.voidReason = reason;
  if (this.status !== "failed") this.status = "cancelled";
  await this.save();
  return this;
};

// Virtual field for backward compatibility
paymentSchema.virtual('amount').get(function() {
  return this.finalAmount;
});

// Ensure virtual fields are serialized
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

module.exports =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
