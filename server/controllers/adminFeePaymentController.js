// controllers/adminFeePaymentController.js
/**
 * Admin Fee Payment Controller
 *
 * Handles instructor payments of admin fees
 * - Instructors submit payments with receipts
 * - Admin verifies and approves payments
 * - Payments are applied to outstanding admin fees
 * - Complete transaction synchronization
 */

const AdminFeePayment = require("../models/AdminFeePayment");
const InstructorBillingAccount = require("../models/InstructorBillingAccount");
const AdminBillingAccount = require("../models/AdminBillingAccount");
const BillingTransaction = require("../models/BillingTransaction");
const User = require("../models/User");
const { getBillingAccountByRole } = require("../utils/specializedBillingUtils");
const { uploadFile, getFile } = require("../utils/aws");

/**
 * 👨‍🏫 INSTRUCTOR ADMIN FEE PAYMENTS
 */

/**
 * Submit admin fee payment (Instructor)
 */
const submitAdminFeePayment = async (req, res) => {
  try {
    const {
      paymentAmount,
      paymentDate,
      paymentMethod = "bank_transfer",
      description,
      referenceNumber,
      bankTransactionId,
    } = req.body;

    const instructorId = req.user._id;

    // Validate required fields
    if (!paymentAmount || !paymentDate || !description) {
      return res.status(400).json({
        success: false,
        message: "Payment amount, date, and description are required",
      });
    }

    // Check if receipt file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Receipt file is required",
      });
    }

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

    // Upload receipt to S3 using admin-fee-receipts folder
    const receiptUpload = await uploadFile(req.file, "admin-fee-receipts");

    // Create admin fee payment record
    const adminFeePayment = new AdminFeePayment({
      instructorId,
      paymentAmount: parseFloat(paymentAmount),
      paymentDate: new Date(paymentDate),
      paymentMethod,
      description,
      referenceNumber,
      bankTransactionId,
      receiptUrl: receiptUpload.key, // Store S3 key, not full URL
      receiptFileName: req.file.originalname,
      receiptFileSize: req.file.size,
      outstandingFeesBeforePayment: instructorAccount.owedAdminFees || 0,
      priority: paymentAmount > 500 ? "high" : "normal",
    });

    // Calculate fee allocation
    const allocation = adminFeePayment.calculateFeeAllocation(
      instructorAccount.owedAdminFees || 0
    );
    adminFeePayment.allocatedToFees = allocation.allocatedAmount;
    adminFeePayment.excessAmount = allocation.excessAmount;
    adminFeePayment.outstandingFeesAfterPayment = Math.max(
      0,
      (instructorAccount.owedAdminFees || 0) - allocation.allocatedAmount
    );

    await adminFeePayment.save();

    console.log("✅ Admin fee payment submitted:", {
      paymentId: adminFeePayment._id,
      instructorId,
      amount: paymentAmount,
      allocatedToFees: allocation.allocatedAmount,
      excessAmount: allocation.excessAmount,
    });

    res.status(201).json({
      success: true,
      message: "Admin fee payment submitted successfully",
      data: {
        adminFeePayment,
        allocation: {
          allocatedToFees: allocation.allocatedAmount,
          excessAmount: allocation.excessAmount,
          fullyCoversOutstanding: allocation.fullyCoversOutstanding,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error submitting admin fee payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit admin fee payment",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

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
            console.error(
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
    console.error("❌ Error fetching instructor payments:", error);
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
    console.error("❌ Error fetching outstanding admin fees:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch outstanding admin fees",
    });
  }
};

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

    console.log("✅ Admin fee payment cancelled:", {
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
    console.error("❌ Error cancelling admin fee payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel admin fee payment",
    });
  }
};

/**
 * 👨‍💼 ADMIN MANAGEMENT
 */

/**
 * Get pending admin fee payments (Admin)
 */
const getPendingPayments = async (req, res) => {
  try {
    console.log("🔍 ADMIN FEE PAYMENT - getPendingPayments called");
    console.log("🔍 Request URL:", req.originalUrl);
    console.log("🔍 Request Method:", req.method);

    const { page = 1, limit = 20, instructorId, paymentMethod } = req.query;

    const query = { status: { $in: ["pending", "under_review", "verified"] } };
    if (instructorId) query.instructorId = instructorId;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // Debug logging
    console.log("🔍 Pending Payments Query:", query);

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
            console.error(
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
    console.log("🔍 Pending Payments Found:", payments.length, "Total:", total);

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
    console.error("❌ Error fetching pending payments:", error);
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

    console.log("✅ Admin fee payment verified:", {
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
    console.error("❌ Error verifying payment:", error);
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
    console.error("❌ Error approving admin fee payment:", error);
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

    console.log("✅ Admin fee payment rejected:", {
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
    console.error("❌ Error rejecting payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject payment",
    });
  }
};

/**
 * 🔄 HELPER FUNCTIONS
 */

/**
 * Get signed URL for receipt viewing
 */
const getReceiptSignedUrl = async (receiptKey) => {
  try {
    return await getFile(receiptKey, 3600); // 1 hour expiration
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw new Error("Failed to generate receipt URL");
  }
};

/**
 * Process admin fee payment approval
 */
const processAdminFeePaymentApproval = async (
  payment,
  adminId,
  approvalNotes
) => {
  const instructorId = payment.instructorId._id;
  const paymentAmount = payment.paymentAmount;

  // Get billing accounts
  const instructorAccount = await getBillingAccountByRole(
    instructorId,
    "instructor"
  );
  const adminAccount = await getBillingAccountByRole(adminId, "admin");

  if (!instructorAccount) {
    throw new Error("Instructor billing account not found");
  }

  // Calculate actual payment allocation
  const currentOwedFees = instructorAccount.owedAdminFees || 0;
  const allocatedAmount = Math.min(paymentAmount, currentOwedFees);
  const excessAmount = Math.max(0, paymentAmount - currentOwedFees);

  // Process admin fee payment in instructor account
  const actualPayment = instructorAccount.processAdminFeePayment(
    allocatedAmount,
    `Admin fee payment - ${payment.description}`
  );

  // Update payment record with admin verification
  if (instructorAccount.feePayments.length > 0) {
    const lastPayment =
      instructorAccount.feePayments[instructorAccount.feePayments.length - 1];
    lastPayment.verifiedBy = adminId;
  }

  await instructorAccount.save();

  // Create billing transaction
  const billingTransaction = new BillingTransaction({
    userId: instructorId,
    type: "debit",
    amount: actualPayment,
    description: `Admin fee payment processed - ${payment.description}`,
    category: "admin_fee",
    status: "completed",
    balanceBefore: instructorAccount.availableBalance + actualPayment, // Before the payment was processed
    balanceAfter: instructorAccount.availableBalance,
    relatedAdminFeePayment: payment._id,
    processedBy: adminId,
    processedAt: new Date(),
    metadata: {
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      bankTransactionId: payment.bankTransactionId,
      receiptUrl: payment.receiptUrl,
    },
  });

  await billingTransaction.save();

  // Handle excess amount if any
  if (excessAmount > 0) {
    // Add excess as credit to instructor account
    instructorAccount.availableBalance += excessAmount;
    instructorAccount.adminCreditsAdded =
      (instructorAccount.adminCreditsAdded || 0) + excessAmount;
    instructorAccount.recalculateAll();
    await instructorAccount.save();

    // Create transaction for excess credit
    const excessTransaction = new BillingTransaction({
      userId: instructorId,
      type: "credit",
      amount: excessAmount,
      description: `Excess admin fee payment credited back`,
      category: "credit_addition",
      status: "completed",
      balanceBefore: instructorAccount.availableBalance - excessAmount,
      balanceAfter: instructorAccount.availableBalance,
      relatedAdminFeePayment: payment._id,
      processedBy: adminId,
      processedAt: new Date(),
      metadata: {
        excessFromPayment: paymentAmount,
        allocatedToFees: allocatedAmount,
      },
    });

    await excessTransaction.save();
  }

  // Update admin account
  if (adminAccount) {
    adminAccount.totalAdminFeesCollected =
      (adminAccount.totalAdminFeesCollected || 0) + actualPayment;
    adminAccount.recalculateAll();
    await adminAccount.save();
  }

  // Update payment record
  payment.approve(adminId, approvalNotes);
  payment.markProcessed(adminId, billingTransaction._id, actualPayment);
  await payment.save();

  console.log("✅ Admin fee payment processed:", {
    paymentId: payment._id,
    instructorId,
    paymentAmount,
    allocatedAmount: actualPayment,
    excessAmount,
    newOwedFees: instructorAccount.owedAdminFees,
    newAvailableBalance: instructorAccount.availableBalance,
  });

  return {
    payment,
    billingTransaction,
    allocation: {
      allocatedAmount: actualPayment,
      excessAmount,
      newOwedFees: instructorAccount.owedAdminFees,
      newAvailableBalance: instructorAccount.availableBalance,
    },
  };
};

/**
 * Get admin fee payment statistics (Admin)
 */
const getAdminFeePaymentStats = async (req, res) => {
  try {
    const { period = "30d" } = req.query;

    // Calculate date range based on period
    let startDate = new Date();
    switch (period) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get payment counts by status
    const statusCounts = await AdminFeePayment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$paymentAmount" },
        },
      },
    ]);

    // Debug logging
    console.log("🔍 Admin Fee Payment Status Counts:", statusCounts);

    // Get recent period stats
    const recentStats = await AdminFeePayment.aggregate([
      {
        $match: {
          submittedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$paymentAmount" },
        },
      },
    ]);

    // Format the response
    const stats = {
      pending: 0,
      verified: 0,
      approved: 0,
      rejected: 0,
      totalProcessed: 0,
      totalAmount: 0,
      recentActivity: {
        period,
        payments: recentStats.reduce((acc, stat) => acc + stat.count, 0),
        amount: recentStats.reduce((acc, stat) => acc + stat.totalAmount, 0),
      },
    };

    // Populate stats from aggregation
    statusCounts.forEach((stat) => {
      // Map status names to stats object
      switch (stat._id) {
        case "pending":
          stats.pending = stat.count;
          break;
        case "verified":
          stats.verified = stat.count;
          break;
        case "approved":
        case "processed": // Handle both 'approved' and 'processed' status
          stats.approved += stat.count;
          stats.totalProcessed += stat.totalAmount;
          break;
        case "rejected":
          stats.rejected = stat.count;
          break;
      }
      stats.totalAmount += stat.totalAmount;
    });

    // Debug final stats
    console.log("🔍 Final Admin Fee Payment Stats:", stats);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error fetching admin fee payment stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment statistics",
    });
  }
};

/**
 * Get all admin fee payments (Admin)
 */
const getAllAdminFeePayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      instructorId,
      paymentMethod,
      startDate,
      endDate,
      sortBy = "submittedAt",
      sortOrder = "desc",
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (instructorId) query.instructorId = instructorId;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    // Date range filter
    if (startDate || endDate) {
      query.submittedAt = {};
      if (startDate) query.submittedAt.$gte = new Date(startDate);
      if (endDate) query.submittedAt.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const payments = await AdminFeePayment.find(query)
      .populate("instructorId", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName email")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalPayments = await AdminFeePayment.countDocuments(query);

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
            console.error(
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

    res.json({
      success: true,
      data: {
        payments: paymentsWithSignedUrls,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPayments / limit),
          totalPayments,
          hasNextPage: page < Math.ceil(totalPayments / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching all admin fee payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin fee payments",
    });
  }
};

module.exports = {
  // Instructor functions
  submitAdminFeePayment,
  getInstructorPayments,
  getOutstandingAdminFees,
  cancelAdminFeePayment,

  // Admin functions
  getPendingPayments,
  getAllAdminFeePayments,
  getAdminFeePaymentStats,
  verifyPayment,
  approvePayment,
  rejectPayment,
};
