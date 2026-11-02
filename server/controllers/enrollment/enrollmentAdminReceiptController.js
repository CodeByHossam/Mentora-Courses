const logger = require('../../utils/logger');
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const asyncHandler = require("express-async-handler");

/**
 * Generate fresh signed URL for bank transfer receipt
 * @desc    Generate a fresh signed URL for viewing bank transfer proof
 * @route   GET /api/enrollment-requests/:id/receipt
 * @access  Private/Admin/Instructor
 */

const getReceiptUrl = asyncHandler(async (req, res) => {
  const request = await EnrollmentRequest.findById(req.params.id).populate(
    "course",
    "instructor"
  );

  if (!request) {
    res.status(404);
    throw new Error("Enrollment request not found");
  }

  // Authorization check: Instructors can only access receipts for their own course requests
  if (req.user.role === "instructor") {
    if (
      !request.course.instructor ||
      request.course.instructor.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error(
        "You can only access receipts for enrollment requests for your own courses"
      );
    }
  }

  // Check if request has bank transfer proof
  if (!request.bankTransferProof || !request.bankTransferProof.s3Key) {
    res.status(404);
    throw new Error("No bank transfer receipt found for this request");
  }

  try {
    const { getFile } = require("../../utils/aws");

    // Generate fresh signed URL with 1 hour expiry
    const signedUrl = await getFile(request.bankTransferProof.s3Key, 3600);

    res.status(200).json({
      success: true,
      message: "Receipt URL generated successfully",
      data: {
        url: signedUrl,
        fileName: request.bankTransferProof.fileName,
        expiresIn: 3600, // 1 hour
      },
    });
  } catch (error) {
    logger.error("Failed to generate signed URL for receipt:", error);
    res.status(500);
    throw new Error("Failed to generate receipt URL");
  }
});


module.exports = {
  getReceiptUrl
};
