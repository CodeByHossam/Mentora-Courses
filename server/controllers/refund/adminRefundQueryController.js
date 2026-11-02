// Admin refund queries: pending list, all refunds, stats and details. Split from adminRefundController.js; bodies unchanged.

const logger = require('../../utils/logger');
const RefundRequest = require("../../models/RefundRequest");

/**
 * 🎓 STUDENT REFUND REQUESTS
 */

/**
 * Create student course refund request
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

module.exports = {
  getPendingRefunds,
  getAllRefunds,
  getRefundStats,
  getRefundDetails
};
