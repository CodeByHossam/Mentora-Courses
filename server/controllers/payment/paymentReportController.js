// Admin payment reporting. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const User = require("../../models/User");
const AdminSettings = require("../../models/AdminSettings");

// @desc    Get comprehensive payment reports
// @route   GET /api/payments/reports
// @access  Admin
const getPaymentReports = asyncHandler(async (req, res) => {
  try {
    logger.info(
      "≡ƒöì getPaymentReports called by user:",
      req.user.id,
      req.user.role
    );

    // Get admin settings for profit calculations
    let adminSettings;
    try {
      adminSettings = await AdminSettings.getSettings();
      logger.info(
        "Γ£à Admin settings loaded:",
        adminSettings ? "success" : "null"
      );
    } catch (settingsError) {
      logger.error("Γ¥î Failed to load admin settings:", settingsError);
      // Use default settings if admin settings fail
      adminSettings = {
        paymentSettings: {
          globalDeductionPercentage: 10,
          instructorAnnualFee: 100,
          studentAdminFee: 5,
          currency: "USD",
        },
      };
    }

    const globalDeductionPercentage =
      adminSettings.paymentSettings?.globalDeductionPercentage || 0;
    logger.info(
      "≡ƒöì Using globalDeductionPercentage:",
      globalDeductionPercentage
    );

    // Comprehensive payment data with populated fields
    let payments = [];
    try {
      payments = await Payment.find()
        .populate("userId", "name email role") // FIXED: Use userId instead of student
        .populate("course", "title price instructor")
        .populate("recipientId", "name email") // FIXED: Use recipientId instead of admin
        .sort({ createdAt: -1 });
      logger.info("Γ£à Payments loaded:", payments.length, "records");

      // Log any payments with missing data
      const paymentsWithMissingData = payments.filter(
        (p) => !p.course || !p.userId
      );
      if (paymentsWithMissingData.length > 0) {
        logger.info(
          "ΓÜá∩╕Å Found payments with missing course/userId data:",
          paymentsWithMissingData.length
        );
        paymentsWithMissingData.forEach((p) => {
          logger.info(
            `Payment ${p._id}: course=${!!p.course}, userId=${!!p.userId}`
          );
        });
      }
    } catch (paymentError) {
      logger.error("Γ¥î Failed to load payments:", paymentError);
      payments = []; // Use empty array if payments fail to load
    }

    // Calculate totals and analytics
    const totalPayments = payments.length;
    const paidPayments = payments.filter((p) => p.status === "paid");
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    // Recalculate admin profit using current settings
    const totalAdminProfit = paidPayments.reduce((sum, p) => {
      const currentAdminFee = (p.amount * globalDeductionPercentage) / 100;
      return sum + currentAdminFee;
    }, 0);

    // Recalculate instructor earnings using current settings
    const totalInstructorEarnings = paidPayments.reduce((sum, p) => {
      const currentAdminFee = (p.amount * globalDeductionPercentage) / 100;
      const currentInstructorAmount = p.amount - currentAdminFee;
      return sum + currentInstructorAmount;
    }, 0);

    // Payment method breakdown
    const paymentMethodStats = payments.reduce((acc, payment) => {
      const method = payment.method || "unknown";
      if (!acc[method]) {
        acc[method] = { count: 0, revenue: 0 };
      }
      acc[method].count++;
      if (payment.status === "paid") {
        acc[method].revenue += payment.amount;
      }
      return acc;
    }, {});

    // Monthly revenue data (last 12 months)
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthPayments = paidPayments.filter(
        (p) => p.paidAt >= monthStart && p.paidAt <= monthEnd
      );

      const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const monthProfit = monthPayments.reduce((sum, p) => {
        const currentAdminFee = (p.amount * globalDeductionPercentage) / 100;
        return sum + currentAdminFee;
      }, 0);

      monthlyData.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        revenue: monthRevenue,
        profit: monthProfit,
        count: monthPayments.length,
      });
    }

    // Course performance data
    const coursePerformance = {};
    paidPayments.forEach((payment) => {
      // Skip payments without valid course data
      if (!payment.course || !payment.course._id) {
        logger.info(
          "ΓÜá∩╕Å Skipping payment with missing course data:",
          payment._id
        );
        return;
      }

      const courseId = payment.course._id.toString();
      if (!coursePerformance[courseId]) {
        coursePerformance[courseId] = {
          courseTitle: payment.course.title || "Unknown Course",
          instructor: payment.course.instructor?.name || "Unknown",
          totalRevenue: 0,
          totalProfit: 0,
          enrollmentCount: 0,
          averagePrice: 0,
        };
      }
      coursePerformance[courseId].totalRevenue += payment.amount;
      const currentAdminFee =
        (payment.amount * globalDeductionPercentage) / 100;
      coursePerformance[courseId].totalProfit += currentAdminFee;
      coursePerformance[courseId].enrollmentCount++;
    });

    // Calculate averages for course performance
    Object.values(coursePerformance).forEach((course) => {
      course.averagePrice =
        course.enrollmentCount > 0
          ? course.totalRevenue / course.enrollmentCount
          : 0;
    });

    // User fee analytics (annual fees)
    let userFeeData = [];
    try {
      userFeeData = await User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
            totalAnnualFees: {
              $sum: {
                $cond: [
                  { $eq: ["$role", "instructor"] },
                  adminSettings.paymentSettings?.instructorAnnualFee || 0,
                  adminSettings.paymentSettings?.studentAdminFee || 0,
                ],
              },
            },
          },
        },
      ]);
      logger.info(
        "Γ£à User fee data loaded:",
        userFeeData.length,
        "role groups"
      );
    } catch (userError) {
      logger.error("Γ¥î Failed to load user fee data:", userError);
      userFeeData = []; // Use empty array if user data fails to load
    }

    // Status breakdown
    const statusBreakdown = payments.reduce((acc, payment) => {
      const status = payment.status;
      if (!acc[status]) {
        acc[status] = { count: 0, amount: 0 };
      }
      acc[status].count++;
      acc[status].amount += payment.amount;
      return acc;
    }, {});

    logger.info("Γ£à Payment reports generated successfully");

    res.json({
      success: true,
      data: {
        overview: {
          totalPayments,
          totalRevenue,
          totalAdminProfit,
          totalInstructorEarnings,
          averagePayment: totalPayments > 0 ? totalRevenue / totalPayments : 0,
          profitMargin:
            totalRevenue > 0 ? (totalAdminProfit / totalRevenue) * 100 : 0,
        },
        payments: payments.map((payment) => {
          // Recalculate fees using current admin settings
          const currentAdminFee =
            (payment.amount * globalDeductionPercentage) / 100;
          const currentInstructorAmount = payment.amount - currentAdminFee;

          return {
            _id: payment._id,
            student: payment.userId || null, // FIXED: Use userId field but keep student key for frontend compatibility
            course: payment.course || null,
            amount: payment.amount || 0,
            originalAmount: payment.originalAmount || payment.amount || 0,
            adminFee: currentAdminFee, // Use recalculated value
            adminPercentage: globalDeductionPercentage, // Use current percentage
            instructorAmount: currentInstructorAmount, // Use recalculated value
            method: payment.method || "unknown",
            status: payment.status || "unknown",
            paidAt: payment.paidAt || null,
            createdAt: payment.createdAt || null,
            admin: payment.admin || null,
            transferDetails: payment.transferDetails || null,
            receiptUrl: payment.receiptUrl || null,
          };
        }),
        analytics: {
          paymentMethodStats,
          monthlyData,
          coursePerformance: Object.values(coursePerformance).sort(
            (a, b) => b.totalRevenue - a.totalRevenue
          ),
          statusBreakdown,
          userFeeData,
        },
        settings: {
          globalDeductionPercentage,
          instructorAnnualFee:
            adminSettings.paymentSettings.instructorAnnualFee,
          studentAdminFee: adminSettings.paymentSettings.studentAdminFee,
          currency: adminSettings.paymentSettings.currency,
        },
      },
    });
  } catch (error) {
    logger.error("Γ¥î Payment reports error:", error);
    logger.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: `Failed to generate reports: ${error.message}`,
      error:
        process.env.NODE_ENV === "development"
          ? error.stack
          : "Internal server error",
      errorCode: "REPORTS_GENERATION_ERROR",
    });
  }
});

// @desc    Get payment stats
// @route   GET /api/payments/stats
// @access  Admin

module.exports = {
  getPaymentReports
};
