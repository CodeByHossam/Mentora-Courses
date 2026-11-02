// Student payment initiation and Stripe confirmation. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const Course = require("../../models/Course");
const User = require("../../models/User");
const AdminSettings = require("../../models/AdminSettings");
const { sanitizeHtml, sanitizeText, sanitizeObjectId, sanitizeNumber } = require("../../utils/sanitizer");
const stripe = require("./stripeClient");
const { autoEnrollStudent, processInstructorCommission, finalizeEnrollmentAndBills } = require("./paymentHelpers");

// @desc    Initiate payment for a course
// @route   POST /api/payments/initiate
// @access  Private
const initiatePayment = asyncHandler(async (req, res) => {
  // Sanitize inputs
  const courseId = sanitizeObjectId(req.body.courseId);
  const method = sanitizeText(req.body.method || "direct_transfer", 20);

  if (!courseId) {
    res.status(400);
    throw new Error("Course ID is required");
  }

  // Get course details from database (never trust client)
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  // Calculate amount server-side (never trust client)
  const amount = course.isFree ? 0 : course.finalPrice;

  if (amount <= 0 && !course.isFree) {
    res.status(400);
    throw new Error("Invalid course price");
  }

  // Get admin settings for fee calculation
  let adminSettings;
  try {
    adminSettings = await AdminSettings.getSettings();
  } catch (settingsError) {
    logger.error("Failed to get admin settings:", settingsError);
    // Use default values if admin settings fail
    adminSettings = {
      paymentSettings: {
        studentAdminFee: 0,
        globalDeductionPercentage: 0,
        currency: "usd",
      },
    };
  }

  const adminFee = adminSettings.paymentSettings?.studentAdminFee || 0;
  const adminPercentage =
    adminSettings.paymentSettings?.globalDeductionPercentage || 0;

  const totalAmount = amount + adminFee;
  const adminFeeTotal = adminFee + (amount * adminPercentage) / 100;
  const instructorAmount = amount - (amount * adminPercentage) / 100;

  // Guard: card/PayPal/gift-card course payments are no longer available
  const unavailableMethods = new Set(["stripe", "paypal", "card", "gift_card"]);
  if (unavailableMethods.has(method)) {
    const msg =
      method === "gift_card"
        ? "Gift card payment is not available. Please contact your instructor."
        : "Card/PayPal payment is not available. Please contact your instructor.";
    res.status(410);
    throw new Error(msg);
  }


  try {
    // Create payment record first
    const payment = await Payment.create({
      userId: req.user._id, // FIXED: Use userId instead of student
      course: courseId,
      amount: totalAmount,
      finalAmount: totalAmount, // FIXED: Add required finalAmount field
      originalAmount: amount,
      adminFee: adminFeeTotal,
      adminPercentage,
      instructorAmount,
      method: method || "direct_transfer",
      status: "pending",
    });

    if (method === "direct" || method === "direct_transfer") {
      // For direct transfer, the student pays the Admin (unified flow)
      const adminUser = await User.findOne({ role: "admin" });
      if (!adminUser) {
        res.status(404);
        throw new Error("Admin user not found");
      }

      // Return admin bank details for transfer
      res.status(200).json({
        success: true,
        message: "Direct transfer payment initiated (pay to Admin)",
        data: {
          paymentId: payment._id,
          amount: totalAmount,
          bankDetails: {
            bankName:
              adminUser.paymentDetails?.bankDetails?.bankName ||
              "Bank Name Not Provided",
            accountNumber:
              adminUser.paymentDetails?.bankDetails?.accountNumber ||
              "Account Number Not Provided",
            accountHolder: adminUser.name || "Platform Admin",
            swift:
              adminUser.paymentDetails?.bankDetails?.swift ||
              "SWIFT Code Not Provided",
            iban:
              adminUser.paymentDetails?.bankDetails?.iban ||
              "IBAN Not Provided",
          },
          adminDetails: {
            name: adminUser.name,
            email: adminUser.email,
          },
        },
      });
    } else {
      res.status(400);
      throw new Error("Invalid payment method");
    }
  } catch (error) {
    logger.error("Payment initiation error:", error);
    res.status(500);
    throw new Error("Failed to initiate payment");
  }
});

// @desc    Confirm Stripe payment
// @route   POST /api/payments/stripe/confirm
// @access  Private

// @desc    Confirm Stripe payment
// @route   POST /api/payments/stripe/confirm
// @access  Private
const confirmStripePayment = asyncHandler(async (req, res) => {
  // Sanitize input
  const paymentIntentId = sanitizeText(req.body.paymentIntentId, 100);

  if (!paymentIntentId) {
    res.status(400);
    throw new Error("Payment Intent ID is required");
  }

  try {
    if (!stripe) {
      res.status(503);
      throw new Error("Stripe payment service is not configured");
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Find payment record
    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
    })
      .populate("course", "title")
      .populate("userId", "name email");

    if (!payment) {
      res.status(404);
      throw new Error("Payment record not found");
    }

    if (paymentIntent.status === "succeeded") {
      // Update payment status and gateway response
      payment.status = "paid";
      payment.paidAt = new Date();
      payment.paymentGatewayResponse = { stripePaymentIntent: paymentIntent };
      await payment.save();

      // Authoritative finalization path
      await payment.completePayment();

      // Update user bill (legacy support)
      const user = await User.findById(payment.userId._id);
      if (payment.course) {
        const bill = user.bills.find((b) =>
          b.description.includes(payment.course.title)
        );
        if (bill) {
          bill.status = "paid";
          bill.paidAt = new Date();
          bill.paymentId = payment._id;
          await user.save();
        }
      }

      // Auto-enroll student if this is a course payment
      let enrollmentResult = null;
      if (payment.course) {
        enrollmentResult = await autoEnrollStudent(
          payment.userId._id,
          payment.course._id,
          payment._id
        );
      }

      res.status(200).json({
        success: true,
        message: payment.course
          ? "Payment confirmed and student enrolled successfully"
          : "Credit payment confirmed successfully",
        data: {
          payment,
          enrollment: enrollmentResult,
          billing: { finalizedBy: "completePayment" },
        },
      });
    } else {
      // Payment failed
      payment.status = "failed";
      payment.failureReason = `Stripe payment status: ${paymentIntent.status}`;
      await payment.save();

      res.status(400).json({
        success: false,
        message: "Payment was not successful",
        data: { status: paymentIntent.status },
      });
    }
  } catch (error) {
    logger.error("Stripe confirmation error:", error);
    res.status(500);
    throw new Error("Failed to confirm Stripe payment");
  }
});

// @desc    Handle direct transfer payment
// @route   POST /api/payments/direct-transfer
// @access  Private

module.exports = {
  initiatePayment,
  confirmStripePayment
};
