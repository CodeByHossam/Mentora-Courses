// Stripe payment intent succeeded/failed events. Split from webhookHelpers.js; bodies unchanged.

const logger = require('../../utils/logger');
const Payment = require("../../models/Payment");
const {
  processPaymentCompletion,
} = require("./webhookPaymentCompletion");

/**
 * Handle successful payment intent
 * Backup handler for direct payment intent usage
 */

const handlePaymentIntentSucceeded = async (paymentIntent) => {
  logger.info(
    "🎯 handlePaymentIntentSucceeded called with payment intent:",
    paymentIntent.id
  );

  try {
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id,
    })
      .populate("userId", "name email role enrolledCourses")
      .populate("course", "title instructor enrolledStudents");

    if (!payment) {
      logger.error(
        "❌ Payment not found for payment intent:",
        paymentIntent.id
      );
      return;
    }

    logger.info("✅ Payment found for payment intent:", payment._id);

    // Use shared processing function
    return await processPaymentCompletion(payment, paymentIntent);
  } catch (error) {
    logger.error("Error handling payment intent succeeded:", error);
    throw error;
  }
};

/**
 * Handle failed payment intent
 */

const handlePaymentIntentFailed = async (paymentIntent) => {
  try {
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (!payment) {
      logger.error(
        "Payment not found for failed payment intent:",
        paymentIntent.id
      );
      return;
    }

    payment.status = "failed";
    payment.failureReason =
      paymentIntent.last_payment_error?.message || "Payment failed";
    payment.paymentGatewayResponse = {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error,
    };

    await payment.save();
  } catch (error) {
    logger.error("Error handling payment intent failed:", error);
    throw error;
  }
};

module.exports = {
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed
};
