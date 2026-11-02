// Price breakdown and payment statistics. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const Course = require("../../models/Course");
const AdminSettings = require("../../models/AdminSettings");

// @desc    Get payment stats
// @route   GET /api/payments/stats
// @access  Admin
const getPaymentStats = asyncHandler(async (req, res) => {
  const totalRevenueAgg = await Payment.aggregate([
    { $match: { status: "paid" } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const topCourses = await Payment.aggregate([
    { $match: { status: "paid" } },
    {
      $group: {
        _id: "$course",
        revenue: { $sum: "$amount" },
        totalPayments: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  res.status(200).json({
    success: true,
    message: "Payment stats",
    data: {
      totalRevenue: totalRevenueAgg[0]?.totalRevenue || 0,
      totalPayments: totalRevenueAgg[0]?.count || 0,
      topCourses,
    },
  });
});

// Import additional utilities for new payment system
const { uploadToS3, deleteFromS3 } = require("../../utils/aws");

/**
 * Calculate payment breakdown including admin fees
 */

/**
 * Calculate payment breakdown including admin fees
 */
const calculatePaymentBreakdown = async (originalAmount) => {
  const settings = await AdminSettings.getSettings();
  const { studentAdminFee, globalDeductionPercentage } =
    settings.paymentSettings;

  const adminFee = studentAdminFee || 0;
  const percentageDeduction =
    (originalAmount * (globalDeductionPercentage || 0)) / 100;
  const totalAdminDeduction = adminFee + percentageDeduction;
  const instructorAmount = Math.max(0, originalAmount - totalAdminDeduction);

  return {
    originalAmount,
    adminFee,
    adminPercentage: globalDeductionPercentage || 0,
    instructorAmount,
    totalAdminDeduction,
  };
};

/**
 * @desc    Get payment breakdown for a course
 * @route   GET /api/payments/breakdown/:courseId
 * @access  Private
 */

/**
 * @desc    Get payment breakdown for a course
 * @route   GET /api/payments/breakdown/:courseId
 * @access  Private
 */
const getPaymentBreakdown = asyncHandler(async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Calculate breakdown
    const breakdown = await calculatePaymentBreakdown(course.price);

    res.status(200).json({
      success: true,
      message: "Payment breakdown calculated successfully",
      data: {
        course: {
          id: course._id,
          title: course.title,
          price: course.price,
        },
        breakdown,
      },
    });
  } catch (error) {
    logger.error("Error calculating payment breakdown:", error);
    res.status(500).json({
      success: false,
      message: "Error calculating payment breakdown",
      error: error.message,
    });
  }
});

/**
 * Auto-enroll student after successful payment
 */

module.exports = {
  calculatePaymentBreakdown,
  getPaymentBreakdown,
  getPaymentStats
};
