// Enrollment request creation. Split from enrollmentRequestCrudController.js; bodies unchanged.

const logger = require('../../utils/logger');
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const Course = require("../../models/Course");
const { notifyEnrollmentRequest } = require("../../utils/notificationUtils");
const asyncHandler = require("express-async-handler");

// @desc    Create enrollment request
// @route   POST /api/enrollment-requests
// @access  Private

const createEnrollmentRequest = asyncHandler(async (req, res) => {
  const {
    courseId,
    paymentMethod,
    transferredAmount,
    bankName,
    referenceNumber,
    transferDate,
  } = req.body;

  if (!courseId) {
    res.status(400);
    throw new Error("Course ID is required");
  }

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }

  // Check if user already has a pending request
  const existingRequest = await EnrollmentRequest.findOne({
    student: req.user._id,
    course: courseId,
    status: "pending",
  });

  if (existingRequest) {
    res.status(400);
    throw new Error("You already have a pending request for this course");
  }

  // Check if user is already enrolled
  if (course.enrolledStudents.includes(req.user._id)) {
    res.status(400);
    throw new Error("You are already enrolled in this course");
  }

  // Only allow enrollment requests for direct transfer payments
  if (paymentMethod !== "direct_transfer") {
    res.status(400);
    throw new Error(
      "Enrollment requests are only allowed for direct transfer payments. Please use the payment page for other payment methods."
    );
  }

  // Validate direct transfer data
  if (!transferredAmount || !bankName || !referenceNumber || !transferDate) {
    res.status(400);
    throw new Error(
      "Bank transfer details are required for direct transfer payment"
    );
  }

  if (!req.file) {
    res.status(400);
    throw new Error("Bank transfer proof document is required");
  }

  try {
    // Prepare enrollment request data
    const requestData = {
      student: req.user._id,
      course: courseId,
      paymentMethod: paymentMethod || "none",
    };

    // Add bank transfer data if provided
    if (paymentMethod === "direct_transfer") {
      requestData.transferredAmount = parseFloat(transferredAmount);
      requestData.transferDetails = {
        bankName,
        referenceNumber,
        transferDate: new Date(transferDate),
      };

      // Handle file upload to S3 if needed
      if (req.file) {
        // Use your AWS utility for S3 upload
        try {
          const { uploadFile, getFile } = require("../../utils/aws");

          // Upload to direct-transfer-receipts folder
          const uploadResult = await uploadFile(
            req.file,
            "direct-transfer-receipts"
          );

          // Generate signed URL for immediate access
          const signedUrl = await getFile(uploadResult.key, 3600); // 1 hour expiry

          requestData.bankTransferProof = {
            url: signedUrl,
            s3Key: uploadResult.key,
            fileName: req.file.originalname,
            uploadedAt: new Date(),
          };
        } catch (s3Error) {
          logger.error("S3 upload error:", s3Error);
          throw new Error(`File upload failed: ${s3Error.message}`);
        }
      }
    }

    const request = await EnrollmentRequest.create(requestData);

    // 🔗 UPDATE RELATIONSHIPS - Add enrollment request to course
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { enrollmentRequests: request._id },
    });

    const populatedRequest = await EnrollmentRequest.findById(request._id)
      .populate("student", "name email")
      .populate("course", "title description price duration level instructor");

    // 📧 SIMPLE NOTIFICATION: Notify instructor about new enrollment request
    if (
      populatedRequest.course &&
      populatedRequest.course.instructor &&
      populatedRequest.student
    ) {
      await notifyEnrollmentRequest(
        populatedRequest.student._id,
        populatedRequest.course.instructor,
        populatedRequest.course.title,
        populatedRequest.student.name
      );
    }

    res.status(201).json({
      success: true,
      message: "Enrollment request submitted successfully",
      data: populatedRequest,
    });
  } catch (error) {
    logger.error("Error creating enrollment request:", error);
    logger.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
    });
    res.status(400);
    throw new Error(`Failed to create enrollment request: ${error.message}`);
  }
});

// @desc    Get all enrollment requests
// @route   GET /api/enrollment-requests
// @access  Private/Admin

module.exports = {
  createEnrollmentRequest
};
