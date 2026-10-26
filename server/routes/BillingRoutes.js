const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); // Import upload middleware at the top
const {
  getBillingAccount,
  getBillingSummaryController,
  getAdminDashboard,
  processCoursePaymentWithBilling,
  getAdminBillingAccount,
  addGiftCard,
  getGiftCardHistory,
  getUserGiftCards,
  deleteGiftCard,
  submitAdminFeePayment,
  getPendingAdminFeePayments,
  approveAdminFeePayment,
  getFinancialReconciliation,
  payoutInstructorCommission,
} = require("../controllers/BillingController");

const {
  getPendingDirectTransfers,
} = require("../controllers/paymentController");

const BillingTransaction = require("../models/BillingTransaction");

/**
 * Specialized Billing Routes
 *
 * Routes for the new specialized billing system with role-based accounts
 */

// Apply authentication to all routes
router.use(protect);

/**
 * @route   GET /api/specialized-billing/account
 * @desc    Get billing account based on user role
 * @access  Private (All authenticated users)
 */
router.get("/account", getBillingAccount);

/**
 * @route   GET /api/specialized-billing/summary
 * @desc    Get comprehensive billing summary
 * @access  Private (All authenticated users)
 */
router.get("/summary", getBillingSummaryController);

/**
 * @route   GET /api/specialized-billing/admin/dashboard
 * @desc    Get admin financial dashboard
 * @access  Private (Admin only)
 */
router.get("/admin/dashboard", getAdminDashboard);

/**
 * @route   POST /api/specialized-billing/admin/payout/:instructorId
 * @desc    Payout instructor commissions
 * @access  Private (Admin only)
 */
router.post("/admin/payout/:instructorId", admin, payoutInstructorCommission);

/**
 * @route   POST /api/billing/admin/process-instructor-payout
 * @desc    Process instructor payout with receipt upload (new simplified system)
 * @access  Private (Admin only)
 */
router.post("/admin/process-instructor-payout", admin, upload.single("receipt"), async (req, res) => {
  try {
    const { instructorId, amount, transactionReference, notes } = req.body;
    const adminId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Payment receipt is required" });
    }

    // Upload receipt to S3
    const { uploadFile } = require("../utils/aws");
    const uploadResult = await uploadFile(req.file, "instructor-payout-receipts");
    const receiptUrl = uploadResult.key;

    // Get instructor billing account
    const InstructorBillingAccount = require("../models/InstructorBillingAccount");
    const instructorAccount = await InstructorBillingAccount.findOne({ instructorId });

    if (!instructorAccount) {
      return res.status(404).json({ success: false, message: "Instructor billing account not found" });
    }

    const payoutAmount = parseFloat(amount);

    console.log(`💰 Processing payout for instructor ${instructorId}:`);
    console.log(`   Payout Amount: $${payoutAmount}`);
    console.log(`   Pending Commissions: $${instructorAccount.pendingCommissions}`);
    console.log(`   Total Earned: $${instructorAccount.totalCommissionEarned}`);

    if (payoutAmount > instructorAccount.pendingCommissions) {
      return res.status(400).json({ 
        success: false, 
        message: `Payout amount ($${payoutAmount}) exceeds pending commissions ($${instructorAccount.pendingCommissions})` 
      });
    }

    // Update instructor billing account
    const balanceBefore = instructorAccount.pendingCommissions;
    instructorAccount.pendingCommissions -= payoutAmount;
    instructorAccount.totalPayoutsReceived += payoutAmount;
    const balanceAfter = instructorAccount.pendingCommissions;
    await instructorAccount.save();

    // Update admin billing account
    const AdminBillingAccount = require("../models/AdminBillingAccount");
    const adminAccount = await AdminBillingAccount.findOne({ adminId });

    if (adminAccount) {
      adminAccount.totalInstructorPayouts += payoutAmount;
      adminAccount.platformBalance = adminAccount.calculateNetProfit();
      await adminAccount.save();
    }

    // Create billing transaction for audit trail
    const BillingTransaction = require("../models/BillingTransaction");
    await BillingTransaction.create({
      userId: instructorId,
      type: "credit",
      amount: payoutAmount,
      category: "instructor_payout",
      description: `Instructor payout - ${transactionReference}`,
      status: "completed",
      from: adminId,
      to: instructorId,
      processedBy: adminId,
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      metadata: {
        transactionReference,
        receiptUrl,
        notes,
        processedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: "Payout processed successfully",
      data: {
        instructorId,
        amount: payoutAmount,
        transactionReference,
        receiptUrl,
        newPendingCommissions: instructorAccount.pendingCommissions,
        totalPayoutsReceived: instructorAccount.totalPayoutsReceived
      }
    });
  } catch (error) {
    console.error("Error processing instructor payout:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to process payout" 
    });
  }
});

/**
 * @route   GET /api/specialized-billing/admin/account
 * @desc    Get admin billing account and earnings
 * @access  Private (Admin only)
 */
router.get("/admin/account", admin, getAdminBillingAccount);

/**
 * @route   GET /api/billing/admin/pending-transfers
 * @desc    Get pending direct transfer payments for admin
 * @access  Private (Admin only)
 */
router.get("/admin/pending-transfers", admin, getPendingDirectTransfers);

/**
 * @route   POST /api/billing/admin/gift-card
 * @desc    Add gift card credits to user account
 * @access  Private (Admin only)
 */
router.post("/admin/gift-card", admin, addGiftCard);

/**
 * @route   GET /api/billing/admin/gift-cards
 * @desc    Get gift card history with filtering and pagination
 * @access  Private (Admin only)
 */
router.get("/admin/gift-cards", admin, getGiftCardHistory);

/**
 * @route   GET /api/billing/transactions
 * @desc    Get billing transactions with pagination
 * @access  Private (All authenticated users)
 */
router.get("/transactions", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // For admin users, get all transactions
    // For other users, get only their transactions
    const query = req.user.role === "admin" ? {} : { userId: req.user.id };

    const transactions = await BillingTransaction.find(query)
      .populate("userId", "name email role")
      .populate("relatedCourse", "title")
      .populate("relatedPayment", "amount method")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalTransactions = await BillingTransaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / limit);

    res.status(200).json({
      success: true,
      message: "Billing transactions retrieved successfully",
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalTransactions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error getting billing transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve billing transactions",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Data retrieval failed",
    });
  }
});

/**
 * @route   POST /api/billing/process-course-payment
 * @desc    Process course payment with billing integration
 * @access  Private (Student/Instructor/Admin)
 */
router.post("/process-course-payment", processCoursePaymentWithBilling);

/**
 * @route   POST /api/billing/admin-fee-payment
 * @desc    Submit admin fee payment with receipt upload
 * @access  Private (Students/Instructors)
 */
router.post(
  "/admin-fee-payment",
  upload.single("receipt"),
  submitAdminFeePayment
);

/**
 * @route   GET /api/billing/admin/pending-fee-payments
 * @desc    Get pending admin fee payments for approval
 * @access  Private (Admin only)
 */
router.get("/admin/pending-fee-payments", admin, getPendingAdminFeePayments);

/**
 * @route   PUT /api/billing/admin/approve-fee-payment/:transactionId
 * @desc    Approve or reject admin fee payment
 * @access  Private (Admin only)
 */
router.put(
  "/admin/approve-fee-payment/:transactionId",
  admin,
  approveAdminFeePayment
);

// ============================================================================
// 🎁 GIFT CARD ROUTES
// ============================================================================

/**
 * @route   GET /api/billing/my-gift-cards
 * @desc    Get user's gift cards
 * @access  Private
 */
router.get("/my-gift-cards", protect, getUserGiftCards);

/**
 * @route   GET /api/billing/course-gift-card/:courseId
 * @desc    Get user's gift card for specific course
 * @access  Private
 */
router.get("/course-gift-card/:courseId", protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    const GiftCard = require("../models/GiftCard");
    const mongoose = require("mongoose");

    console.log('🔍 Searching for gift card:', {
      userId: userId.toString(),
      courseId,
      userRole: req.user.role
    });

    // Convert courseId to ObjectId for proper comparison
    let courseObjectId;
    try {
      courseObjectId = new mongoose.Types.ObjectId(courseId);
    } catch (err) {
      console.error('Invalid courseId format:', courseId);
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format"
      });
    }

    // Find active, unredeemed gift card for this user and course
    const giftCard = await GiftCard.findOne({
      userId,
      'metadata.courseId': courseObjectId,
      isActive: true,
      isRedeemed: false,
      giftCardType: 'course_purchase',
      expiryDate: { $gt: new Date() } // Also check not expired
    });

    console.log('🎁 Gift card found:', giftCard ? {
      cardNumber: giftCard.cardNumber,
      amount: giftCard.amount,
      courseId: giftCard.metadata?.courseId?.toString()
    } : 'No gift card found');

    res.json({
      success: true,
      data: giftCard
    });
  } catch (error) {
    console.error("❌ Error fetching course gift card:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course gift card"
    });
  }
});

/**
 * @route   GET /api/billing/gift-card-balance
 * @desc    Get user's total gift card balance (excluding course-specific cards)
 * @access  Private
 */
router.get("/gift-card-balance", protect, async (req, res) => {
  try {
    const GiftCard = require("../models/GiftCard");
    const mongoose = require("mongoose");

    // Get all active, non-redeemed, non-expired gift cards for this user
    // Exclude course-specific gift cards (those with metadata.courseId)
    const giftCards = await GiftCard.find({
      userId: req.user._id,
      isActive: true,
      isRedeemed: false,
      expiryDate: { $gt: new Date() },
      'metadata.courseId': { $exists: false } // Exclude course-specific cards
    });

    // Calculate total balance
    const totalBalance = giftCards.reduce((sum, card) => sum + (card.amount || 0), 0);

    console.log('💰 Gift card balance for user:', {
      userId: req.user._id.toString(),
      totalCards: giftCards.length,
      totalBalance
    });

    res.status(200).json({
      success: true,
      data: totalBalance,
      message: "Gift card balance retrieved successfully",
    });
  } catch (error) {
    console.error("Error getting gift card balance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get gift card balance",
    });
  }
});

/**
 * @route   POST /api/billing/pay-with-gift-card
 * @desc    Pay for course using gift card balance
 * @access  Private
 */
router.post("/pay-with-gift-card", protect, async (req, res) => {
  try {
    const { courseId, amount, giftCardId, useCourseGiftCard } = req.body;
    const userId = req.user._id;

    const Course = require("../models/Course");
    const GiftCard = require("../models/GiftCard");
    const User = require("../models/User");
    const mongoose = require("mongoose");

    console.log('🎁 Processing gift card payment:', {
      courseId,
      amount,
      giftCardId,
      useCourseGiftCard,
      userId: userId.toString()
    });

    // Get course details
    const course = await Course.findById(courseId).populate('instructor', 'name email');
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Find the gift card
    let giftCard;
    if (useCourseGiftCard && giftCardId) {
      // Use specific course gift card
      giftCard = await GiftCard.findOne({
        _id: giftCardId,
        userId,
        isActive: true,
        isRedeemed: false
      });
    } else {
      // Find any available gift card with sufficient balance
      giftCard = await GiftCard.findOne({
        userId,
        isActive: true,
        isRedeemed: false,
        expiryDate: { $gt: new Date() },
        amount: { $gte: amount }
      }).sort({ expiryDate: 1 }); // Use oldest first
    }

    if (!giftCard) {
      return res.status(400).json({
        success: false,
        message: "No valid gift card found or insufficient balance",
      });
    }

    // Check if gift card has sufficient balance
    if (giftCard.amount < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${giftCard.amount.toFixed(2)}, Required: $${amount.toFixed(2)}`,
      });
    }

    // Use the gift card
    await giftCard.useGiftCard(amount, `Course purchase: ${course.title}`);

    console.log('🎁 Gift card used:', {
      cardNumber: giftCard.cardNumber,
      amountUsed: amount,
      remainingBalance: giftCard.amount,
      isRedeemed: giftCard.isRedeemed,
      isActive: giftCard.isActive
    });

    // Enroll student in course
    if (!course.enrolledStudents.includes(userId)) {
      course.enrolledStudents.push(userId);
      course.students += 1;
      await course.save();
    }

    // Add course to user's enrolled courses
    const user = await User.findById(userId);
    if (user && !user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
    }

    console.log('✅ Gift card payment successful:', {
      courseId,
      courseName: course.title,
      amountPaid: amount,
      giftCardRemaining: giftCard.amount,
      cardStatus: giftCard.isRedeemed ? 'Fully Redeemed & Inactive' : 'Partially Used'
    });

    res.status(200).json({
      success: true,
      data: {
        courseId,
        courseName: course.title,
        amountPaid: amount,
        giftCardRemaining: giftCard.amount,
        message: "Course purchased successfully with gift card!",
      },
    });
  } catch (error) {
    console.error("❌ Error processing gift card payment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process gift card payment",
    });
  }
});

/**
 * @route   DELETE /api/billing/admin/gift-card/:id
 * @desc    Delete gift card (Admin only)
 * @access  Private (Admin only)
 */
router.delete("/admin/gift-card/:id", admin, deleteGiftCard);

/**
 * @route   POST /api/billing/claim-gift-card/:id
 * @desc    Claim gift card and add to pending commissions (Instructor only)
 * @access  Private
 */
router.post("/claim-gift-card/:id", protect, async (req, res) => {
  try {
    const { id: giftCardId } = req.params;
    const userId = req.user._id;

    const GiftCard = require("../models/GiftCard");
    const InstructorBillingAccount = require("../models/InstructorBillingAccount");

    // Find gift card
    const giftCard = await GiftCard.findById(giftCardId);

    if (!giftCard) {
      return res.status(404).json({
        success: false,
        message: "Gift card not found"
      });
    }

    // Verify ownership
    if (giftCard.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only claim your own gift cards"
      });
    }

    // Check if already redeemed
    if (giftCard.isRedeemed) {
      return res.status(400).json({
        success: false,
        message: "Gift card has already been claimed"
      });
    }

    // Check if active
    if (!giftCard.isActive) {
      return res.status(400).json({
        success: false,
        message: "Gift card is not active"
      });
    }

    // Check if expired
    if (new Date() > new Date(giftCard.expiryDate)) {
      return res.status(400).json({
        success: false,
        message: "Gift card has expired"
      });
    }

    // Get instructor billing account
    const instructorAccount = await InstructorBillingAccount.findOne({ instructorId: userId });

    if (!instructorAccount) {
      return res.status(404).json({
        success: false,
        message: "Instructor billing account not found"
      });
    }

    // Add amount to pending commissions
    instructorAccount.pendingCommissions += giftCard.amount;
    instructorAccount.totalGiftAmount += giftCard.amount;
    await instructorAccount.save();

    // Mark gift card as redeemed
    giftCard.isRedeemed = true;
    giftCard.redeemedAt = new Date();
    giftCard.isActive = false;
    await giftCard.save();

    res.json({
      success: true,
      message: "Gift card claimed successfully",
      data: {
        amount: giftCard.amount,
        newPendingCommissions: instructorAccount.pendingCommissions,
        totalGiftAmount: instructorAccount.totalGiftAmount
      }
    });
  } catch (error) {
    console.error("Error claiming gift card:", error);
    res.status(500).json({
      success: false,
      message: "Failed to claim gift card"
    });
  }
});

/**
 * @route   GET /api/billing/admin/reconciliation
 * @desc    Get financial reconciliation report (Admin only)
 * @access  Private (Admin only)
 */
router.get("/admin/reconciliation", admin, getFinancialReconciliation);

/**
 * @route   GET /api/billing/summary/admin
 * @desc    Simplified admin financial summary (Phase 1)
 * @access  Private (Admin only)
 */
router.get("/summary/admin", admin, async (req, res) => {
  const { getAdminFinancialSummary } = require("../controllers/financialSummaryController");
  return getAdminFinancialSummary(req, res);
});

/**
 * @route   GET /api/billing/summary/student
 * @desc    Simplified student financial summary (Phase 1)
 * @access  Private
 */
router.get("/summary/student", async (req, res) => {
  const { getStudentFinancialSummary } = require("../controllers/financialSummaryController");
  return getStudentFinancialSummary(req, res);
});

/**
 * @route   GET /api/billing/summary/instructor
 * @desc    Simplified instructor financial summary (Phase 1)
 * @access  Private
 */
router.get("/summary/instructor", async (req, res) => {
  const { getInstructorFinancialSummary } = require("../controllers/financialSummaryController");
  return getInstructorFinancialSummary(req, res);
});

module.exports = router;
