const logger = require('../utils/logger');
// controllers/refundController.js
/**
 * Refund Request Controller
 *
 * Handles refund requests from students and instructors
 * - Student course refunds
 * - Instructor admin fee overpayment refunds
 * - Admin approval/rejection workflow
 * - Complete transaction synchronization
 */

const RefundRequest = require("../models/RefundRequest");
const StudentBillingAccount = require("../models/StudentBillingAccount");
const InstructorBillingAccount = require("../models/InstructorBillingAccount");
const AdminBillingAccount = require("../models/AdminBillingAccount");
const BillingTransaction = require("../models/BillingTransaction");
const Payment = require("../models/Payment");
const Course = require("../models/Course");
const User = require("../models/User");
const GiftCard = require("../models/GiftCard");
const Notification = require("../models/Notification");
const { getBillingAccountByRole } = require("../utils/specializedBillingUtils");
const { uploadFile } = require("../utils/aws");

/**
 * 🎓 STUDENT REFUND REQUESTS
 */

/**
 * Create student course refund request
 */
const createStudentRefund = async (req, res) => {
  try {
    const { courseId, paymentId, reason, description, requestedAmount } =
      req.body;
    const studentId = req.user._id;

    // Validate course and payment
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment || payment.userId.toString() !== studentId.toString()) {
      return res.status(404).json({
        success: false,
        message: "Payment not found or unauthorized",
      });
    }

    // Check if refund already exists for this payment
    const existingRefund = await RefundRequest.findOne({
      requesterId: studentId,
      relatedPayment: paymentId,
      status: { $in: ["pending", "under_review", "approved"] },
    });

    if (existingRefund) {
      return res.status(400).json({
        success: false,
        message: "A refund request already exists for this payment",
      });
    }

    // Handle supporting document uploads
    const supportingDocuments = [];
    if (req.files && req.files.length > 0) {
      logger.info(`📎 Processing ${req.files.length} supporting documents...`);

      for (const file of req.files) {
        try {
          const uploadResult = await uploadFile(file, "refund-requests");
          supportingDocuments.push({
            filename: uploadResult.key.split("/").pop(),
            originalName: file.originalname,
            s3Key: uploadResult.key,
            url: uploadResult.url,
            fileType: file.mimetype,
            fileSize: file.size,
          });
          logger.info(`✅ Uploaded: ${file.originalname}`);
        } catch (uploadError) {
          logger.error(
            `❌ Failed to upload ${file.originalname}:`,
            uploadError
          );
          // Continue with other files, don't fail the entire request
        }
      }
    }

    // Create refund request
    const refundRequest = new RefundRequest({
      requesterId: studentId,
      requesterType: "student",
      refundType: "course_purchase",
      requestedAmount: requestedAmount || payment.finalAmount,
      originalAmount: payment.finalAmount,
      relatedCourse: courseId,
      relatedPayment: paymentId,
      reason,
      description,
      supportingDocuments,
      priority: requestedAmount > 100 ? "high" : "normal",
    });

    await refundRequest.save();

    // Populate for response
    await refundRequest.populate([
      { path: "relatedCourse", select: "title" },
      { path: "relatedPayment", select: "finalAmount paymentMethod" },
    ]);

    logger.info("✅ Student refund request created:", {
      refundId: refundRequest._id,
      studentId,
      courseId,
      amount: refundRequest.requestedAmount,
    });

    res.status(201).json({
      success: true,
      message: "Refund request submitted successfully",
      data: { refundRequest },
    });
  } catch (error) {
    logger.error("❌ Error creating student refund request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create refund request",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Get student refund requests
 */
const getStudentRefunds = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { requesterId: studentId, requesterType: "student" };
    if (status) query.status = status;

    const refunds = await RefundRequest.find(query)
      .populate("relatedCourse", "title")
      .populate("relatedPayment", "finalAmount paymentMethod")
      .populate("reviewedBy", "name email")
      .sort({ requestDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RefundRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        refunds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("❌ Error fetching student refunds:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch refund requests",
    });
  }
};

/**
 * 👨‍🏫 INSTRUCTOR REFUND REQUESTS
 */

/**
 * Create instructor admin fee refund request
 */
const createInstructorRefund = async (req, res) => {
  try {
    const {
      reason,
      description,
      requestedAmount,
      refundType = "admin_fee_overpayment",
    } = req.body;
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

    // Basic validation for refund amount
    if (requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Refund amount must be greater than zero",
      });
    }

    // Handle supporting document uploads
    const supportingDocuments = [];
    if (req.files && req.files.length > 0) {
      logger.info(`📎 Processing ${req.files.length} supporting documents...`);

      for (const file of req.files) {
        try {
          const uploadResult = await uploadFile(file, "refund-requests");
          supportingDocuments.push({
            filename: uploadResult.key.split("/").pop(),
            originalName: file.originalname,
            s3Key: uploadResult.key,
            url: uploadResult.url,
            fileType: file.mimetype,
            fileSize: file.size,
          });
          logger.info(`✅ Uploaded: ${file.originalname}`);
        } catch (uploadError) {
          logger.error(
            `❌ Failed to upload ${file.originalname}:`,
            uploadError
          );
          // Continue with other files, don't fail the entire request
        }
      }
    }

    // Create refund request
    const refundRequest = new RefundRequest({
      requesterId: instructorId,
      requesterType: "instructor",
      refundType,
      requestedAmount,
      originalAmount: instructorAccount.annualFees || 0, // Use annual fees as reference
      reason,
      description,
      supportingDocuments,
      priority: requestedAmount > 200 ? "high" : "normal",
    });

    await refundRequest.save();

    logger.info("✅ Instructor refund request created:", {
      refundId: refundRequest._id,
      instructorId,
      amount: refundRequest.requestedAmount,
      type: refundType,
    });

    res.status(201).json({
      success: true,
      message: "Refund request submitted successfully",
      data: { refundRequest },
    });
  } catch (error) {
    logger.error("❌ Error creating instructor refund request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create refund request",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Get instructor refund requests
 */
const getInstructorRefunds = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { requesterId: instructorId, requesterType: "instructor" };
    if (status) query.status = status;

    const refunds = await RefundRequest.find(query)
      .populate("reviewedBy", "name email")
      .sort({ requestDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RefundRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        refunds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("❌ Error fetching instructor refunds:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch refund requests",
    });
  }
};

/**
 * 👨‍💼 ADMIN REFUND MANAGEMENT
 */

/**
 * Get all pending refund requests (Admin)
 */
const getPendingRefunds = async (req, res) => {
  try {
    const { page = 1, limit = 20, requesterType, refundType } = req.query;

    const query = { status: { $in: ["pending", "under_review"] } };
    if (requesterType) query.requesterType = requesterType;
    if (refundType) query.refundType = refundType;

    const refunds = await RefundRequest.find(query)
      .populate("requesterId", "name email role")
      .populate("relatedCourse", "title")
      .populate("relatedPayment", "finalAmount paymentMethod")
      .populate("reviewedBy", "name email")
      .sort({ requestDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RefundRequest.countDocuments(query);

    // Get statistics
    const stats = await RefundRequest.getRefundStats(query);

    res.json({
      success: true,
      data: {
        refunds,
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
    logger.error("❌ Error fetching pending refunds:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch refund requests",
    });
  }
};

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
 * 🔄 HELPER FUNCTIONS
 */

/**
 * Process student refund approval
 */
const processStudentRefundApproval = async (refundRequest, adminId) => {
  const studentId = refundRequest.requesterId._id;
  const refundAmount = refundRequest.requestedAmount;

  // Get billing accounts
  const studentAccount = await getBillingAccountByRole(studentId, "student");
  const adminAccount = await getBillingAccountByRole(adminId, "admin");

  // Create billing transaction for student refund
  const billingTransaction = new BillingTransaction({
    userId: studentId,
    type: "credit",
    amount: refundAmount,
    description: `Course refund - ${
      refundRequest.relatedCourse?.title || "Course"
    }`,
    category: "refund",
    status: "completed",
    balanceBefore: studentAccount.currentBalance,
    balanceAfter: studentAccount.currentBalance + refundAmount,
    relatedRefund: refundRequest._id,
    processedBy: adminId,
    processedAt: new Date(),
    metadata: {
      refundType: "course_purchase",
      originalPayment: refundRequest.relatedPayment?._id,
      courseId: refundRequest.relatedCourse,
    },
  });

  await billingTransaction.save();

  // Update student account
  studentAccount.availableCredits += refundAmount;
  studentAccount.statistics.totalRefundsReceived =
    (studentAccount.statistics.totalRefundsReceived || 0) + refundAmount;
  studentAccount.recalculateAll();
  await studentAccount.save();

  // Update admin account (platform expense)
  if (adminAccount) {
    adminAccount.totalRefundsIssued =
      (adminAccount.totalRefundsIssued || 0) + refundAmount;
    adminAccount.recalculateAll();
    await adminAccount.save();
  }

  return billingTransaction;
};

/**
 * Process instructor refund approval
 */
const processInstructorRefundApproval = async (refundRequest, adminId) => {
  const instructorId = refundRequest.requesterId._id;
  const refundAmount = refundRequest.requestedAmount;

  // Get billing accounts
  const instructorAccount = await getBillingAccountByRole(
    instructorId,
    "instructor"
  );
  const adminAccount = await getBillingAccountByRole(adminId, "admin");

  // Create billing transaction for instructor refund
  const billingTransaction = new BillingTransaction({
    userId: instructorId,
    type: "credit",
    amount: refundAmount,
    description: `Admin fee refund - Overpayment`,
    category: "refund",
    status: "completed",
    balanceBefore: instructorAccount.availableBalance,
    balanceAfter: instructorAccount.availableBalance + refundAmount,
    relatedRefund: refundRequest._id,
    processedBy: adminId,
    processedAt: new Date(),
    metadata: {
      refundType: "admin_fee_overpayment",
    },
  });

  await billingTransaction.save();

  // Update instructor account
  instructorAccount.availableBalance += refundAmount;
  instructorAccount.totalAdminFeesPaid = Math.max(
    0,
    (instructorAccount.totalAdminFeesPaid || 0) - refundAmount
  );
  instructorAccount.recalculateAll();
  await instructorAccount.save();

  // Update admin account
  if (adminAccount) {
    adminAccount.totalRefundsIssued =
      (adminAccount.totalRefundsIssued || 0) + refundAmount;
    adminAccount.recalculateAll();
    await adminAccount.save();
  }

  return billingTransaction;
};

/**
 * Get all refund requests (Admin only)
 */
const getAllRefunds = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      refundType,
      requesterType,
      startDate,
      endDate,
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (refundType) filter.refundType = refundType;
    if (requesterType) filter.requesterType = requesterType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const refunds = await RefundRequest.find(filter)
      .populate("requesterId", "name email")
      .populate("relatedCourse", "title")
      .populate("relatedGiftCard")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RefundRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        refunds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching all refunds:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch refund requests",
    });
  }
};

/**
 * Get refund statistics (Admin only)
 */
const getRefundStats = async (req, res) => {
  try {
    const { period = "30d" } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case "7d":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        };
        break;
      case "30d":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        };
        break;
      case "90d":
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          },
        };
        break;
      default:
        dateFilter = {
          createdAt: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        };
    }

    const stats = await RefundRequest.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$requestedAmount" },
        },
      },
    ]);

    const totalRefunds = await RefundRequest.countDocuments(dateFilter);
    const totalAmount = await RefundRequest.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, total: { $sum: "$requestedAmount" } } },
    ]);

    // Format stats for frontend
    const formattedStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      totalRefunded: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'pending') formattedStats.pending = stat.count;
      if (stat._id === 'approved') {
        formattedStats.approved = stat.count;
        formattedStats.totalRefunded += stat.totalAmount;
      }
      if (stat._id === 'rejected') formattedStats.rejected = stat.count;
    });

    res.json({
      success: true,
      data: {
        period,
        totalRefunds,
        totalAmount: totalAmount[0]?.total || 0,
        statusBreakdown: stats,
        ...formattedStats // Spread formatted stats for easy frontend access
      },
    });
  } catch (error) {
    logger.error("Error fetching refund stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch refund statistics",
    });
  }
};

/**
 * Get refund details by ID
 */
const getRefundDetails = async (req, res) => {
  try {
    const { refundId } = req.params;

    const refund = await RefundRequest.findById(refundId)
      .populate("requesterId", "name email")
      .populate("relatedCourse", "title price")
      .populate("relatedGiftCard")
      .populate("relatedBillingTransaction");

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund request not found",
      });
    }

    // Check if user has permission to view this refund
    const userRole = req.user.role;
    const userId = req.user._id.toString();

    if (userRole !== "admin" && refund.requesterId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this refund request",
      });
    }

    res.json({
      success: true,
      data: refund,
    });
  } catch (error) {
    logger.error("Error fetching refund details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch refund details",
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
  // Student refunds
  createStudentRefund,
  getStudentRefunds,

  // Instructor refunds
  createInstructorRefund,
  getInstructorRefunds,

  // Admin management
  getPendingRefunds,
  getAllRefunds,
  getRefundStats,
  getRefundDetails,
  cancelRefund,
  approveRefund,
  rejectRefund,
};
