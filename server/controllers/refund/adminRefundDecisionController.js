// Admin refund approve/reject/cancel decisions. Split from adminRefundController.js; bodies unchanged.

const logger = require('../../utils/logger');
const RefundRequest = require("../../models/RefundRequest");
const GiftCard = require("../../models/GiftCard");
const Notification = require("../../models/Notification");
const {
  processStudentRefundApproval,
  processInstructorRefundApproval,
} = require("./adminRefundApprovalProcessors");

/**
 * Approve refund request (Admin)
 */

const approveRefund = async (req, res) => {
  try {
    const { refundId } = req.params;
    const { adminNotes, refundMethod = "gift_card" } = req.body; // Default to gift card
    const adminId = req.user._id;
    const receiptFile = req.file; // From multer middleware

    const refundRequest = await RefundRequest.findById(refundId)
      .populate("requesterId", "name email role")
      .populate("relatedCourse", "title")
      .populate("relatedPayment");

    if (!refundRequest) {
      return res.status(404).json({
        success: false,
        message: "Refund request not found",
      });
    }

    if (
      refundRequest.status !== "pending" &&
      refundRequest.status !== "under_review"
    ) {
      return res.status(400).json({
        success: false,
        message: `Refund request cannot be approved in current status`,
      });
    }

    // Calculate refund amount
    const refundAmount = refundRequest.requestedAmount;

    // Process refund as gift card
    let giftCard = null;
    let billingTransaction = null;

    if (refundMethod === "gift_card") {
      // Create gift card for refund using static method
      const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

      giftCard = await GiftCard.createGiftCard(
        refundRequest.requesterId._id,
        refundRequest.requestedAmount,
        "compensation",
        expiryDate,
        {
          description: `Refund for ${refundRequest.reason}`,
          issuedBy: adminId,
          adminNotes: adminNotes || `Refund approved for request #${refundRequest._id.toString().slice(-6)}`,
          metadata: {
            refundRequestId: refundRequest._id,
            refundReason: refundRequest.reason,
            refundType: refundRequest.refundType
          }
        }
      );

      logger.info("🎁 Gift card created for refund:", {
        cardNumber: giftCard.cardNumber,
        amount: giftCard.amount,
        userId: giftCard.userId,
      });

      // Create notification for admin about gift card issuance
      await Notification.create({
        recipient: adminId,
        type: "gift_card",
        title: "Gift Card Issued for Refund",
        message: `Gift card issued for ${
          refundRequest.requesterId.name || "user"
        } - Amount: $${giftCard.amount} - Refund #${refundRequest._id
          .toString()
          .slice(-6)}`,
        relatedModel: "GiftCard",
        relatedId: giftCard._id,
        priority: "normal",
        actionUrl: "/admin/gift-cards",
      });

      // Create notification for user about refund approval
      await Notification.create({
        recipient: refundRequest.requesterId._id,
        type: "refund",
        title: "Refund Request Approved",
        message: `Your refund request for $${giftCard.amount} has been approved and processed as a gift card. The gift card is now available in your account.`,
        relatedModel: "GiftCard",
        relatedId: giftCard._id,
        priority: "high",
        actionUrl: `/${refundRequest.requesterType}/gift-cards`,
      });

      logger.info("📢 Notifications created for gift card issuance");
    } else {
      // Process traditional refund
      if (refundRequest.requesterType === "student") {
        billingTransaction = await processStudentRefundApproval(
          refundRequest,
          adminId
        );
      } else if (refundRequest.requesterType === "instructor") {
        billingTransaction = await processInstructorRefundApproval(
          refundRequest,
          adminId
        );
      }
    }

    // Update refund request
    refundRequest.status = "approved";
    refundRequest.approvedBy = adminId;
    refundRequest.approvedAt = new Date();
    refundRequest.adminNotes = adminNotes;
    refundRequest.refundMethod = refundMethod;
    refundRequest.processedAmount = refundAmount;

    if (refundMethod === "gift_card" && giftCard) {
      refundRequest.relatedGiftCard = giftCard._id;
    }
    await refundRequest.save();

    logger.info("✅ Refund request approved:", {
      refundId,
      requesterType: refundRequest.requesterType,
      amount: refundRequest.requestedAmount,
      refundMethod,
      giftCardId: giftCard?._id,
      billingTransactionId: billingTransaction?._id,
    });

    res.json({
      success: true,
      message:
        refundMethod === "gift_card"
          ? "Refund approved and gift card issued successfully"
          : "Refund request approved successfully",
      data: {
        refundRequest,
        giftCard,
        billingTransaction,
        receiptUrl,
      },
    });
  } catch (error) {
    logger.error("❌ Error approving refund request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve refund request",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Reject refund request (Admin)
 */

const rejectRefund = async (req, res) => {
  try {
    const { refundId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id;

    if (!adminNotes) {
      return res.status(400).json({
        success: false,
        message: "Admin notes are required for rejection",
      });
    }

    const refundRequest = await RefundRequest.findById(refundId);
    if (!refundRequest) {
      return res.status(404).json({
        success: false,
        message: "Refund request not found",
      });
    }

    if (
      refundRequest.status !== "pending" &&
      refundRequest.status !== "under_review"
    ) {
      return res.status(400).json({
        success: false,
        message: "Refund request cannot be rejected in current status",
      });
    }

    refundRequest.reject(adminId, adminNotes);
    await refundRequest.save();

    logger.info("✅ Refund request rejected:", {
      refundId,
      requesterType: refundRequest.requesterType,
      amount: refundRequest.requestedAmount,
    });

    res.json({
      success: true,
      message: "Refund request rejected",
      data: { refundRequest },
    });
  } catch (error) {
    logger.error("❌ Error rejecting refund request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject refund request",
    });
  }
};

/**
 * Cancel refund request
 */

const cancelRefund = async (req, res) => {
  try {
    const { refundId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const refund = await RefundRequest.findById(refundId);

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund request not found",
      });
    }

    // Check permissions
    if (
      userRole !== "admin" &&
      refund.requesterId.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this refund request",
      });
    }

    // Can only cancel pending requests
    if (refund.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only cancel pending refund requests",
      });
    }

    refund.status = "cancelled";
    refund.adminNotes = "Cancelled by user";
    refund.processedAt = new Date();

    await refund.save();

    res.json({
      success: true,
      message: "Refund request cancelled successfully",
      data: refund,
    });
  } catch (error) {
    logger.error("Error cancelling refund:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel refund request",
    });
  }
};

module.exports = {
  approveRefund,
  rejectRefund,
  cancelRefund
};
