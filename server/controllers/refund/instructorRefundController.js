const logger = require('../../utils/logger');
// controllers/refundController.js
/**
 * Refund Request Controller
 *
 * Handles refund requests from students and instructors
 * - Student course refunds
 * - Instructor admin fee overpayment refunds
 * - Admin approval/rejection workflow
 * - Complete transaction synchronization
 */

const RefundRequest = require("../../models/RefundRequest");
const StudentBillingAccount = require("../../models/StudentBillingAccount");
const InstructorBillingAccount = require("../../models/InstructorBillingAccount");
const AdminBillingAccount = require("../../models/AdminBillingAccount");
const BillingTransaction = require("../../models/BillingTransaction");
const Payment = require("../../models/Payment");
const Course = require("../../models/Course");
const User = require("../../models/User");
const GiftCard = require("../../models/GiftCard");
const Notification = require("../../models/Notification");
const { getBillingAccountByRole } = require("../../utils/specializedBillingUtils");
const { uploadFile } = require("../../utils/aws");

/**
 * 🎓 STUDENT REFUND REQUESTS
 */

/**
 * Create student course refund request
 */

const createInstructorRefund = async (req, res) => {
  try {
    const {
      reason,
      description,
      requestedAmount,
      refundType = "admin_fee_overpayment",
    } = req.body;
    const instructorId = req.user._id;

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

    // Basic validation for refund amount
    if (requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Refund amount must be greater than zero",
      });
    }

    // Handle supporting document uploads
    const supportingDocuments = [];
    if (req.files && req.files.length > 0) {
      logger.info(`📎 Processing ${req.files.length} supporting documents...`);

      for (const file of req.files) {
        try {
          const uploadResult = await uploadFile(file, "refund-requests");
          supportingDocuments.push({
            filename: uploadResult.key.split("/").pop(),
            originalName: file.originalname,
            s3Key: uploadResult.key,
            url: uploadResult.url,
            fileType: file.mimetype,
            fileSize: file.size,
          });
          logger.info(`✅ Uploaded: ${file.originalname}`);
        } catch (uploadError) {
          logger.error(
            `❌ Failed to upload ${file.originalname}:`,
            uploadError
          );
          // Continue with other files, don't fail the entire request
        }
      }
    }

    // Create refund request
    const refundRequest = new RefundRequest({
      requesterId: instructorId,
      requesterType: "instructor",
      refundType,
      requestedAmount,
      originalAmount: instructorAccount.annualFees || 0, // Use annual fees as reference
      reason,
      description,
      supportingDocuments,
      priority: requestedAmount > 200 ? "high" : "normal",
    });

    await refundRequest.save();

    logger.info("✅ Instructor refund request created:", {
      refundId: refundRequest._id,
      instructorId,
      amount: refundRequest.requestedAmount,
      type: refundType,
    });

    res.status(201).json({
      success: true,
      message: "Refund request submitted successfully",
      data: { refundRequest },
    });
  } catch (error) {
    logger.error("❌ Error creating instructor refund request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create refund request",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

/**
 * Get instructor refund requests
 */

const getInstructorRefunds = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { requesterId: instructorId, requesterType: "instructor" };
    if (status) query.status = status;

    const refunds = await RefundRequest.find(query)
      .populate("reviewedBy", "name email")
      .sort({ requestDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RefundRequest.countDocuments(query);

    res.json({
      success: true,
      data: {
        refunds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("❌ Error fetching instructor refunds:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch refund requests",
    });
  }
};

/**
 * 👨‍💼 ADMIN REFUND MANAGEMENT
 */

/**
 * Get all pending refund requests (Admin)
 */

module.exports = {
  createInstructorRefund,
  getInstructorRefunds
};
