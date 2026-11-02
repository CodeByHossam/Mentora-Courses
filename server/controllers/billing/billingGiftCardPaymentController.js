// Gift card route handlers. Split from routes/BillingRoutes.js; handler bodies unchanged.

const payWithGiftCard = async (req, res) => {
  try {
    const { courseId, amount, giftCardId, useCourseGiftCard } = req.body;
    const userId = req.user._id;

    const Course = require("../../models/Course");
    const GiftCard = require("../../models/GiftCard");
    const User = require("../../models/User");
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
};

const claimGiftCard = async (req, res) => {
  try {
    const { id: giftCardId } = req.params;
    const userId = req.user._id;

    const GiftCard = require("../../models/GiftCard");
    const InstructorBillingAccount = require("../../models/InstructorBillingAccount");

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
};

module.exports = {
  payWithGiftCard,
  claimGiftCard,
};
