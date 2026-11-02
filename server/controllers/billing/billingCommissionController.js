const logger = require('../../utils/logger');
const AdminBillingAccount = require("../../models/AdminBillingAccount");
const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
const StudentBillingAccount = require("../../models/StudentBillingAccount");
const BillingTransaction = require("../../models/BillingTransaction");
const Payment = require("../../models/Payment");
const {
  getBillingAccountByRole,
} = require("../../utils/specializedBillingUtils");
const { uploadFile, getFile, deleteFile } = require("../../utils/aws");
const { sanitizeHtml, sanitizeText, sanitizeObjectId, sanitizeNumber } = require("../../utils/sanitizer");

/**
 * Admin -> Instructor direct payout (SIMPLIFIED - No payout requests)
 * @route POST /api/specialized-billing/admin/payout/:instructorId
 * @access Private (Admin only)
 */
const payoutInstructorCommission = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin role required." });
    }

    const instructorId = sanitizeObjectId(req.params.instructorId);
    const amountRequested = Number(req.body.amount);
    const notes = req.body.notes || null;

    if (!instructorId || isNaN(amountRequested) || amountRequested <= 0) {
      return res.status(400).json({ success: false, message: "Valid instructorId and amount are required" });
    }

    const adminAccount = await getOrCreateAdminAccount();
    const instructorAccount = await InstructorBillingAccount.findOne({ instructorId });
    if (!instructorAccount) {
      return res.status(404).json({ success: false, message: "Instructor billing account not found" });
    }

    // 📦 SIMPLIFIED: Check pending commissions
    const payoutAmount = Math.min(amountRequested, instructorAccount.pendingCommissions);
    if (payoutAmount <= 0) {
      return res.status(400).json({ success: false, message: "No pending commissions to pay" });
    }

    const now = new Date();

    // Create billing transactions
    await BillingTransaction.create([
      {
        userId: adminAccount.adminId,
        type: "debit",
        date: now,
        from: adminAccount.adminId,
        to: instructorId,
        amount: payoutAmount,
        description: `Instructor commission payout: $${payoutAmount}`,
        category: "instructor_payout",
        status: "completed",
        relatedPayment: null,
        processedBy: req.user._id,
      },
      {
        userId: instructorId,
        type: "credit",
        date: now,
        from: adminAccount.adminId,
        to: instructorId,
        amount: payoutAmount,
        description: `Commission payout received: $${payoutAmount}`,
        category: "instructor_payout",
        status: "completed",
        relatedPayment: null,
        processedBy: req.user._id,
      },
    ]);

    // 📦 SIMPLIFIED: Use processPayout method
    instructorAccount.processPayout(payoutAmount, req.user._id, notes);
    await instructorAccount.save();

    // Update admin account
    adminAccount.totalInstructorPayouts += payoutAmount;
    adminAccount.platformBalance = adminAccount.totalRevenue - adminAccount.totalInstructorPayouts;
    await adminAccount.save();

    return res.status(200).json({
      success: true,
      message: "Payout processed successfully",
      data: {
        instructorId,
        payoutAmount,
        pendingCommissions: instructorAccount.pendingCommissions,
        totalEarned: instructorAccount.totalCommissionEarned,
        totalPaidOut: instructorAccount.totalPayoutsReceived,
        availableBalance: instructorAccount.calculateAvailableBalance(),
      },
    });
  } catch (error) {
    logger.error("❌ payoutInstructorCommission error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to process payout" });
  }
};


module.exports = {
  payoutInstructorCommission
};
