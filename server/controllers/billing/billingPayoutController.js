// Admin instructor payout processing (receipt upload, account updates, audit transaction). Split from routes/BillingRoutes.js; handler bodies unchanged.

const processInstructorPayout = async (req, res) => {
  try {
    const { instructorId, amount, transactionReference, notes } = req.body;
    const adminId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Payment receipt is required" });
    }

    // Upload receipt to S3
    const { uploadFile } = require("../../utils/aws");
    const uploadResult = await uploadFile(req.file, "instructor-payout-receipts");
    const receiptUrl = uploadResult.key;

    // Get instructor billing account
    const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
    const instructorAccount = await InstructorBillingAccount.findOne({ instructorId });

    if (!instructorAccount) {
      return res.status(404).json({ success: false, message: "Instructor billing account not found" });
    }

    const payoutAmount = parseFloat(amount);

    console.log(`💰 Processing payout for instructor ${instructorId}:`);
    console.log(`   Payout Amount: $${payoutAmount}`);
    console.log(`   Pending Commissions: $${instructorAccount.pendingCommissions}`);
    console.log(`   Total Earned: $${instructorAccount.totalCommissionEarned}`);

    if (payoutAmount > instructorAccount.pendingCommissions) {
      return res.status(400).json({
        success: false,
        message: `Payout amount ($${payoutAmount}) exceeds pending commissions ($${instructorAccount.pendingCommissions})`
      });
    }

    // Update instructor billing account
    const balanceBefore = instructorAccount.pendingCommissions;
    instructorAccount.pendingCommissions -= payoutAmount;
    instructorAccount.totalPayoutsReceived += payoutAmount;
    const balanceAfter = instructorAccount.pendingCommissions;
    await instructorAccount.save();

    // Update admin billing account
    const AdminBillingAccount = require("../../models/AdminBillingAccount");
    const adminAccount = await AdminBillingAccount.findOne({ adminId });

    if (adminAccount) {
      adminAccount.totalInstructorPayouts += payoutAmount;
      adminAccount.platformBalance = adminAccount.calculateNetProfit();
      await adminAccount.save();
    }

    // Create billing transaction for audit trail
    const BillingTransaction = require("../../models/BillingTransaction");
    await BillingTransaction.create({
      userId: instructorId,
      type: "credit",
      amount: payoutAmount,
      category: "instructor_payout",
      description: `Instructor payout - ${transactionReference}`,
      status: "completed",
      from: adminId,
      to: instructorId,
      processedBy: adminId,
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      metadata: {
        transactionReference,
        receiptUrl,
        notes,
        processedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: "Payout processed successfully",
      data: {
        instructorId,
        amount: payoutAmount,
        transactionReference,
        receiptUrl,
        newPendingCommissions: instructorAccount.pendingCommissions,
        totalPayoutsReceived: instructorAccount.totalPayoutsReceived
      }
    });
  } catch (error) {
    console.error("Error processing instructor payout:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process payout"
    });
  }
};

module.exports = {
  processInstructorPayout
};
