// Admin review of instructor admin-fee payments (pending, verify, approve, reject). Split from adminFeeAdminController.js; bodies unchanged.

const logger = require('../../utils/logger');
const AdminFeePayment = require("../../models/AdminFeePayment");
const {
  getReceiptSignedUrl,
  processAdminFeePaymentApproval,
} = require("./adminFeeApprovalProcessor");

/**
 * Submit admin fee payment (Instructor)
 */

const getPendingPayments = async (req, res) => {
  try {
    logger.info("🔍 ADMIN FEE PAYMENT - getPendingPayments called");
    logger.info("🔍 Request URL:", req.originalUrl);
    logger.info("🔍 Request Method:", req.method);

    const { page = 1, limit = 20, instructorId, paymentMethod } = req.query;

    const query = { status: { $in: ["pending", "under_review", "verified"] } };
    if (instructorId) query.instructorId = instructorId;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // Debug logging
    logger.info("🔍 Pending Payments Query:", query);

    const payments = await AdminFeePayment.find(query)
      .populate("instructorId", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName email")
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Generate signed URLs for receipts and format instructor data
    const paymentsWithSignedUrls = await Promise.all(
      payments.map(async (payment) => {
        const paymentObj = payment.toObject();

        // Add instructor name and email for frontend compatibility
        if (paymentObj.instructorId) {
          paymentObj.instructorName =
            `${paymentObj.instructorId.firstName || ""} ${
              paymentObj.instructorId.lastName || ""
            }`.trim() || "Unknown Instructor";
          paymentObj.instructorEmail = paymentObj.instructorId.email || "";
        }

        // Add reviewer name if exists
        if (paymentObj.reviewedBy) {
          paymentObj.reviewerName =
            `${paymentObj.reviewedBy.firstName || ""} ${
              paymentObj.reviewedBy.lastName || ""
            }`.trim() || "Unknown Admin";
        }

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

    // Debug logging
    logger.info("🔍 Pending Payments Found:", payments.length, "Total:", total);

    res.json({
      success: true,
      message: "Pending admin fee payments retrieved successfully",
      data: {
        payments: paymentsWithSignedUrls,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalCount: total,
          hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    logger.error("❌ Error fetching pending payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending payments",
    });
  }
};

/**
 * Verify admin fee payment (Admin)
 */

const verifyPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { verificationNotes } = req.body;
    const adminId = req.user._id;

    const payment = await AdminFeePayment.findById(paymentId).populate(
      "instructorId",
      "name email"
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "pending" && payment.status !== "under_review") {
      return res.status(400).json({
        success: false,
        message: "Payment cannot be verified in current status",
      });
    }

    payment.verify(adminId, verificationNotes);
    await payment.save();

    logger.info("✅ Admin fee payment verified:", {
      paymentId,
      instructorId: payment.instructorId._id,
      amount: payment.paymentAmount,
    });

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: { payment },
    });
  } catch (error) {
    logger.error("❌ Error verifying payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

/**
 * Approve admin fee payment (Admin)
 */

const approvePayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { approvalNotes } = req.body;
    const adminId = req.user._id;

    const payment = await AdminFeePayment.findById(paymentId).populate(
      "instructorId",
      "name email"
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Payment must be verified before approval",
      });
    }

    // Process the payment
    const result = await processAdminFeePaymentApproval(
      payment,
      adminId,
      approvalNotes
    );

    res.json({
      success: true,
      message: "Admin fee payment approved and processed successfully",
      data: result,
    });
  } catch (error) {
    logger.error("❌ Error approving admin fee payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve admin fee payment",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Reject admin fee payment (Admin)
 */

const rejectPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user._id;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const payment = await AdminFeePayment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status === "processed" || payment.status === "rejected") {
      return res.status(400).json({
        success: false,
        message: "Payment cannot be rejected in current status",
      });
    }

    payment.reject(adminId, rejectionReason);
    await payment.save();

    logger.info("✅ Admin fee payment rejected:", {
      paymentId,
      instructorId: payment.instructorId,
      amount: payment.paymentAmount,
    });

    res.json({
      success: true,
      message: "Payment rejected",
      data: { payment },
    });
  } catch (error) {
    logger.error("❌ Error rejecting payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject payment",
    });
  }
};

module.exports = {
  getPendingPayments,
  verifyPayment,
  approvePayment,
  rejectPayment
};
