const Payment = require("../models/Payment");
const mongoose = require("mongoose");

const COMPLETED_STATUSES = ["completed", "paid"];

async function getAdminSummary({ from, to } = {}) {
  const match = { status: { $in: COMPLETED_STATUSES }, type: "course_payment" };
  if (from || to) {
    match.completedAt = {};
    if (from) match.completedAt.$gte = new Date(from);
    if (to) match.completedAt.$lte = new Date(to);
  }

  const [totals] = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$finalAmount" },
        totalCommission: { $sum: "$adminFee" },
        totalInstructorAmount: { $sum: "$instructorAmount" },
        totalSales: { $sum: 1 },
      },
    },
  ]);

  const monthly = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$completedAt" } },
        revenue: { $sum: "$finalAmount" },
        commission: { $sum: "$adminFee" },
        sales: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    totalRevenue: totals?.totalRevenue || 0,
    totalCommission: totals?.totalCommission || 0,
    totalInstructorAmount: totals?.totalInstructorAmount || 0,
    totalSales: totals?.totalSales || 0,
    monthly,
  };
}

async function getStudentSummary(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const payments = await Payment.find({ userId: uid, type: "course_payment" })
    .sort({ createdAt: -1 })
    .lean();

  const completed = payments.filter((p) => COMPLETED_STATUSES.includes(p.status));
  return {
    totalSpent: completed.reduce((s, p) => s + (p.finalAmount || 0), 0),
    totalPurchases: completed.length,
    pendingPayments: payments.filter((p) => p.status === "pending" || p.status === "pending_admin_approval").length,
    payments,
  };
}

async function getInstructorSummary(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const payments = await Payment.find({ type: "course_payment", recipientId: uid })
    .sort({ createdAt: -1 })
    .lean();

  // Fallback: if recipientId is not populated, match by course instructor via separate query
  let resolved = payments;
  if (payments.length === 0) {
    const Course = require("../models/Course");
    const courses = await Course.find({ instructor: uid }).select("_id").lean();
    const courseIds = courses.map((c) => c._id);
    resolved = await Payment.find({ type: "course_payment", course: { $in: courseIds } })
      .sort({ createdAt: -1 })
      .lean();
  }

  const completed = resolved.filter((p) => COMPLETED_STATUSES.includes(p.status));
  const totalEarnings = completed.reduce((s, p) => s + (p.instructorAmount || 0), 0);
  const pendingEarnings = resolved
    .filter((p) => p.status === "pending" || p.status === "pending_admin_approval")
    .reduce((s, p) => s + (p.instructorAmount || 0), 0);

  return {
    totalEarnings,
    pendingEarnings,
    totalSales: completed.length,
    payments: resolved,
  };
}

module.exports = {
  getAdminSummary,
  getStudentSummary,
  getInstructorSummary,
};
