const logger = require('../utils/logger');
const {
  getBillingAccountByRole,
  processCoursePurchase,
  getOrCreateAdminAccount,
} = require("../utils/specializedBillingUtils");

const AdminBillingAccount = require("../models/AdminBillingAccount");
const InstructorBillingAccount = require("../models/InstructorBillingAccount");
const StudentBillingAccount = require("../models/StudentBillingAccount");
const BillingTransaction = require("../models/BillingTransaction");
const Payment = require("../models/Payment");
const GiftCard = require("../models/GiftCard");
const {
  sanitizeObjectId,
  sanitizeNumber,
  sanitizeText,
} = require("../utils/sanitizer");
const { uploadFile, getFile, deleteFile } = require("../utils/aws");
const upload = require("../middleware/upload");

/**
 * SPECIALIZED BILLING CONTROLLER - ENHANCED ACCOUNTING SYSTEM
 *
 * =============================================================================
 * CONTROLLER OVERVIEW:
 * =============================================================================
 *
 * This controller manages the specialized billing system with three distinct
 * account types, each optimized for specific user roles and operations:
 *
 * 🔴 ADMIN OPERATIONS:
 *   - Platform revenue tracking and analytics
 *   - Instructor payout management
 *   - Student refund processing
 *   - Financial reporting and dashboards
 *
 * 🟡 INSTRUCTOR OPERATIONS:
 *   - Commission earnings tracking
 *   - Payout request management
 *   - Course sales analytics
 *   - Balance and credit management
 *
 * 🔵 STUDENT OPERATIONS:
 *   - Course purchase tracking
 *   - Credit management and payments
 *   - Billing history and statements
 *   - Payment method management
 *
 * 🔄 CROSS-ROLE OPERATIONS:
 *   - Transaction history and auditing
 *   - Account status management
 *   - Payment processing workflows
 *   - Billing reconciliation
 *
 * =============================================================================
 * ENHANCED FEATURES:
 * =============================================================================
 *
 * ✅ Automatic account creation based on user role
 * ✅ Real-time balance calculations and updates
 * ✅ Comprehensive transaction audit trails
 * ✅ Payment method integration (Stripe, PayPal, Direct)
 * ✅ Admin approval workflows for sensitive operations
 * ✅ Detailed financial reporting and analytics
 * ✅ Error handling and validation
 * ✅ Security and input sanitization
 *
 * =============================================================================
 */

/**
 * GET BILLING ACCOUNT BY USER ROLE
 *
 * Retrieves or creates the appropriate specialized billing account
 * based on the authenticated user's role. Handles automatic account
 * creation with proper welcome credits and initial setup.
 *
 * @route   GET /api/billing/account
 * @access  Private (Student/Instructor/Admin)
 * @returns {Object} Specialized billing account with balance info
 *
 * ACCOUNT TYPES:
 * - Admin: Platform revenue and payout management
 * - Instructor: Commission earnings and payout requests
 * - Student: Course purchases and credit management
 */
const getBillingAccount = async (req, res) => {
  try {
    const userId = sanitizeObjectId(req.user.id);
    const userRole = sanitizeText(req.user.role);

    // 🏦 GET OR CREATE SPECIALIZED ACCOUNT
    const account = await getBillingAccountByRole(userId, userRole);

    if (!account) {
      logger.error(
        `❌ Failed to create billing account for ${userRole}: ${userId}`
      );
      return res.status(500).json({
        success: false,
        message: `Failed to create ${userRole} billing account`,
        error: "Account creation failed",
      });
    }

    // 📊 GET RECENT TRANSACTIONS
    const recentTransactions = await BillingTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("relatedPayment", "finalAmount method status")
      .populate("relatedCourse", "title");

    // 🧮 CALCULATE ACCOUNT SUMMARY
    const accountSummary = {
      accountType: userRole,
      accountId: account._id,
      status: account.status,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
    // Add role-specific fields
    switch (userRole) {
      case "admin":
        accountSummary.platformBalance = account.platformBalance;
        accountSummary.totalRevenue = account.totalRevenue;
        accountSummary.totalInstructorPayouts = account.totalInstructorPayouts || 0;
        accountSummary.monthlyRevenue = account.monthlyRevenue?.slice(-6) || [];
        accountSummary.statistics = account.statistics || {
          totalTransactions: 0,
          averageTransactionAmount: 0,
          totalCoursesSold: 0,
          totalActiveInstructors: 0
        };
        break;

      case "instructor":
        accountSummary.availableBalance = account.availableBalance || account.calculateAvailableBalance();
        accountSummary.totalCommissionEarned = account.totalCommissionEarned;
        accountSummary.pendingCommissions = account.pendingCommissions;
        accountSummary.totalPayoutsReceived = account.totalPayoutsReceived;
        // welcomeCredits removed - simplified system
        accountSummary.courseSales = account.courseSales?.length || 0;
        accountSummary.totalGiftAmount = account.getTotalGiftAmount
          ? account.getTotalGiftAmount()
          : 0;
        accountSummary.annualFees = account.annualFees || 0;
        break;

      case "student":
        // Students: Only track purchases and annual fees (no balance)
        accountSummary.totalCoursePurchases = account.totalCoursePurchases;
        accountSummary.annualFees = account.annualFees;
        accountSummary.coursePurchases = account.coursePurchases || []; // Return full array
        accountSummary.giftCards = account.giftCards || []; // Return full array (frontend filters)
        break;
    }

    const responseData = {
      success: true,
      message: `${userRole} billing account retrieved successfully`,
      data: {
        account: accountSummary,
        recentTransactions,
        transactionCount: recentTransactions.length,
      },
    };
    // Send response and close getBillingAccount
    res.status(200).json(responseData);
  } catch (error) {
    logger.error("❌ Error getting billing account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve billing account",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Get Admin billing account and earnings (Admin only)
 * @route GET /api/specialized-billing/admin/account
 */
const getAdminBillingAccount = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin role required." });
    }

    const adminAccount = await getOrCreateAdminAccount();

    const recentTransactions = await BillingTransaction.find({ userId: adminAccount.adminId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const totalEarnings = recentTransactions
      .filter(t => t.type === 'credit')
      .reduce((s, t) => s + (t.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        adminAccount: {
          platformBalance: adminAccount.platformBalance,
          totalRevenue: adminAccount.totalRevenue,
          // pendingPayouts removed - check instructor's pendingCommissions instead
          statistics: adminAccount.statistics,
          monthlyRevenue: adminAccount.monthlyRevenue?.slice(-12) || [],
        },
        earnings: {
          totalEarnings,
          transactionCount: recentTransactions.length,
        },
        recentTransactions,
        summary: {
          netProfit: adminAccount.totalRevenue - (adminAccount.totalInstructorPayouts || 0),
          lastRevenueUpdate: adminAccount.updatedAt,
        },
      },
    });
  } catch (error) {
    logger.error('❌ getAdminBillingAccount error:', error);
    res.status(500).json({ success: false, message: 'Failed to get admin billing account' });
  }
};

/**
 * Admin -> Instructor direct payout (SIMPLIFIED - No payout requests)
 * @route POST /api/specialized-billing/admin/payout/:instructorId
 * @access Private (Admin only)
 */
const payoutInstructorCommission = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin role required." });
    }

    const instructorId = sanitizeObjectId(req.params.instructorId);
    const amountRequested = Number(req.body.amount);
    const notes = req.body.notes || null;
    
    if (!instructorId || isNaN(amountRequested) || amountRequested <= 0) {
      return res.status(400).json({ success: false, message: "Valid instructorId and amount are required" });
    }

    const adminAccount = await getOrCreateAdminAccount();
    const instructorAccount = await InstructorBillingAccount.findOne({ instructorId });
    if (!instructorAccount) {
      return res.status(404).json({ success: false, message: "Instructor billing account not found" });
    }

    // 📦 SIMPLIFIED: Check pending commissions
    const payoutAmount = Math.min(amountRequested, instructorAccount.pendingCommissions);
    if (payoutAmount <= 0) {
      return res.status(400).json({ success: false, message: "No pending commissions to pay" });
    }

    const now = new Date();
    
    // Create billing transactions
    await BillingTransaction.create([
      {
        userId: adminAccount.adminId,
        type: "debit",
        date: now,
        from: adminAccount.adminId,
        to: instructorId,
        amount: payoutAmount,
        description: `Instructor commission payout: $${payoutAmount}`,
        category: "instructor_payout",
        status: "completed",
        relatedPayment: null,
        processedBy: req.user._id,
      },
      {
        userId: instructorId,
        type: "credit",
        date: now,
        from: adminAccount.adminId,
        to: instructorId,
        amount: payoutAmount,
        description: `Commission payout received: $${payoutAmount}`,
        category: "instructor_payout",
        status: "completed",
        relatedPayment: null,
        processedBy: req.user._id,
      },
    ]);

    // 📦 SIMPLIFIED: Use processPayout method
    instructorAccount.processPayout(payoutAmount, req.user._id, notes);
    await instructorAccount.save();

    // Update admin account
    adminAccount.totalInstructorPayouts += payoutAmount;
    adminAccount.platformBalance = adminAccount.totalRevenue - adminAccount.totalInstructorPayouts;
    await adminAccount.save();

    return res.status(200).json({
      success: true,
      message: "Payout processed successfully",
      data: {
        instructorId,
        payoutAmount,
        pendingCommissions: instructorAccount.pendingCommissions,
        totalEarned: instructorAccount.totalCommissionEarned,
        totalPaidOut: instructorAccount.totalPayoutsReceived,
        availableBalance: instructorAccount.calculateAvailableBalance(),
      },
    });
  } catch (error) {
    logger.error("❌ payoutInstructorCommission error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to process payout" });
  }
};


/**
 * GET COMPREHENSIVE BILLING SUMMARY
 *
 * Provides a complete financial overview for the authenticated user,
 * including account balances, transaction history, and role-specific
 * metrics. Used for billing dashboards and financial reporting.
 *
 * @route   GET /api/billing/summary
 * @access  Private (Student/Instructor/Admin)
 * @returns {Object} Complete billing summary with analytics
 *
 * SUMMARY INCLUDES:
 * - Account balance and status
 * - Recent transaction history
 * - Payment method preferences
 * - Role-specific financial metrics
 * - Upcoming billing events
 */
const getBillingSummaryController = async (req, res) => {
  try {
    const userId = sanitizeObjectId(req.user.id);
    const userRole = req.user.role;

    // 🏦 GET BILLING ACCOUNT
    const account = await getBillingAccountByRole(userId, userRole);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Billing account not found",
        error: "No billing account exists for this user",
      });
    }

    // 📈 GET TRANSACTION ANALYTICS
    const transactionStats = await BillingTransaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
        },
      },
    ]);

    // 📊 GET MONTHLY TRENDS (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await BillingTransaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            type: "$type",
          },
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // 🔍 GET RECENT PAYMENTS
    const recentPayments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("course", "title price")
      .select("finalAmount method status createdAt type");

    // 📋 BUILD COMPREHENSIVE SUMMARY
    const summary = {
      userId,
      userRole,
      accountStatus: account.status,
      lastUpdated: new Date(),

      // Account balances
      balances: {},

      // Transaction analytics
      analytics: {
        transactionStats,
        monthlyTrends,
        totalTransactions: transactionStats.reduce(
          (sum, stat) => sum + stat.count,
          0
        ),
      },

      // Recent activity
      recentActivity: {
        payments: recentPayments,
        lastPaymentDate: recentPayments[0]?.createdAt || null,
      },
    };

    // 🎯 ADD ROLE-SPECIFIC SUMMARY DATA
    switch (userRole) {
      case "admin":
        summary.balances = {
          platformBalance: account.platformBalance,
          totalRevenue: account.totalRevenue,
          // pendingPayouts removed - check instructor's pendingCommissions instead
          totalExpenses: account.totalExpenses,
        };
        summary.platformMetrics = {
          profitMargin: account.statistics?.profitMargin || 0,
          totalTransactions: account.statistics?.totalTransactions || 0,
          activeInstructors: account.statistics?.totalActiveInstructors || 0,
        };
        break;

      case "instructor":
        summary.balances = {
          availableBalance: account.availableBalance || account.calculateAvailableBalance(),
          totalCommissionEarned: account.totalCommissionEarned,
          pendingCommissions: account.pendingCommissions,
          totalPayoutsReceived: account.totalPayoutsReceived,
          welcomeCredits: account.welcomeCredits,
          totalGiftAmount: account.totalGiftAmount,
        };
        summary.instructorMetrics = {
          totalCoursesSold: account.statistics?.totalCoursesSold || 0,
          averageCommission: account.statistics?.averageCommissionPerSale || 0,
          monthlyEarnings: account.statistics?.monthlyEarnings || 0,
        };
        break;

      case "student":
        summary.balances = {
          totalSpent: account.totalCoursePurchases,
          annualFees: account.annualFees,
          availableGiftCards: account.giftCards?.filter(c => !c.isUsed).length || 0,
        };
        summary.studentMetrics = {
          coursesEnrolled: account.statistics?.totalCoursesEnrolled || 0,
          averageSpending: account.statistics?.averageSpendingPerCourse || 0,
          monthlySpending: account.statistics?.monthlySpending || 0,
        };
        break;
    }

    res.status(200).json({
      success: true,
      message: "Billing summary retrieved successfully",
      data: summary,
    });
  } catch (error) {
    logger.error("❌ Error getting billing summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate billing summary",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Get admin dashboard data (admin only)
 */
const getAdminDashboard = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const adminAccount = await getOrCreateAdminAccount();

    // Get recent transactions and statistics
    const dashboardData = {
      totalRevenue: adminAccount.totalRevenue,
      platformBalance: adminAccount.platformBalance,
      totalInstructorPayouts: adminAccount.totalInstructorPayouts,
      totalStudentRefunds: adminAccount.totalStudentRefunds,
      // pendingPayouts removed - check instructor's pendingCommissions instead
      monthlyRevenue: adminAccount.monthlyRevenue.slice(-12), // Last 12 months
      statistics: adminAccount.statistics,
      settings: adminAccount.settings,
    };

    res.status(200).json({
      success: true,
      dashboard: dashboardData,
    });
  } catch (error) {
    logger.error("❌ Error getting admin dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get admin dashboard",
      error: error.message,
    });
  }
};

/**
 * Get instructor earnings dashboard
 */
const getInstructorDashboard = async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Instructor role required.",
      });
    }

    const instructorAccount = await getBillingAccountByRole(
      req.user.id,
      "instructor"
    );

    const dashboardData = {
      availableBalance: instructorAccount.availableBalance || instructorAccount.calculateAvailableBalance(),
      totalEarnings: instructorAccount.totalCommissionEarned,
      pendingCommissions: instructorAccount.pendingCommissions,
      totalPayoutsReceived: instructorAccount.totalPayoutsReceived,
      totalGiftAmount: instructorAccount.totalGiftAmount,
      courseSales: instructorAccount.courseSales.slice(-10), // Last 10 sales
      payoutHistory: instructorAccount.payoutRequests.slice(-5), // Last 5 payouts (completed only)
      statistics: instructorAccount.statistics,
      payoutSettings: instructorAccount.payoutSettings,
    };

    res.status(200).json({
      success: true,
      dashboard: dashboardData,
    });
  } catch (error) {
    logger.error("❌ Error getting instructor dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get instructor dashboard",
      error: error.message,
    });
  }
};

/**
 * Get student spending dashboard
 */
const getStudentDashboard = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Student role required.",
      });
    }

    const studentAccount = await getBillingAccountByRole(
      req.user.id,
      "student"
    );

    const dashboardData = {
      totalSpent: studentAccount.totalCoursePurchases,
      annualFees: studentAccount.annualFees,
      availableGiftCards: studentAccount.giftCards?.filter(c => !c.isUsed) || [],
      coursePurchases: studentAccount.coursePurchases.slice(-10), // Last 10 purchases
      refundRequests: studentAccount.refundRequests.slice(-5), // Last 5 refund requests
      statistics: studentAccount.statistics,
      paymentMethods: studentAccount.paymentMethods,
      preferences: studentAccount.preferences,
    };

    res.status(200).json({
      success: true,
      dashboard: dashboardData,
    });
  } catch (error) {
    logger.error("❌ Error getting student dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get student dashboard",
      error: error.message,
    });
  }
};

/**
 * Request instructor payout
 */
const requestPayout = async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Instructor role required.",
      });
    }

    const { amount, method, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payout amount is required",
      });
    }

    const instructorAccount = await getBillingAccountByRole(
      req.user.id,
      "instructor"
    );

    // Request payout using account method
    const payoutRequestId = instructorAccount.requestPayout(
      amount,
      method,
      notes
    );
    await instructorAccount.save();

    res.status(201).json({
      success: true,
      message: "Payout request submitted successfully",
      payoutRequestId,
      newBalance: instructorAccount.availableBalance,
    });
  } catch (error) {
    logger.error("❌ Error requesting payout:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to request payout",
    });
  }
};

/**
 * Add credits to student account (admin only)
 */
const addStudentCredits = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const { studentId, amount, description } = req.body;

    if (!studentId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Student ID and valid amount are required",
      });
    }

    const studentAccount = await getBillingAccountByRole(studentId, "student");

    // Add credits using account method
    studentAccount.addCredits(
      amount,
      description || "Admin credit addition",
      req.user.id
    );
    await studentAccount.save();

    res.status(200).json({
      success: true,
      message: "Credits added successfully",
      newBalance: studentAccount.currentBalance,
      availableCredits: studentAccount.availableCredits,
    });
  } catch (error) {
    logger.error("❌ Error adding student credits:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add credits",
      error: error.message,
    });
  }
};

/**
 * ADMIN GIFT CARD SYSTEM - ADD CREDITS WITH CUSTOM NOTES
 *
 * Allows admins to add credits to any user account (student/instructor) with
 * customizable notes for different purposes like gift cards, refunds, bonuses, etc.
 * Creates proper billing transactions and audit trails.
 *
 * @route   POST /api/billing/admin/gift-card
 * @access  Private (Admin only)
 * @param   {Object} req.body - Gift card details
 * @returns {Object} Gift card processing result
 *
 * GIFT CARD TYPES:
 * - Gift Card: Promotional credits for users
 * - Refund: Refund credits for course returns
 * - Bonus: Performance or loyalty bonuses
 * - Compensation: Service issue compensation
 * - Promotional: Marketing campaign credits
 * - Custom: Any other reason specified by admin
 */
const addGiftCard = async (req, res) => {
  try {
    // 🔒 ADMIN AUTHORIZATION CHECK
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
        error: "Only administrators can issue gift cards",
      });
    }

    // 📋 EXTRACT AND VALIDATE INPUT DATA
    const {
      userId,
      userEmail,
      userRole, // Expected role (instructor or student)
      amount,
      giftCardType = "admin_issued",
      courseId, // For student gift cards
      courseName, // For student gift cards
      customNote,
      description,
      expiryDays = 365,
      expiryDate,
      isActive = true,
    } = req.body;

    // 🔍 INPUT VALIDATION
    if ((!userId && !userEmail) || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
        error:
          "User identification (ID or email), and valid amount are required",
      });
    }

    if (amount > 10000) {
      return res.status(400).json({
        success: false,
        message: "Amount too large",
        error: "Gift card amount cannot exceed $10,000",
      });
    }

    // 👤 FIND USER BY ID OR EMAIL
    const User = require("../models/User");
    let targetUser;

    if (userId) {
      targetUser = await User.findById(sanitizeObjectId(userId)).select(
        "_id name email role"
      );
    } else if (userEmail) {
      targetUser = await User.findOne({
        email: sanitizeText(userEmail),
      }).select("_id name email role");
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: "No user found with the provided ID or email",
      });
    }

    // ✅ VALIDATE USER ROLE
    if (userRole && targetUser.role !== userRole) {
      return res.status(400).json({
        success: false,
        message: `Role mismatch: The user with email ${targetUser.email} has role "${targetUser.role}", not "${userRole}" as expected.`,
        error: `Expected role: ${userRole}, Actual role: ${targetUser.role}`,
      });
    }

    // 🎓 VALIDATE STUDENT GIFT CARD REQUIREMENTS AND FETCH COURSE PRICE
    let coursePrice = amount;
    let foundCourse = null;
    
    if (targetUser.role === 'student') {
      if (giftCardType !== 'course_purchase') {
        return res.status(400).json({
          success: false,
          message: "Invalid gift card type for student",
          error: "Student gift cards can only be of type 'course_purchase'",
        });
      }
      if (!courseId && !courseName) {
        return res.status(400).json({
          success: false,
          message: "Course information required",
          error: "Student gift cards require either courseId or courseName",
        });
      }

      // Fetch course to get price
      const Course = require("../models/Course");
      if (courseId) {
        foundCourse = await Course.findById(sanitizeObjectId(courseId)).select('title price');
      } else if (courseName) {
        foundCourse = await Course.findOne({ title: new RegExp(sanitizeText(courseName), 'i') }).select('title price');
      }

      if (!foundCourse) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
          error: `No course found with ${courseId ? 'ID' : 'name'}: ${courseId || courseName}`,
        });
      }

      // Check for duplicate gift card (same student + same course)
      const GiftCard = require("../models/GiftCard");
      const existingGiftCard = await GiftCard.findOne({
        userId: targetUser._id,
        'metadata.courseId': foundCourse._id,
        isActive: true,
        isRedeemed: false
      });

      if (existingGiftCard) {
        return res.status(400).json({
          success: false,
          message: `Gift card already exists for this student and course`,
          error: `Student ${targetUser.email} already has an active gift card for course "${foundCourse.title}". Please choose a different student or course.`,
        });
      }

      // Set amount to course price for student gift cards
      coursePrice = foundCourse.price;
      logger.info(`📚 Found course: ${foundCourse.title}, Price: $${coursePrice}`);
    }

    // 🏦 GET OR CREATE USER'S BILLING ACCOUNT
    const userBillingAccount = await getBillingAccountByRole(
      targetUser._id,
      targetUser.role
    );

    if (!userBillingAccount) {
      return res.status(500).json({
        success: false,
        message: "Failed to access user billing account",
        error: "Could not create or retrieve billing account for user",
      });
    }

    // 📝 PREPARE GIFT CARD DESCRIPTION
    const giftCardDescriptions = {
      admin_issued: "🎁 Gift Card Credit",
      welcome_bonus: "👋 Welcome Bonus",
      commission_reward: "🌟 Commission Reward",
      referral_bonus: "🤝 Referral Bonus",
      achievement_reward: "🏆 Achievement Reward",
      promotional: "🎉 Promotional Credit",
      compensation: "🔧 Compensation Credit",
    };

    const baseDescription =
      giftCardDescriptions[giftCardType] || giftCardDescriptions.admin_issued;
    const fullDescription = customNote
      ? `${baseDescription} - ${customNote}`
      : `${baseDescription} - Added by ${req.user.name || req.user.email}`;

    // 🎁 CREATE GIFT CARD MODEL RECORD
    const GiftCard = require("../models/GiftCard");

    // Calculate expiry date if not provided
    const calculatedExpiryDate =
      expiryDate || new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    // Generate unique card number
    const generateCardNumber = () => {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, "0");
      return timestamp + random;
    };

    const cardNumber = generateCardNumber();
    logger.info("🎯 Generated card number:", cardNumber);

    // Create GiftCard model record with card number
    const giftCardRecord = await GiftCard.create({
      cardNumber: cardNumber,
      userId: targetUser._id,
      amount: sanitizeNumber(coursePrice),
      originalAmount: sanitizeNumber(coursePrice),
      description: fullDescription,
      giftCardType: giftCardType,
      expiryDate: calculatedExpiryDate,
      isActive: isActive,
      issuedBy: req.user._id,
      adminNotes: customNote
        ? `Admin note: ${customNote}`
        : `Issued by admin: ${req.user.name}`,
      metadata: {
        issuedByAdmin: true,
        adminId: req.user._id,
        adminName: req.user.name,
        userRole: targetUser.role,
        courseId: foundCourse?._id || courseId || null,
        courseName: foundCourse?.title || courseName || null,
        coursePrice: foundCourse?.price || null,
        originalRequest: {
          userId,
          userEmail,
          giftCardType,
          customNote,
        },
      },
    });

    // 🔄 ALSO ADD TO USER'S BILLING ACCOUNT FOR BALANCE TRACKING
    const previousBalance =
      userBillingAccount.availableBalance ||
      userBillingAccount.currentBalance ||
      0;

    // Map GiftCard enum values to BillingAccount enum values
    const giftCardTypeToBillingType = {
      admin_issued: "gift_card",
      welcome_bonus: "welcome",
      commission_reward: "bonus",
      referral_bonus: "bonus",
      achievement_reward: "bonus",
      promotional: "promotional",
      compensation: "compensation",
    };

    const billingType = giftCardTypeToBillingType[giftCardType] || "gift_card";
    logger.info("🔄 Gift card type mapping:", { giftCardType, billingType });

    // 📦 SIMPLIFIED: Use addGiftAmount method (updates permanent box and history)
    userBillingAccount.addGiftAmount(
      amount,
      fullDescription,
      billingType,
      req.user._id,
      customNote,
      calculatedExpiryDate
    );
    await userBillingAccount.save();

    // 📊 PREPARE SUCCESS RESPONSE DATA
    const responseData = {
      giftCard: {
        _id: giftCardRecord._id,
        cardNumber: giftCardRecord.cardNumber,
        amount: giftCardRecord.amount,
        originalAmount: giftCardRecord.originalAmount,
        giftCardType: giftCardRecord.giftCardType,
        description: giftCardRecord.description,
        expiryDate: giftCardRecord.expiryDate,
        isActive: giftCardRecord.isActive,
        issuedDate: giftCardRecord.issuedDate,
        recipient: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        },
        issuedBy: {
          id: req.user._id,
          name: req.user.name || req.user.email,
          email: req.user.email,
        },
      },
      accountUpdate: {
        previousBalance,
        newBalance:
          userBillingAccount.availableBalance ||
          userBillingAccount.currentBalance,
        balanceIncrease: amount,
        accountType: targetUser.role,
        totalGiftAmount: userBillingAccount.giftAmount.reduce(
          (sum, gift) => sum + gift.amount,
          0
        ),
      },
    };

    // 📧 LOG SUCCESS MESSAGE
    logger.info(`✅ Gift card issued successfully:`);
    logger.info(`   💳 Amount: $${amount}`);
    logger.info(`   👤 Recipient: ${targetUser.name} (${targetUser.email})`);
    logger.info(`   🏷️ Type: ${giftCardType}`);
    logger.info(`   👨‍💼 Issued by: ${req.user.name || req.user.email}`);
    logger.info(
      `   🆔 Gift Amount Record ID: ${
        giftCardRecord._id || giftCardRecord.issuedAt
      }`
    );

    // 🎉 SUCCESS RESPONSE
    res.status(201).json({
      success: true,
      message: `Gift card of $${amount} successfully added to ${targetUser.name}'s account`,
      data: responseData,
    });
  } catch (error) {
    logger.error("❌ Error adding gift card:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process gift card",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Gift card processing failed",
    });
  }
};

/**
 * GET GIFT CARD HISTORY - ADMIN VIEW
 *
 * Retrieves all gift card transactions issued by admins with filtering
 * and pagination. Provides comprehensive overview for admin dashboard.
 *
 * @route   GET /api/billing/admin/gift-cards
 * @access  Private (Admin only)
 * @returns {Object} Gift card history with pagination
 */
const getGiftCardHistory = async (req, res) => {
  try {
    // 🔒 ADMIN AUTHORIZATION CHECK
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    // 📋 EXTRACT QUERY PARAMETERS
    const {
      page = 1,
      limit = 20,
      giftCardType,
      userId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      isActive,
    } = req.query;

    // 🔍 BUILD QUERY FILTER FOR GIFT CARD MODEL
    const GiftCard = require("../models/GiftCard");
    const query = {};

    // Apply filters
    if (giftCardType) query.giftCardType = giftCardType;
    if (userId) query.userId = sanitizeObjectId(userId);
    if (isActive !== undefined) query.isActive = isActive === "true";

    // Date range filter
    if (startDate || endDate) {
      query.issuedDate = {};
      if (startDate) query.issuedDate.$gte = new Date(startDate);
      if (endDate) query.issuedDate.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // 📊 PAGINATION SETUP
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 🔍 FETCH GIFT CARDS FROM GIFT CARD MODEL
    const giftCards = await GiftCard.find(query)
      .populate("userId", "name email role profilePicture")
      .populate("issuedBy", "name email role")
      .sort({ issuedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalGiftCards = await GiftCard.countDocuments(query);
    const totalPages = Math.ceil(totalGiftCards / parseInt(limit));

    // Gift cards retrieved successfully

    // Format gift cards for response
    const formattedGiftCards = giftCards.map((card) => ({
      _id: card._id,
      cardNumber: card.cardNumber,
      amount: card.amount,
      originalAmount: card.originalAmount,
      type: card.giftCardType,
      description: card.description,
      issuedAt: card.issuedDate,
      expiryDate: card.expiryDate,
      isActive: card.isActive,
      customNote: card.adminNotes,
      recipient: {
        _id: card.userId?._id,
        name: card.userId?.name,
        email: card.userId?.email,
        role: card.userId?.role,
        profilePicture: card.userId?.profilePicture,
      },
      issuedBy: {
        _id: card.issuedBy?._id,
        name: card.issuedBy?.name,
        email: card.issuedBy?.email,
      },
    }));

    // Gift cards formatted successfully

    // 📊 CALCULATE STATISTICS
    const stats = {
      totalGiftCards,
      totalPages,
      currentPage: parseInt(page),
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
      totalValue: giftCards.reduce((sum, card) => sum + (card.amount || 0), 0),
      activeCards: giftCards.filter((card) => card.isActive).length,
      expiredCards: giftCards.filter((card) => !card.isActive).length,
    };

    logger.info("🎁 Gift card history retrieved:", {
      totalGiftCards,
      currentPage: parseInt(page),
      totalPages,
      activeCards: stats.activeCards,
    });

    res.json({
      success: true,
      data: formattedGiftCards,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalGiftCards,
        hasNextPage: stats.hasNextPage,
        hasPrevPage: stats.hasPrevPage,
      },
      stats,
    });
  } catch (error) {
    logger.error("❌ Error fetching gift card history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gift card history",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Fetch failed",
    });
  }
};

/**
 * PROCESS COURSE PAYMENT WITH BILLING INTEGRATION
 *
 * Handles the complete course payment workflow including payment creation,
 * fee calculation, billing account updates, and transaction recording.
 * Integrates with the specialized billing system for proper accounting.
 *
 * @route   POST /api/billing/process-course-payment
 * @access  Private (Student/Instructor/Admin)
 * @param   {Object} req.body - Payment details
 * @returns {Object} Payment processing result
 *
 * WORKFLOW:
 * 1. Validate payment data and user permissions
 * 2. Create Payment record with calculated fees
 * 3. Process payment through appropriate gateway
 * 4. Update specialized billing accounts
 * 5. Create audit trail transactions
 * 6. Send notifications and confirmations
 */
const processCoursePaymentWithBilling = async (req, res) => {
  try {
    const {
      courseId,
      instructorId,
      finalAmount,
      method = "stripe",
      paymentSource = "electronic",
      enrollmentRequestId,
    } = req.body;

    const userId = sanitizeObjectId(req.user.id);

    // 🔍 VALIDATION: Check required fields
    if (!courseId || !instructorId || !finalAmount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        error: "courseId, instructorId, and finalAmount are required",
      });
    }

    // 💰 GET ADMIN SETTINGS for fee calculation
    const AdminSettings = require("../models/AdminSettings");
    const adminSettings = await AdminSettings.getSettings();
    const adminPercentage =
      adminSettings.paymentSettings?.globalDeductionPercentage || 10;
    const adminFeeFixed = adminSettings.paymentSettings?.studentAdminFee || 2;

    // 📈 CREATE PAYMENT RECORD
    const payment = await Payment.create({
      userId,
      course: sanitizeObjectId(courseId),
      enrollmentRequest: enrollmentRequestId
        ? sanitizeObjectId(enrollmentRequestId)
        : null,
      recipientId: sanitizeObjectId(instructorId),
      type: "course_payment",
      paymentSource,
      finalAmount: sanitizeNumber(finalAmount),
      method: sanitizeText(method),
      adminPercentage,
      adminFeeFixed,
      status: "pending",
      metadata: {
        processedBy: userId,
        userAgent: req.get("User-Agent"),
        ipAddress: req.ip,
        timestamp: new Date(),
      },
    });

    // 🧮 CALCULATE FEES AND SHARES
    const { adminFee, instructorAmount } = payment.calculateShares();
    await payment.save();

    // 🏦 PROCESS BILLING INTEGRATION
    try {
      const billingResult = await processCoursePurchase({
        studentId: userId,
        instructorId: sanitizeObjectId(instructorId),
        courseId: sanitizeObjectId(courseId),
        paymentId: payment._id,
        originalAmount: finalAmount,
        finalAmount,
        adminFee,
        adminPercentage,
        paymentMethod: method,
      });
    } catch (billingError) {
      logger.error(
        `❌ Billing integration error for payment ${payment._id}:`,
        billingError
      );
      // Don't fail the payment if billing fails - log and continue
    }

    // 📋 UPDATE PAYMENT STATUS based on method
    if (paymentSource === "electronic") {
      // Electronic payments can be processed immediately
      payment.status = "processing";
      await payment.save();

      // Electronic payments are confirmed by gateway webhooks in production.
      // Allow explicit opt-in auto-completion for local/test environments only.
      if (process.env.AUTO_COMPLETE_PAYMENTS === "true") {
        payment.status = "completed";
        payment.paidAt = new Date();
        payment.completedAt = new Date();
        await payment.save();
      }
    } else {
      // Direct transfers require admin approval
      payment.adminApproval.required = true;
      payment.status = "pending_admin_approval";
      await payment.save();
    }

    // 📧 PREPARE RESPONSE DATA
    const responseData = {
      paymentId: payment._id,
      status: payment.status,
      amount: payment.finalAmount,
      adminFee: payment.adminFee,
      instructorAmount: payment.instructorAmount,
      method: payment.method,
      transactionType: payment.transactionType,
      requiresApproval: payment.adminApproval.required,
      createdAt: payment.createdAt,
    };

    // 🎆 SUCCESS RESPONSE
    const message =
      paymentSource === "electronic"
        ? "Course payment processed successfully"
        : "Course payment submitted for approval";

    res.status(201).json({
      success: true,
      message,
      data: responseData,
    });
  } catch (error) {
    logger.error("❌ Error processing course payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process course payment",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Submit admin fee payment with receipt
 * @route POST /api/billing/admin-fee-payment
 * @access Private (Students/Instructors)
 */
const submitAdminFeePayment = async (req, res) => {
  try {
    logger.info("🔍 BACKEND - Received req.body:", req.body);
    logger.info(
      "🔍 BACKEND - Received req.file:",
      req.file ? "File present" : "No file"
    );

    const { amount, description = "Admin fee payment" } = req.body;
    const userId = req.user.id;

    logger.info(
      "🔍 BACKEND - Extracted amount:",
      amount,
      "Type:",
      typeof amount
    );
    logger.info("🔍 BACKEND - Amount validation:", !amount, amount <= 0);

    // Validate required fields
    if (!amount || amount <= 0) {
      logger.info("🔍 BACKEND - Validation failed for amount:", amount);
      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required",
      });
    }

    // Check if receipt file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Receipt file is required for admin fee payments",
      });
    }

    // Get user's billing account
    const billingAccount = await getBillingAccountByRole(userId, req.user.role);

    if (!billingAccount) {
      return res.status(404).json({
        success: false,
        message: "Billing account not found",
      });
    }

    // Check if user has outstanding admin fees
    const outstandingFees =
      req.user.role === "student"
        ? billingAccount.annualFees || 0
        : billingAccount.owedAdminFees || 0;

    if (outstandingFees <= 0) {
      return res.status(400).json({
        success: false,
        message: "No outstanding admin fees to pay",
      });
    }

    if (amount > outstandingFees) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ($${amount}) exceeds outstanding fees ($${outstandingFees})`,
      });
    }

    // Upload receipt to S3 in admin-fee-receipts folder
    const uploadResult = await uploadFile(req.file, "admin-fee-receipts");

    // Get current balance before transaction (don't deduct yet - wait for approval)
    const currentBalance = billingAccount.availableBalance || 0;

    // Don't call settleAdminFee() here - wait for admin approval
    // The payment will be processed when admin approves the transaction

    // Create a billing transaction for tracking
    const transaction = await BillingTransaction.create({
      userId: userId,
      type: "debit",
      amount: amount,
      description: `${description} - Receipt uploaded`,
      category: "admin_fee_payment",
      status: "pending_approval",
      balanceBefore: currentBalance,
      balanceAfter: currentBalance - amount, // Debit reduces balance
      metadata: {
        receiptKey: uploadResult.key,
        paymentMethod: "bank_transfer",
        submittedAt: new Date(),
        requiresApproval: true,
      },
    });

    res.status(201).json({
      success: true,
      message:
        "Admin fee payment submitted successfully. Awaiting admin approval.",
      data: {
        transactionId: transaction._id,
        amount: amount,
        receiptUploaded: true,
        status: "pending_approval",
        submittedAt: transaction.createdAt,
      },
    });
  } catch (error) {
    logger.error("❌ Error submitting admin fee payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit admin fee payment",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Submission failed",
    });
  }
};

/**
 * Get pending admin fee payments for admin approval
 * @route GET /api/billing/admin/pending-fee-payments
 * @access Private (Admin only)
 */
const getPendingAdminFeePayments = async (req, res) => {
  try {
    logger.info("🔍 ADMIN FEE PAYMENTS - Request received");
    logger.info(
      "🔍 User:",
      req.user ? `${req.user.name} (${req.user.role})` : "No user"
    );
    logger.info("🔍 Query params:", req.query);

    // Verify admin access
    if (req.user.role !== "admin") {
      logger.info("🔍 Access denied - user role:", req.user.role);
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get pending admin fee payments
    const pendingPayments = await BillingTransaction.find({
      category: "admin_fee_payment",
      status: "pending_approval",
    })
      .populate("userId", "name email role profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    logger.info(
      `🔍 Found ${pendingPayments.length} pending admin fee payments:`,
      {
        totalPending: await BillingTransaction.countDocuments({
          category: "admin_fee_payment",
          status: "pending_approval",
        }),
        page,
        limit,
        payments: pendingPayments.map((p) => ({
          id: p._id,
          amount: p.amount,
          user: p.userId?.name,
          role: p.userId?.role,
          status: p.status,
          createdAt: p.createdAt,
        })),
      }
    );

    const totalPending = await BillingTransaction.countDocuments({
      category: "admin_fee_payment",
      status: "pending_approval",
    });

    const totalPages = Math.ceil(totalPending / limit);

    // Add receipt URLs for each payment
    const paymentsWithReceipts = await Promise.all(
      pendingPayments.map(async (payment) => {
        let receiptUrl = null;
        if (payment.metadata?.receiptKey) {
          try {
            receiptUrl = await getFile(payment.metadata.receiptKey, 3600); // 1 hour expiry
          } catch (error) {
            logger.error("Error generating receipt URL:", error);
          }
        }

        return {
          ...payment,
          receiptUrl,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Pending admin fee payments retrieved successfully",
      data: {
        payments: paymentsWithReceipts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPending,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error("❌ Error getting pending admin fee payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve pending payments",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Retrieval failed",
    });
  }
};

/**
 * Approve or reject admin fee payment
 * @route PUT /api/billing/admin/approve-fee-payment/:transactionId
 * @access Private (Admin only)
 */
const approveAdminFeePayment = async (req, res) => {
  try {
    logger.info("🔍 APPROVE/REJECT - Request received:", {
      transactionId: req.params.transactionId,
      action: req.body.action,
      adminNotes: req.body.adminNotes,
      user: req.user.name,
    });

    // Verify admin access
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const { transactionId } = req.params;
    const { action, adminNotes } = req.body; // action: 'approve' or 'reject'

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "approve" or "reject"',
      });
    }

    // Find the transaction
    const transaction = await BillingTransaction.findById(
      transactionId
    ).populate("userId", "name email role");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "pending_approval") {
      return res.status(400).json({
        success: false,
        message: "Transaction is not pending approval",
      });
    }

    // Update transaction status
    transaction.status = action === "approve" ? "completed" : "rejected";
    transaction.metadata.adminApproval = {
      approvedBy: req.user.id,
      approvedAt: new Date(),
      action: action,
      adminNotes: adminNotes || null,
    };

    if (action === "approve") {
      logger.info("🔍 Processing APPROVE action...");
      // Get user's billing account and finalize the payment
      const billingAccount = await getBillingAccountByRole(
        transaction.userId._id,
        transaction.userId.role
      );

      if (billingAccount) {
        // Process the payment properly using model methods
        if (transaction.userId.role === "student") {
          // For students, reduce annual fees
          billingAccount.annualFees = Math.max(
            0,
            (billingAccount.annualFees || 0) - transaction.amount
          );
          billingAccount.totalAdminFeesPaid =
            (billingAccount.totalAdminFeesPaid || 0) + transaction.amount;
        } else if (transaction.userId.role === "instructor") {
          // For instructors, use settleAdminFee method to properly record the payment
          const receiptUrl =
            transaction.metadata?.receiptKey || "admin-approved";
          billingAccount.settleAdminFee(
            transaction.amount,
            receiptUrl,
            transaction.description
          );
        }

        // Update current balance
        billingAccount.recalculateAll();
        await billingAccount.save();

        transaction.metadata.finalizedAt = new Date();

        logger.info(
          `✅ Admin fee payment approved for ${transaction.userId.role}:`,
          {
            userId: transaction.userId._id,
            amount: transaction.amount,
            newBalance: billingAccount.currentBalance,
            remainingFees:
              transaction.userId.role === "student"
                ? billingAccount.annualFees
                : billingAccount.owedAdminFees,
          }
        );
      }
    } else if (action === "reject") {
      logger.info("🔍 Processing REJECT action...");
      // For rejection, we don't need to update billing accounts
      // Just update the transaction status and metadata
      logger.info("✅ Admin fee payment rejected - no billing changes needed");
    }

    await transaction.save();

    const message =
      action === "approve"
        ? "Admin fee payment approved successfully"
        : "Admin fee payment rejected";

    res.status(200).json({
      success: true,
      message,
      data: {
        transactionId: transaction._id,
        status: transaction.status,
        amount: transaction.amount,
        user: {
          id: transaction.userId._id,
          name: transaction.userId.name,
          email: transaction.userId.email,
          role: transaction.userId.role,
        },
        approvedBy: req.user.name || req.user.email,
        approvedAt: transaction.metadata.adminApproval.approvedAt,
      },
    });
  } catch (error) {
    logger.error("❌ Error approving admin fee payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process approval",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Approval failed",
    });
  }
};

/**
 * GET USER'S GIFT CARDS
 *
 * Retrieves gift cards for the current user (non-admin view)
 *
 * @route   GET /api/billing/my-gift-cards
 * @access  Private
 * @returns {Object} User's gift cards
 */
const getUserGiftCards = async (req, res) => {
  try {
    const { page = 1, limit = 10, giftCardType, isActive } = req.query;
    const GiftCard = require("../models/GiftCard");

    // Build query
    const query = { userId: req.user._id };
    
    if (giftCardType) {
      query.giftCardType = giftCardType;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    // Get total count
    const totalCards = await GiftCard.countDocuments(query);
    const totalPages = Math.ceil(totalCards / parseInt(limit));

    // Get paginated gift cards
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const giftCards = await GiftCard.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate statistics
    const allCards = await GiftCard.find({ userId: req.user._id });
    const totalValue = allCards.reduce((sum, card) => sum + (card.amount || 0), 0);
    const activeCards = allCards.filter((card) => card.isActive && !card.isRedeemed).length;

    logger.info("🎁 User gift cards retrieved:", {
      userId: req.user._id,
      count: giftCards.length,
      totalCards,
      page: parseInt(page),
    });

    res.json({
      success: true,
      data: giftCards,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCards,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
      stats: {
        totalCards,
        activeCards,
        totalValue,
        remainingValue: totalValue, // For user view, this is the same
        expiredCards: giftCards.filter((card) => !card.isActive).length,
        redeemedCards: 0, // Not tracking redemption in current structure
      },
    });
  } catch (error) {
    logger.error("❌ Error fetching user gift cards:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gift cards",
      error:
        process.env.NODE_ENV === "development" ? error.message : "Fetch failed",
    });
  }
};

/**
 * DELETE GIFT CARD - ADMIN ONLY
 *
 * Deletes a gift card and removes it from user's billing account
 * Updates all related calculations and balances
 *
 * @route   DELETE /api/billing/admin/gift-card/:id
 * @access  Private (Admin only)
 * @returns {Object} Deletion confirmation
 */
const deleteGiftCard = async (req, res) => {
  try {
    // 🔒 ADMIN AUTHORIZATION CHECK
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const { id } = req.params;

    // 🔍 FIND GIFT CARD
    const GiftCard = require("../models/GiftCard");
    const giftCard = await GiftCard.findById(sanitizeObjectId(id))
      .populate("userId", "name email role")
      .populate("issuedBy", "name email");

    if (!giftCard) {
      return res.status(404).json({
        success: false,
        message: "Gift card not found",
      });
    }

    // 🏦 GET USER'S BILLING ACCOUNT
    const userBillingAccount = await getBillingAccountByRole(
      giftCard.userId._id,
      giftCard.userId.role
    );

    let deductionDetails = null;

    if (userBillingAccount) {
      const userRole = giftCard.userId.role;
      
      logger.info(`🗑️ Deleting gift card for ${userRole}:`, {
        amount: giftCard.amount,
        userId: giftCard.userId._id,
        userName: giftCard.userId.name
      });

      // 🔄 ROLE-BASED DEDUCTION LOGIC
      if (userRole === 'instructor') {
        // 👨‍🏫 INSTRUCTOR: Deduct from totalGiftAmount (affects available balance)
        const beforeBalance = userBillingAccount.totalGiftAmount || 0;
        userBillingAccount.totalGiftAmount = Math.max(
          0,
          beforeBalance - giftCard.amount
        );
        
        deductionDetails = {
          role: 'instructor',
          field: 'totalGiftAmount',
          beforeAmount: beforeBalance,
          afterAmount: userBillingAccount.totalGiftAmount,
          deducted: giftCard.amount
        };

        logger.info(`   💼 Instructor deduction:`, deductionDetails);
        
      } else if (userRole === 'student') {
        // 👨‍🎓 STUDENT: Just remove the card, no balance deduction
        // Students don't have totalGiftAmount field, gift cards are standalone
        deductionDetails = {
          role: 'student',
          field: 'none',
          message: 'Student loses gift card only, no balance deduction'
        };

        logger.info(`   🎓 Student: Gift card removed, no balance deduction`);
      }

      // Remove from giftAmount array if exists
      const giftCardIndex = userBillingAccount.giftAmount?.findIndex(
        (gift) =>
          gift.giftCardId &&
          gift.giftCardId.toString() === giftCard._id.toString()
      );

      if (giftCardIndex !== -1) {
        userBillingAccount.giftAmount.splice(giftCardIndex, 1);
      }

      await userBillingAccount.save();
      logger.info("✅ Gift card deleted and billing account updated");
    }

    // 📊 STORE GIFT CARD INFO BEFORE DELETION
    const deletedGiftCardInfo = {
      _id: giftCard._id,
      cardNumber: giftCard.cardNumber,
      amount: giftCard.amount,
      giftCardType: giftCard.giftCardType,
      recipient: {
        id: giftCard.userId._id,
        name: giftCard.userId.name,
        email: giftCard.userId.email,
        role: giftCard.userId.role,
      },
      issuedBy: {
        id: giftCard.issuedBy?._id,
        name: giftCard.issuedBy?.name,
        email: giftCard.issuedBy?.email,
      },
      issuedDate: giftCard.issuedDate,
      deletedAt: new Date(),
      deletedBy: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    };

    // 🗑️ DELETE GIFT CARD FROM DATABASE
    await GiftCard.findByIdAndDelete(giftCard._id);

    // 📧 LOG SUCCESS MESSAGE
    logger.info(`🗑️ Gift card deleted successfully:`);
    logger.info(`   💳 Card Number: ${giftCard.cardNumber}`);
    logger.info(`   💰 Amount: $${giftCard.amount}`);
    logger.info(
      `   👤 Recipient: ${giftCard.userId.name} (${giftCard.userId.email})`
    );
    logger.info(`   🗑️ Deleted by: ${req.user.name || req.user.email}`);

    // 🎉 SUCCESS RESPONSE
    const successMessage = giftCard.userId.role === 'instructor'
      ? `Gift card deleted successfully. $${giftCard.amount} deducted from ${giftCard.userId.name}'s gift balance.`
      : `Gift card deleted successfully. ${giftCard.userId.name} lost access to this gift card.`;

    res.status(200).json({
      success: true,
      message: successMessage,
      data: {
        deletedGiftCard: deletedGiftCardInfo,
        balanceUpdate: {
          userId: giftCard.userId._id,
          amountRemoved: giftCard.amount,
          userRole: giftCard.userId.role,
          deductionDetails: deductionDetails
        },
      },
    });
  } catch (error) {
    logger.error("❌ Error deleting gift card:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gift card",
    });
  }
};

/**
 * Financial Reconciliation Endpoint
 * @route GET /api/billing/admin/reconciliation
 * @access Private (Admin only)
 */
const getFinancialReconciliation = async (req, res) => {
  try {
    // Verify admin access
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const {
      reconcileAllAccounts,
    } = require("../utils/specializedBillingUtils");
    const reconciliation = await reconcileAllAccounts();

    res.status(200).json({
      success: true,
      message: "Financial reconciliation completed",
      data: reconciliation,
    });
  } catch (error) {
    logger.error("❌ Error in financial reconciliation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to perform financial reconciliation",
      error: error.message,
    });
  }
};

module.exports = {
  getBillingAccount,
  getBillingSummaryController,
  getAdminDashboard,
  getInstructorDashboard,
  getStudentDashboard,
  requestPayout,
  addStudentCredits,
  addGiftCard,
  getGiftCardHistory,
  processCoursePaymentWithBilling,
  getAdminBillingAccount,
  submitAdminFeePayment,
  getPendingAdminFeePayments,
  approveAdminFeePayment,
  getUserGiftCards,
  deleteGiftCard,
  getFinancialReconciliation,
  payoutInstructorCommission,
};
