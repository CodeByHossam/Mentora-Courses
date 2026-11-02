const logger = require('../../utils/logger');
const AdminFeePayment = require("../../models/AdminFeePayment");
const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
const AdminBillingAccount = require("../../models/AdminBillingAccount");
const BillingTransaction = require("../../models/BillingTransaction");
const User = require("../../models/User");
const { getBillingAccountByRole } = require("../../utils/specializedBillingUtils");
const { uploadFile, getFile } = require("../../utils/aws");

/**
 * Get instructor admin fee payments
 */

const getInstructorPayments = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { instructorId };
    if (status) query.status = status;

    const payments = await AdminFeePayment.find(query)
      .populate("reviewedBy", "name email")
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Generate signed URLs for receipts
    const paymentsWithSignedUrls = await Promise.all(
      payments.map(async (payment) => {
        const paymentObj = payment.toObject();
        if (paymentObj.receiptUrl) {
          try {
            paymentObj.receiptSignedUrl = await getReceiptSignedUrl(
              paymentObj.receiptUrl
            );
          } catch (error) {
            logger.error(
              "Error generating signed URL for payment:",
              paymentObj._id,
              error
            );
            paymentObj.receiptSignedUrl = null;
          }
        }
        return paymentObj;
      })
    );

    const total = await AdminFeePayment.countDocuments(query);

    // Get payment statistics
    const stats = await AdminFeePayment.getPaymentStats({ instructorId });

    res.json({
      success: true,
      data: {
        payments: paymentsWithSignedUrls,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("❌ Error fetching instructor payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin fee payments",
    });
  }
};

/**
 * Get instructor's outstanding admin fees
 */

const getOutstandingAdminFees = async (req, res) => {
  try {
    const instructorId = req.user._id;

    // Get instructor billing account
    const instructorAccount = await getBillingAccountByRole(
      instructorId,
      "instructor"
    );
    if (!instructorAccount) {
      return res.status(404).json({
        success: false,
        message: "Instructor billing account not found",
      });
    }

    const owedAdminFees =
      instructorAccount.owedAdminFees || instructorAccount.outstanding || 0;
    const totalAdminFeesPaid = instructorAccount.totalAdminFeesPaid || 0;
    const netOwedAdminFees = Math.max(0, owedAdminFees - totalAdminFeesPaid);

    res.json({
      success: true,
      data: {
        owedAdminFees,
        totalAdminFeesPaid,
        netOwedAdminFees,
        hasOutstandingFees: netOwedAdminFees > 0,
      },
    });
  } catch (error) {
    logger.error("❌ Error fetching outstanding admin fees:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch outstanding admin fees",
    });
  }
};


module.exports = {
  getInstructorPayments,
  getOutstandingAdminFees
};
