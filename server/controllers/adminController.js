const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Course = require("../models/Course");
const Category = require("../models/Category");
const EnrollmentRequest = require("../models/EnrollmentRequest");
const Payment = require("../models/Payment");

// Additional models for bulk deletion
const Comment = require("../models/Comment");
const Test = require("../models/Test");
const Grade = require("../models/Grade");
const Certificate = require("../models/Certificate");
const LiveSession = require("../models/LiveSession");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Attachment = require("../models/Attachment");
const InstructorRequest = require("../models/InstructorRequestModel");
// PayoutRequest removed - using direct payout system now
const RefundRequest = require("../models/RefundRequest");
const AdminFeePayment = require("../models/AdminFeePayment");
const GiftCard = require("../models/GiftCard");

// Protected models (cannot be bulk deleted)
const BillingTransaction = require("../models/BillingTransaction");
const InstructorBillingAccount = require("../models/InstructorBillingAccount");
const StudentBillingAccount = require("../models/StudentBillingAccount");
const AdminBillingAccount = require("../models/AdminBillingAccount");

// @desc    Create a new user (admin or instructor) - Admin only
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Please add all fields");
  }

  // Check if creator is admin
  if (req.user.role !== "admin") {
    res.status(403);
    throw new Error(
      "Only administrators can create admin or instructor accounts"
    );
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Create user with specified role
  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  if (user) {
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Update user active state
// @route   PATCH /api/admin/users/:id/active-state
// @access  Private/Admin
const updateUserActiveState = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Don't allow deactivating admin users
  if (user.role === "admin") {
    res.status(400);
    throw new Error("Cannot deactivate admin users");
  }

  user.isActive = isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User active state updated successfully",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

// @desc    Update user verification state
// @route   PATCH /api/admin/users/:id/verification-state
// @access  Private/Admin
const updateUserVerificationState = asyncHandler(async (req, res) => {
  const { isVerified } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isVerified = isVerified;
  await user.save();

  res.status(200).json({
    success: true,
    message: "User verification state updated successfully",
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
    },
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select("-password").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Users retrieved successfully",
    data: users,
  });
});

// Define getReports as a named function
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

/**
 * 📊 GET DELETION STATISTICS
 * Shows counts for each model to help admin understand impact
 */
const getDeletionStatistics = asyncHandler(async (req, res) => {
  try {
    const stats = {
      // Safe to delete models
      safeModels: {
        Comment: await Comment.countDocuments(),
        tests: await Test.countDocuments(),
        grades: await Grade.countDocuments(),
        certificates: await Certificate.countDocuments(),
        liveSessions: await LiveSession.countDocuments(),
        messages: await Message.countDocuments(),
        notifications: await Notification.countDocuments(),
        attachments: await Attachment.countDocuments(),
        enrollmentRequests: await EnrollmentRequest.countDocuments(),
        instructorRequests: await InstructorRequest.countDocuments(),
        // payoutRequests removed - using direct payout system now
        refundRequests: await RefundRequest.countDocuments(),
        adminFeePayments: await AdminFeePayment.countDocuments(),
        giftCards: await GiftCard.countDocuments(),
      },

      // Models with relationships (require validation)
      relationshipModels: {
        users: await User.countDocuments(),
        courses: await Course.countDocuments(),
        categories: await Category.countDocuments(),
      },

      // Protected financial models (cannot be deleted)
      protectedModels: {
        payments: await Payment.countDocuments(),
        billingTransactions: await BillingTransaction.countDocuments(),
        instructorBillingAccounts:
          await InstructorBillingAccount.countDocuments(),
        studentBillingAccounts: await StudentBillingAccount.countDocuments(),
        adminBillingAccounts: await AdminBillingAccount.countDocuments(),
      },
    };

    res.json({
      success: true,
      message: "Deletion statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("❌ Error getting deletion statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get deletion statistics",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE Comment
 * Safely deletes all Comment from all courses
 */
const bulkDeleteComment = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    // Additional security check
    if (!confirmPassword || confirmPassword !== "DELETE_ALL_Comment") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_Comment" to confirm.',
      });
    }

    const deletedCount = await Comment.countDocuments();
    await Comment.deleteMany({});

    // Log the action
    console.log(
      `🗑️ Admin ${req.user.name} (${req.user.email}) deleted ${deletedCount} Comment`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} Comment`,
      deletedCount,
    });
  } catch (error) {
    console.error("❌ Error bulk deleting Comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete Comment",
      error: error.message,
    });
  }
});

/**
 * 🗑️ BULK DELETE TESTS
 * Safely deletes all tests and related grades
 */
const bulkDeleteTests = asyncHandler(async (req, res) => {
  try {
    const { confirmPassword } = req.body;

    if (!confirmPassword || confirmPassword !== "DELETE_ALL_TESTS") {
      return res.status(400).json({
        success: false,
        message:
          'Invalid confirmation password. Type "DELETE_ALL_TESTS" to confirm.',
      });
    }

    const testsCount = await Test.countDocuments();
    const gradesCount = await Grade.countDocuments();

    // Delete tests and related grades
    await Test.deleteMany({});
    await Grade.deleteMany({});

    console.log(
      `🗑️ Admin ${req.user.name} deleted ${testsCount} tests and ${gradesCount} grades`
    );

    res.json({
      success: true,
      message: `Successfully deleted ${testsCount} tests and ${gradesCount} grades`,
      deletedCounts: { tests: testsCount, grades: gradesCount },
    });
  } catch (error) {
    console.error("❌ Error bulk deleting tests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete tests",
      error: error.message,
    });
  }
});

/**
 * 🚫 PROTECTED MODEL DELETION ATTEMPT
 * Returns error for protected financial models
 */
const protectedModelDeletion = asyncHandler(async (req, res) => {
  const { modelType } = req.params;

  res.status(403).json({
    success: false,
    message: `${modelType} records are protected and cannot be deleted. These are critical for financial compliance and audit trails.`,
    protectedModels: [
      "payments",
      "billingTransactions",
      "instructorBillingAccounts",
      "studentBillingAccounts",
      "adminBillingAccounts",
    ],
  });
});

module.exports = {
  createUser,
  updateUserActiveState,
  updateUserVerificationState,
  getUsers,
  getReports,
  getDeletionStatistics,
  bulkDeleteComment,
  bulkDeleteTests,
  protectedModelDeletion,
};
