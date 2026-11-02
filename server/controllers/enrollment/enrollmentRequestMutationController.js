// Enrollment request update and deletion. Split from enrollmentRequestCrudController.js; bodies unchanged.

const logger = require('../../utils/logger');
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const Course = require("../../models/Course");
const User = require("../../models/User");
const {
  createBillingTransactionForCoursePayment,
} = require("../../utils/billingUtils");
const asyncHandler = require("express-async-handler");

const updateEnrollmentRequest = asyncHandler(async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!status) {
      res.status(400);
      throw new Error("Status can not be empty");
    }

    const request = await EnrollmentRequest.findById(req.params.id)
      .populate("student", "name email")
      .populate("course", "title description price duration level instructor");

    if (!request) {
      res.status(404);
      throw new Error("Enrollment request not found");
    }

    // Authorization check: Instructors can only update requests for their own courses
    if (req.user.role === "instructor") {
      if (
        !request.course.instructor ||
        request.course.instructor.toString() !== req.user._id.toString()
      ) {
        res.status(403);
        throw new Error(
          "You can only update enrollment requests for your own courses"
        );
      }
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      res.status(400);
      throw new Error("Unaccepted request status");
    }

    request.status = status;

    // Set approvedBy information when status is approved
    if (status === "approved") {
      request.approvedBy = {
        user: req.user._id,
        role: req.user.role,
        approvedAt: new Date(),
      };
      //add student to the grade list
      const student = await User.findById(req.user._id);
      const course = await Course.findById(request.course._id);
      if (!student || !course) {
        res.status(404);
        throw new Error("User or course not found");
      }
    }

    // If adminNote is provided, add it to adminNotes array instead of legacy field
    if (adminNote && adminNote.trim()) {
      request.addAdminNote(adminNote.trim(), req.user.id);
    }

    // Save request first to avoid parallel save issues
    await request.save();

    if (status === "approved") {
      // Create payment record if this is a direct transfer request
      if (
        request.paymentMethod === "direct_transfer" &&
        request.transferredAmount
      ) {
        const Payment = require("../../models/Payment");

        // Create payment record
        const payment = await Payment.create({
          userId: request.student._id, // FIXED: Use userId instead of student
          course: request.course._id,
          enrollmentRequest: request._id,
          amount: request.transferredAmount,
          finalAmount: request.transferredAmount, // FIXED: Use finalAmount as required by model
          originalAmount: request.transferredAmount,
          instructorAmount: request.transferredAmount, // Will be calculated based on admin settings later
          method: "direct_transfer",
          status: "paid",
          paidAt: new Date(),
          admin: req.user._id,
          receiptUrl: request.bankTransferProof?.url,
          receiptS3Key: request.bankTransferProof?.s3Key,
          transferDetails: {
            bankName: request.transferDetails?.bankName,
            accountNumber: null, // Not stored for security
            transferAmount: request.transferredAmount,
            transferDate: request.transferDetails?.transferDate,
            referenceNumber: request.transferDetails?.referenceNumber,
          },
        });

        // Create billing transaction for instructor commission tracking
        try {
          const course = await Course.findById(request.course._id);
          if (course && course.instructor) {
            // Get admin settings for profit calculation
            const AdminSettings = require("../../models/AdminSettings");
            let adminSettings = await AdminSettings.findOne();
            if (!adminSettings) {
              // Create default settings if none exist
              adminSettings = await AdminSettings.create({
                paymentSettings: {
                  globalDeductionPercentage: 10, // 10% default
                  studentAdminFee: 2, // $2 default admin fee
                },
              });
            }

            const originalAmount = request.transferredAmount;
            const finalAmount = request.transferredAmount;
            const adminFee = adminSettings.paymentSettings.studentAdminFee || 2;
            const adminPercentage =
              adminSettings.paymentSettings.globalDeductionPercentage || 10;
            const totalAdminProfit =
              adminFee + (originalAmount * adminPercentage) / 100;
            const instructorAmount = originalAmount - totalAdminProfit;

            await createBillingTransactionForCoursePayment({
              studentId: request.student._id,
              courseId: request.course._id,
              instructorId: course.instructor,
              originalAmount: originalAmount,
              finalAmount: finalAmount,
              adminFee: adminFee,
              adminPercentage: adminPercentage,
              instructorAmount: instructorAmount,
              paymentId: payment._id,
              method: "direct_transfer",
            });
            logger.info(
              `✅ Billing transaction created for course payment: ${payment._id}`
            );
            logger.info(
              `💰 Payment breakdown: Total: $${originalAmount}, Admin: $${totalAdminProfit.toFixed(
                2
              )}, Instructor: $${instructorAmount.toFixed(2)}`
            );
          }
        } catch (billingError) {
          logger.error("❌ Error creating billing transaction:", billingError);
          // Don't fail the enrollment approval if billing fails, but log it
        }
      }

      // update the status of this request in related model

      // 1- update the course by adding the student to the enrolledStudents array
      const course = await Course.findById(request.course._id);
      if (!course) {
        res.status(404);
        throw new Error("Course not found");
      }

      // Check if student is already enrolled to prevent duplicates
      if (!course.enrolledStudents.includes(request.student._id)) {
        course.enrolledStudents.push(request.student._id);
        course.students += 1;
        await course.save();
      }

      // 2- update the user by adding the course to the enrolledCourses array
      const user = await User.findById(request.student._id);
      if (!user) {
        res.status(404);
        throw new Error("User not found");
      }

      // Check if course is already in user's enrolled courses to prevent duplicates
      if (!user.enrolledCourses.includes(request.course._id)) {
        user.enrolledCourses.push(request.course._id);
        await user.save();
      }
    }

    // Return updated request with populated adminNotes
    const updatedRequest = await EnrollmentRequest.findByIdWithNotes(
      request._id
    );

    res.status(200).json({
      success: true,
      message: `Enrollment request ${status} successfully`,
      data: updatedRequest,
    });
  } catch (error) {
    logger.error("Error updating enrollment request:", error);
    res.status(500);
    throw new Error(`Failed to update enrollment request: ${error.message}`);
  }
});

// @desc    Get user's enrollment requests
// @route   GET /api/enrollment-requests/user
// @access  Private

const deleteEnrollmentRequest = asyncHandler(async (req, res) => {
  const request = await EnrollmentRequest.findByIdAndDelete(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error("Enrollment request not found");
  }

  res.status(200).json({
    success: true,
    message: "Enrollment request deleted successfully",
    data: null,
  });
});

module.exports = {
  updateEnrollmentRequest,
  deleteEnrollmentRequest
};
