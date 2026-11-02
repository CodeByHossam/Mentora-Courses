const logger = require('../../utils/logger');
const AdminFeePayment = require("../../models/AdminFeePayment");
const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
const AdminBillingAccount = require("../../models/AdminBillingAccount");
const BillingTransaction = require("../../models/BillingTransaction");
const User = require("../../models/User");
const { getBillingAccountByRole } = require("../../utils/specializedBillingUtils");
const { uploadFile, getFile } = require("../../utils/aws");

/**
 * 👨‍🏫 INSTRUCTOR ADMIN FEE PAYMENTS
 */

/**
 * Submit admin fee payment (Instructor)
 */

const submitAdminFeePayment = async (req, res) => {
  try {
    const {
      paymentAmount,
      paymentDate,
      paymentMethod = "bank_transfer",
      description,
      referenceNumber,
      bankTransactionId,
    } = req.body;

    const instructorId = req.user._id;

    // Validate required fields
    if (!paymentAmount || !paymentDate || !description) {
      return res.status(400).json({
        success: false,
        message: "Payment amount, date, and description are required",
      });
    }

    // Check if receipt file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Receipt file is required",
      });
    }

    // Get instructor billing account
    const instructorAccount = await getBillingAccountByRole(
      instructorId,
      "instructor"
    );
    if (!instructorAccount) {
      return res.status(404).json({
        success: false,
        message: "Instructor billing account not found",
      });
    }

    // Upload receipt to S3 using admin-fee-receipts folder
    const receiptUpload = await uploadFile(req.file, "admin-fee-receipts");

    // Create admin fee payment record
    const adminFeePayment = new AdminFeePayment({
      instructorId,
      paymentAmount: parseFloat(paymentAmount),
      paymentDate: new Date(paymentDate),
      paymentMethod,
      description,
      referenceNumber,
      bankTransactionId,
      receiptUrl: receiptUpload.key, // Store S3 key, not full URL
      receiptFileName: req.file.originalname,
      receiptFileSize: req.file.size,
      outstandingFeesBeforePayment: instructorAccount.owedAdminFees || 0,
      priority: paymentAmount > 500 ? "high" : "normal",
    });

    // Calculate fee allocation
    const allocation = adminFeePayment.calculateFeeAllocation(
      instructorAccount.owedAdminFees || 0
    );
    adminFeePayment.allocatedToFees = allocation.allocatedAmount;
    adminFeePayment.excessAmount = allocation.excessAmount;
    adminFeePayment.outstandingFeesAfterPayment = Math.max(
      0,
      (instructorAccount.owedAdminFees || 0) - allocation.allocatedAmount
    );

    await adminFeePayment.save();

    logger.info("✅ Admin fee payment submitted:", {
      paymentId: adminFeePayment._id,
      instructorId,
      amount: paymentAmount,
      allocatedToFees: allocation.allocatedAmount,
      excessAmount: allocation.excessAmount,
    });

    res.status(201).json({
      success: true,
      message: "Admin fee payment submitted successfully",
      data: {
        adminFeePayment,
        allocation: {
          allocatedToFees: allocation.allocatedAmount,
          excessAmount: allocation.excessAmount,
          fullyCoversOutstanding: allocation.fullyCoversOutstanding,
        },
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
          : "Internal server error",
    });
  }
};


module.exports = {
  submitAdminFeePayment
};
