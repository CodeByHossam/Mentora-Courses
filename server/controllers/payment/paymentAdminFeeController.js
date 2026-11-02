// Admin fee payments and receipt uploads. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const User = require("../../models/User");
const AdminSettings = require("../../models/AdminSettings");
const stripe = require("./stripeClient");

// @desc    Process admin fee payment from instructor
// @route   POST /api/payments/admin-fee-payment
// @access  Private/Instructor
const processAdminFeePayment = asyncHandler(async (req, res) => {
  try {
    const { amount, method, description, receiptFile } = req.body;
    const instructorId = req.user._id;

    logger.info("≡ƒöä Processing admin fee payment:", {
      instructorId,
      amount,
      method,
      description,
    });

    // Validate instructor
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== "instructor") {
      res.status(403);
      throw new Error("Access denied. Instructor role required.");
    }

    // Get admin settings for fee validation
    const adminSettings = await AdminSettings.getSettings();
    const minAmount = 1; // Minimum $1
    const maxAmount = 10000; // Maximum $10,000

    if (amount < minAmount || amount > maxAmount) {
      res.status(400);
      throw new Error(`Amount must be between $${minAmount} and $${maxAmount}`);
    }

    // Create payment record
    const payment = await Payment.create({
      userId: instructorId,
      amount: parseFloat(amount),
      finalAmount: parseFloat(amount),
      method: method,
      status: method === "direct_transfer" ? "pending_verification" : "pending",
      description: description || `Admin fee payment of $${amount}`,
      paymentType: "admin_fee_payment",
      metadata: {
        paymentType: "admin_fee_payment",
        instructorId: instructorId,
        originalAmount: parseFloat(amount),
        receiptUploaded: !!receiptFile,
      },
    });

    // Handle different payment methods
    let responseData = {
      success: true,
      payment,
      message: "Admin fee payment initiated successfully",
    };

    switch (method) {
      case "stripe":
        // Create Stripe payment intent
        if (!stripe) {
          res.status(500);
          throw new Error("Stripe is not configured");
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          currency: "usd",
          metadata: {
            paymentId: payment._id.toString(),
            paymentType: "admin_fee_payment",
            instructorId: instructorId.toString(),
          },
          description: `Admin fee payment - ${instructor.name}`,
        });

        responseData.clientSecret = paymentIntent.client_secret;
        responseData.paymentIntentId = paymentIntent.id;
        break;

      case "paypal":
        // PayPal will be handled by frontend redirect
        responseData.redirectUrl = `/api/payments/paypal/create-order`;
        break;

      case "direct_transfer":
        // Direct transfer requires receipt upload and admin verification
        payment.status = "pending_verification";
        payment.metadata.requiresReceipt = true;
        await payment.save();

        responseData.message =
          "Direct transfer payment created. Please upload receipt for verification.";
        responseData.requiresReceipt = true;
        break;

      default:
        res.status(400);
        throw new Error("Invalid payment method");
    }

    logger.info("Γ£à Admin fee payment created:", payment._id);

    res.status(201).json(responseData);
  } catch (error) {
    logger.error("Γ¥î Error processing admin fee payment:", error);
    res.status(500);
    throw new Error("Failed to process admin fee payment: " + error.message);
  }
});

// @desc    Upload receipt for admin fee payment
// @route   POST /api/payments/admin-fee-payment/:paymentId/receipt
// @access  Private/Instructor

// @desc    Upload receipt for admin fee payment
// @route   POST /api/payments/admin-fee-payment/:paymentId/receipt
// @access  Private/Instructor
const uploadAdminFeeReceipt = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;
    const instructorId = req.user._id;

    // Find payment
    const payment = await Payment.findOne({
      _id: paymentId,
      userId: instructorId,
      paymentType: "admin_fee_payment",
    });

    if (!payment) {
      res.status(404);
      throw new Error("Admin fee payment not found");
    }

    if (payment.status !== "pending_verification") {
      res.status(400);
      throw new Error("Payment is not pending verification");
    }

    // Handle file upload (receipt)
    if (!req.file) {
      res.status(400);
      throw new Error("Receipt file is required");
    }

    // Store receipt information
    payment.receiptUrl = req.file.path || req.file.filename;
    payment.metadata = {
      ...payment.metadata,
      receiptUploaded: true,
      receiptOriginalName: req.file.originalname,
      receiptSize: req.file.size,
      uploadedAt: new Date(),
    };

    payment.status = "pending_admin_approval";
    await payment.save();

    logger.info("Γ£à Receipt uploaded for admin fee payment:", paymentId);

    res.status(200).json({
      success: true,
      message:
        "Receipt uploaded successfully. Payment is now pending admin approval.",
      payment,
    });
  } catch (error) {
    logger.error("Γ¥î Error uploading admin fee receipt:", error);
    res.status(500);
    throw new Error("Failed to upload receipt: " + error.message);
  }
});



module.exports = {
  processAdminFeePayment,
  uploadAdminFeeReceipt
};
