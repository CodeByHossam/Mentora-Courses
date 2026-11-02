// Admin fee payment statistics and listing. Split from adminFeeAdminController.js; bodies unchanged.

const logger = require('../../utils/logger');
const AdminFeePayment = require("../../models/AdminFeePayment");
const { getReceiptSignedUrl } = require("./adminFeeApprovalProcessor");

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
    logger.info("🔍 Admin Fee Payment Status Counts:", statusCounts);

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
    logger.info("🔍 Final Admin Fee Payment Stats:", stats);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("❌ Error fetching admin fee payment stats:", error);
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
    logger.error("❌ Error fetching all admin fee payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin fee payments",
    });
  }
};


module.exports = {
  getAdminFeePaymentStats,
  getAllAdminFeePayments
};
