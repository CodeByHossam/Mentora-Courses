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

const createStudentRefund = async (req, res) => {
  try {
    const { courseId, paymentId, reason, description, requestedAmount } =
      req.body;
    const studentId = req.user._id;

    // Validate course and payment
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment || payment.userId.toString() !== studentId.toString()) {
      return res.status(404).json({
        success: false,
        message: "Payment not found or unauthorized",
      });
    }

    // Check if refund already exists for this payment
    const existingRefund = await RefundRequest.findOne({
      requesterId: studentId,
      relatedPayment: paymentId,
      status: { $in: ["pending", "under_review", "approved"] },
    });

    if (existingRefund) {
      return res.status(400).json({
        success: false,
        message: "A refund request already exists for this payment",
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
      requesterId: studentId,
      requesterType: "student",
      refundType: "course_purchase",
      requestedAmount: requestedAmount || payment.finalAmount,
      originalAmount: payment.finalAmount,
      relatedCourse: courseId,
      relatedPayment: paymentId,
      reason,
      description,
      supportingDocuments,
      priority: requestedAmount > 100 ? "high" : "normal",
    });

    await refundRequest.save();

    // Populate for response
    await refundRequest.populate([
      { path: "relatedCourse", select: "title" },
      { path: "relatedPayment", select: "finalAmount paymentMethod" },
    ]);

    logger.info("✅ Student refund request created:", {
      refundId: refundRequest._id,
      studentId,
      courseId,
      amount: refundRequest.requestedAmount,
    });

    res.status(201).json({
      success: true,
      message: "Refund request submitted successfully",
      data: { refundRequest },
    });
  } catch (error) {
    logger.error("❌ Error creating student refund request:", error);
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
 * Get student refund requests
 */

const getStudentRefunds = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { requesterId: studentId, requesterType: "student" };
    if (status) query.status = status;

    const refunds = await RefundRequest.find(query)
      .populate("relatedCourse", "title")
      .populate("relatedPayment", "finalAmount paymentMethod")
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
    logger.error("❌ Error fetching student refunds:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch refund requests",
    });
  }
};

/**
 * 👨‍🏫 INSTRUCTOR REFUND REQUESTS
 */

/**
 * Create instructor admin fee refund request
 */

module.exports = {
  createStudentRefund,
  getStudentRefunds
};
