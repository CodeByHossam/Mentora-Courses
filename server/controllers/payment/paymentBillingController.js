// Credit payments, billing summaries and annual fees. Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const asyncHandler = require("express-async-handler");
const Payment = require("../../models/Payment");
const AdminSettings = require("../../models/AdminSettings");
const { sanitizeHtml, sanitizeText, sanitizeObjectId, sanitizeNumber } = require("../../utils/sanitizer");

// @desc    Initiate credit addition payment
// @route   POST /api/payments/credits/initiate
// @access  Private
const initiateCreditPayment = asyncHandler(async (req, res) => {
  // Sanitize inputs
  const amount = sanitizeNumber(req.body.amount, { min: 1, max: 10000 });
  const method = sanitizeText(req.body.method || "direct_transfer", 20);

  if (!amount) {
    res.status(400);
    throw new Error("Valid amount is required");
  }

  // Get admin settings for fee calculation
  let adminSettings;
  try {
    adminSettings = await AdminSettings.getSettings();
  } catch (settingsError) {
    logger.error("Failed to get admin settings:", settingsError);
    adminSettings = {
      paymentSettings: {
        currency: "usd",
      },
    };
  }

  // Guard: card/PayPal credit payments are no longer available
  const unavailableCreditMethods = new Set(["stripe", "paypal", "card", "gift_card"]);
  if (unavailableCreditMethods.has(method)) {
    res.status(410);
    throw new Error("Card/PayPal payment is not available. Please contact your instructor.");
  }


  try {
    // Create payment record for credit addition
    const payment = await Payment.create({
      userId: req.user._id, // FIXED: Use userId instead of student
      course: null, // No course for credit payments
      amount: amount,
      finalAmount: amount, // FIXED: Add required finalAmount field
      originalAmount: amount,
      adminFee: 0, // No admin fee for credit additions
      adminPercentage: 0,
      instructorAmount: 0,
      method: method || "direct_transfer",
      status: "pending",
      type: "credit_addition",
    });

    if (method === "direct" || method === "direct_transfer") {
      // For direct transfer credit addition
      res.status(200).json({
        success: true,
        message: "Direct transfer credit payment initiated",
        data: {
          paymentId: payment._id,
          amount: amount,
          bankDetails: {
            bankName: "Mentora Bank",
            accountNumber: "1234567890",
            accountHolder: "Mentora Education Platform",
            swift: "LTRKUS33",
            iban: "US12LTRK1234567890123456",
          },
          instructions: [
            "Transfer the exact amount to the bank account above",
            "Include your name and email in the transfer reference",
            "Upload the transfer receipt for verification",
            "Credits will be added after admin approval",
          ],
        },
      });
    } else {
      res.status(400);
      throw new Error("Invalid payment method");
    }
  } catch (error) {
    logger.error("Credit payment initiation error:", error);
    res.status(500);
    throw new Error("Failed to initiate credit payment");
  }
});

// @desc    Get user billing summary
// @route   GET /api/payments/billing-summary
// @access  Private

// @desc    Get user billing summary
// @route   GET /api/payments/billing-summary
// @access  Private
const getUserBillingSummary = asyncHandler(async (req, res) => {
  try {
    const { getUserBillingSummary } = require("../../utils/billingUtils");
    const billingSummary = await getUserBillingSummary(req.user._id);

    res.status(200).json({
      success: true,
      message: "Billing summary retrieved successfully",
      data: billingSummary,
    });
  } catch (error) {
    logger.error("Error getting billing summary:", error);
    res.status(500);
    throw new Error("Failed to get billing summary");
  }
});

// @desc    Process annual fees (Admin only)
// @route   POST /api/payments/process-annual-fees
// @access  Private/Admin

// @desc    Process annual fees (Admin only)
// @route   POST /api/payments/process-annual-fees
// @access  Private/Admin
const processAnnualFeesEndpoint = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      res.status(403);
      throw new Error("Access denied. Admin only.");
    }

    const { processAnnualFees } = require("../../utils/billingUtils");
    const results = await processAnnualFees();

    res.status(200).json({
      success: true,
      message: "Annual fees processed successfully",
      data: {
        processed: results.length,
        results: results,
      },
    });
  } catch (error) {
    logger.error("Error processing annual fees:", error);
    res.status(500);
    throw new Error("Failed to process annual fees");
  }
});

// @desc    Check payment status
// @route   POST /api/payments/:id/check-status
// @access  Private

module.exports = {
  initiateCreditPayment,
  getUserBillingSummary,
  processAnnualFeesEndpoint
};
