const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const User = require("../../models/User");
const Course = require("../../models/Course");
const Category = require("../../models/Category");
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const Payment = require("../../models/Payment");
const Comment = require("../../models/Comment");
const Test = require("../../models/Test");
const Grade = require("../../models/Grade");
const Certificate = require("../../models/Certificate");
const LiveSession = require("../../models/LiveSession");
const Message = require("../../models/Message");
const Notification = require("../../models/Notification");
const Attachment = require("../../models/Attachment");
const InstructorRequest = require("../../models/InstructorRequestModel");
const RefundRequest = require("../../models/RefundRequest");
const AdminFeePayment = require("../../models/AdminFeePayment");
const GiftCard = require("../../models/GiftCard");
const BillingTransaction = require("../../models/BillingTransaction");
const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
const StudentBillingAccount = require("../../models/StudentBillingAccount");
const AdminBillingAccount = require("../../models/AdminBillingAccount");


const getReports = async (req, res, next) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalInstructors = await User.countDocuments({ role: "instructor" });
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    // Course stats
    const totalCourses = await Course.countDocuments();
    const coursesByCategory = await Course.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const categories = await Category.find();
    const coursesByCategoryNamed = coursesByCategory.map((c) => ({
      category:
        categories.find((cat) => cat._id.equals(c._id))?.name || "Unknown",
      count: c.count,
    }));
    const mostPopularCourses = await Course.find()
      .sort({ students: -1 })
      .limit(5)
      .select("title students");

    // Enrollment stats
    const totalEnrollments = await EnrollmentRequest.countDocuments({
      status: "approved",
    });
    const recentEnrollments = await EnrollmentRequest.find({
      status: "approved",
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("student", "name email")
      .populate("course", "title");

    // Revenue stats
    const totalRevenueAgg = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const recentPayments = await Payment.find({ status: "paid" })
      .sort({ paidAt: -1 })
      .limit(5)
      .populate("userId", "name email")
      .populate("course", "title");
    const topEarningCoursesAgg = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: "$course", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);
    const topEarningCourses = await Promise.all(
      topEarningCoursesAgg.map(async (c) => {
        const course = await Course.findById(c._id).select("title");
        return { title: course?.title || "Unknown", total: c.total };
      })
    );

    res.json({
      success: true,
      message: "Admin reports fetched successfully",
      data: {
        users: {
          totalUsers,
          totalStudents,
          totalInstructors,
          totalAdmins,
          newUsersThisMonth,
        },
        courses: {
          totalCourses,
          coursesByCategory: coursesByCategoryNamed,
          mostPopularCourses,
        },
        enrollments: {
          totalEnrollments,
          recentEnrollments,
        },
        revenue: {
          totalRevenue,
          recentPayments,
          topEarningCourses,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ===================================================================
// BULK DELETION FUNCTIONS - ADMIN ONLY
// ===================================================================


module.exports = {
  getReports
};
