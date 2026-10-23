// models/AdminBillingAccount.js
/**
 * AdminBillingAccount
 *
 * - Tracks platform revenue (admin fees), platform balance, instructor payouts, refunds.
 * - Provides methods to record revenue and payouts, update monthly metrics and recalculate totals.
 *
 * Equations:
 *  - platformBalance = totalRevenue - totalInstructorPayouts - totalStudentRefunds - totalExpenses
 *  - profitMargin (%) = (platformBalance / totalRevenue) * 100   (if totalRevenue > 0)
 */

const mongoose = require("mongoose");

const adminBillingAccountSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

  totalRevenue: { type: Number, default: 0 }, // sum of admin fees & platform revenue
  platformBalance: { type: Number, default: 0 },

  totalInstructorPayouts: { type: Number, default: 0 },
  totalStudentRefunds: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },

  monthlyRevenue: [{
    month: { type: String, required: true }, // "YYYY-MM"
    revenue: { type: Number, default: 0 },
    payouts: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],

  statistics: {
    totalTransactions: { type: Number, default: 0 },
    averageTransactionAmount: { type: Number, default: 0 },
    totalCoursesSold: { type: Number, default: 0 },
    totalActiveInstructors: { type: Number, default: 0 },
    totalActiveStudents: { type: Number, default: 0 },
    lastRevenueUpdate: { type: Date, default: null },
    profitMargin: { type: Number, default: 0 }
  },

  status: { type: String, enum: ["active", "maintenance", "suspended"], default: "active" },

  settings: {
    autoPayoutThreshold: { type: Number, default: 100 },
    defaultCommissionRate: { type: Number, default: 10 }, // %
    defaultAdminFee: { type: Number, default: 2 },
    payoutSchedule: { type: String, enum: ["weekly", "monthly", "manual"], default: "monthly" }
  }
}, {
  timestamps: true,
  collection: "adminbillingaccounts"
});

/**
 * calculateNetProfit:
 *  platformBalance = totalRevenue - totalInstructorPayouts - totalStudentRefunds - totalExpenses
 */
adminBillingAccountSchema.methods.calculateNetProfit = function () {
  return this.totalRevenue - this.totalInstructorPayouts - this.totalStudentRefunds - this.totalExpenses;
};

adminBillingAccountSchema.methods.updateMonthlyRevenue = function (amount, type = 'revenue') {
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  let monthlyRecord = this.monthlyRevenue.find(m => m.month === currentMonth);
  if (!monthlyRecord) {
    monthlyRecord = { month: currentMonth, revenue: 0, payouts: 0, netProfit: 0, createdAt: new Date() };
    this.monthlyRevenue.push(monthlyRecord);
  }

  if (type === 'revenue') {
    monthlyRecord.revenue += amount;
    this.totalRevenue += amount;
  } else if (type === 'payout') {
    monthlyRecord.payouts += amount;
    this.totalInstructorPayouts += amount;
    // pendingInstructorPayouts removed - use instructor's pendingCommissions instead
  }

  monthlyRecord.netProfit = monthlyRecord.revenue - monthlyRecord.payouts;
  this.platformBalance = this.calculateNetProfit();
  this.statistics.lastRevenueUpdate = new Date();
};

adminBillingAccountSchema.methods.recalculateAll = function () {
  this.platformBalance = this.calculateNetProfit();

  if (this.statistics.totalTransactions > 0) {
    this.statistics.averageTransactionAmount = this.totalRevenue / this.statistics.totalTransactions;
  }

  if (this.totalRevenue > 0) {
    this.statistics.profitMargin = Number(((this.calculateNetProfit() / this.totalRevenue) * 100).toFixed(2));
  }
};

/**
 * recordRevenue:
 *  - amount: amount to add to revenue
 *  - source: optional string
 *  - updates monthly stats, totalRevenue and platformBalance
 */
adminBillingAccountSchema.methods.recordRevenue = async function (amount, source = 'payment') {
  this.updateMonthlyRevenue(amount, 'revenue');
  this.statistics.totalTransactions += 1;
  this.recalculateAll();
  await this.save();
};

/**
 * recordPayout:
 *  - amount: amount paid to instructors
 *  - updates payouts, pending amounts and platformBalance
 */
adminBillingAccountSchema.methods.recordPayout = async function (amount) {
  this.updateMonthlyRevenue(amount, 'payout');
  this.totalInstructorPayouts += amount;
  this.recalculateAll();
  await this.save();
};

adminBillingAccountSchema.index({ adminId: 1 });

module.exports = mongoose.models.AdminBillingAccount || mongoose.model("AdminBillingAccount", adminBillingAccountSchema);
