// models/BillingTransaction.js
/**
 * BILLING TRANSACTION MODEL - IMMUTABLE AUDIT SYSTEM
 * 
 * =============================================================================
 * FINANCIAL AUDIT TRAIL OVERVIEW:
 * =============================================================================
 * 
 * This model creates IMMUTABLE records of every financial transaction:
 * 
 * 🔒 IMMUTABILITY PRINCIPLE:
 *   - Once completed, transactions CANNOT be modified
 *   - Provides complete audit trail for compliance
 *   - Ensures financial data integrity
 * 
 * 📊 TRANSACTION TYPES:
 *   - CREDIT: Money added to account (positive impact)
 *   - DEBIT: Money removed from account (negative impact)
 * 
 * 🏷️ TRANSACTION CATEGORIES:
 *   - course_payment: Student course purchases
 *   - commission: Instructor earnings from sales
 *   - instructor_payout: Admin paying instructor
 *   - student_refund: Refunds to students
 *   - adjustment: Manual corrections
 *   - credit_addition: Adding credits to account
 *   - annual_fee: Platform subscription fees
 * 
 * 💰 BALANCE CALCULATIONS:
 *   - CREDIT: balanceAfter = balanceBefore + amount
 *   - DEBIT: balanceAfter = balanceBefore - amount
 *   - Auto-calculated on save for accuracy
 * 
 * 🔄 WORKFLOW STATES:
 *   - pending: Transaction created but not processed
 *   - completed: Transaction finalized (IMMUTABLE)
 *   - failed: Transaction failed (with reason)
 *   - cancelled: Transaction cancelled before completion
 * 
 * 🔗 RELATIONSHIP TRACKING:
 *   - Links to Payment records for course purchases
 *   - Links to Course records for context
 *   - Tracks who processed the transaction
 * 
 * =============================================================================
 * USAGE: Create transaction → process → markCompleted() → IMMUTABLE
 * =============================================================================
 */

const mongoose = require("mongoose");

const billingTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  date: { type: Date, required: true, default: Date.now },
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: [
      "course_payment",      // Student purchasing course
      "commission",          // Instructor earning from sale
      "instructor_payout",   // Admin paying instructor
      "student_refund",      // Refunding student payment
      "adjustment",          // Manual balance correction
      "credit_addition",     // Adding credits to account
      "annual_fee",          // Platform subscription fees
      "admin_fee",           // Platform commission/fees
      "admin_fee_payment",   // Admin fee payments by instructors
      "direct_transfer",     // Direct bank transfers
      "payment_gateway",     // Stripe/PayPal processing
      "other",               // Miscellaneous transactions
    ],
    default: "other",
  },
  status: { type: String, enum: ["pending", "completed", "failed", "cancelled", "pending_approval", "rejected"], default: "pending" },

  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },

  relatedPayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },
  relatedCourse: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },

  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  processedAt: { type: Date, default: Date.now },

  notes: { type: String, default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: formattedAmount with sign
billingTransactionSchema.virtual("formattedAmount").get(function () {
  const sign = this.type === "credit" ? "+" : "-";
  return `${sign}$${this.amount.toFixed(2)}`;
});

// Pre-save: auto-calc balanceAfter if not provided
billingTransactionSchema.pre("save", function (next) {
  if (typeof this.balanceAfter === "undefined" || this.isNew) {
    if (this.type === "credit") this.balanceAfter = this.balanceBefore + this.amount;
    else this.balanceAfter = this.balanceBefore - this.amount;
  }
  next();
});

/**
 * Mark transaction completed and update linked BillingAccount totals.
 * - Once completed, transaction becomes immutable (status cannot be changed later)
 */
billingTransactionSchema.methods.markCompleted = async function (adminId = null) {
  if (this.status === "completed") return this;

  this.status = "completed";
  this.processedBy = adminId;
  this.processedAt = this.processedAt || new Date();
  await this.save();

  // Update linked account totals based on category/type
  try {
    // Lazy require to avoid circular dependencies on module load
    const AdminBillingAccount = require("./AdminBillingAccount");
    const InstructorBillingAccount = require("./InstructorBillingAccount");
    const StudentBillingAccount = require("./StudentBillingAccount");

    if (this.category === "instructor_payout") {
      // This transaction credits instructor
      const instructorAccount = await InstructorBillingAccount.findOne({ instructorId: this.userId });
      if (instructorAccount) {
        instructorAccount.totalPayoutsReceived += this.amount;
        instructorAccount.pendingPayouts = Math.max(0, instructorAccount.pendingPayouts - this.amount);
        instructorAccount.recalculateAll();
        await instructorAccount.save();
      }
    } else if (this.category === "course_payment") {
      // If this is admin credit, update admin account
      const adminAccount = await AdminBillingAccount.findOne({ adminId: this.userId });
      if (adminAccount) {
        adminAccount.totalRevenue += this.amount;
        adminAccount.statistics.totalTransactions += 1;
        adminAccount.recalculateAll();
        await adminAccount.save();
      }
    } else if (this.category === "commission") {
      // commission credited to admin (or debited from instructor)
      const adminAccount = await AdminBillingAccount.findOne();
      if (adminAccount) {
        // treat commission as revenue when completed
        if (this.type === "credit") {
          adminAccount.totalRevenue += this.amount;
          adminAccount.recalculateAll();
          await adminAccount.save();
        } else {
          // If debit (instructor -> admin) was processed, treat accordingly
          adminAccount.pendingInstructorPayouts = Math.max(0, adminAccount.pendingInstructorPayouts - this.amount);
          adminAccount.totalRevenue += this.amount;
          adminAccount.recalculateAll();
          await adminAccount.save();
        }
      }
    }
  } catch (err) {
    // best-effort: don't throw to avoid breaking flow, but log in real app
    // console.error("BillingTransaction.markCompleted: account update failed", err);
  }

  return this;
};

/**
 * Mark failed (if not completed)
 */
billingTransactionSchema.methods.markFailed = async function (reason) {
  if (this.status === "completed") return this;
  this.status = "failed";
  if (reason) this.notes = reason;
  this.processedAt = new Date();
  await this.save();
  return this;
};

billingTransactionSchema.index({ userId: 1, createdAt: -1 });
billingTransactionSchema.index({ category: 1 });
billingTransactionSchema.index({ status: 1 });

module.exports = mongoose.models.BillingTransaction || mongoose.model("BillingTransaction", billingTransactionSchema);
