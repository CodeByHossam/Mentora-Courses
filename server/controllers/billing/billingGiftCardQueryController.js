// Gift card route handlers. Split from routes/BillingRoutes.js; handler bodies unchanged.

const getCourseGiftCard = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    const GiftCard = require("../../models/GiftCard");
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
};

const getGiftCardBalance = async (req, res) => {
  try {
    const GiftCard = require("../../models/GiftCard");
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
};

module.exports = {
  getCourseGiftCard,
  getGiftCardBalance,
};
