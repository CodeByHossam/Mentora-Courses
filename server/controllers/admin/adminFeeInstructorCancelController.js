const logger = require('../../utils/logger');
const AdminFeePayment = require("../../models/AdminFeePayment");
const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
const AdminBillingAccount = require("../../models/AdminBillingAccount");
const BillingTransaction = require("../../models/BillingTransaction");
const User = require("../../models/User");
const { getBillingAccountByRole } = require("../../utils/specializedBillingUtils");
const { uploadFile, getFile } = require("../../utils/aws");

/**
 * Cancel admin fee payment (Instructor)
 */

const cancelAdminFeePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const instructorId = req.user._id;

    const payment = await AdminFeePayment.findOne({
      _id: paymentId,
      instructorId,
      status: { $in: ["pending", "under_review"] },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found or cannot be cancelled",
      });
    }

    payment.addStatusChange(
      "cancelled",
      instructorId,
      reason || "Cancelled by instructor"
    );
    await payment.save();

    logger.info("✅ Admin fee payment cancelled:", {
      paymentId,
      instructorId,
      amount: payment.paymentAmount,
    });

    res.json({
      success: true,
      message: "Admin fee payment cancelled successfully",
      data: { payment },
    });
  } catch (error) {
    logger.error("❌ Error cancelling admin fee payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel admin fee payment",
    });
  }
};


module.exports = {
  cancelAdminFeePayment
};
