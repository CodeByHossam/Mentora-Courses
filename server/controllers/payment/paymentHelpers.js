// Shared payment helpers (auto-enrollment, dead-code-compatible finalizers). Split from paymentController.js; function bodies unchanged.

const logger = require('../../utils/logger');
const Course = require("../../models/Course");
const User = require("../../models/User");
const EnrollmentRequest = require("../../models/EnrollmentRequest");
const AdminSettings = require("../../models/AdminSettings");
const { processCoursePurchase } = require("../../utils/specializedBillingUtils");
const { createBillingTransactionForCoursePayment, addCreditsToUser, checkAndUpdateAccountStatus, createCreditPaymentMiddleware } = require("../../utils/billingUtils");

/**
 * Process instructor commission for completed payments
 * This ensures instructor billing accounts are properly credited
 */
const processInstructorCommission = async (payment) => {
  try {
    if (!payment.course || !payment.userId) {
      logger.info(
        "Skipping commission processing - missing course or user data"
      );
      return;
    }

    // Get course details to find instructor
    const course = await Course.findById(payment.course).populate("instructor");
    if (!course || !course.instructor) {
      logger.info(
        "Skipping commission processing - course or instructor not found"
      );
      return;
    }

    // Process the course purchase in billing system
    await processCoursePurchase({
      studentId: payment.userId,
      instructorId: course.instructor._id,
      courseId: course._id,
      paymentId: payment._id,
      finalAmount: payment.finalAmount || payment.amount || 0,
      adminFee: payment.adminFeeFixed || 0,
      adminPercentage: payment.adminPercentage || 10,
      paymentMethod: payment.method || "unknown",
    });

    logger.info(
      `Γ£à Instructor commission processed for payment ${payment._id}`
    );
  } catch (error) {
    logger.error("Error processing instructor commission:", error);
    // Don't throw error to avoid breaking payment flow
  }
};

// PayPal integration removed; direct transfer only. PayPal environment/client no longer initialized.


/**
 * CREATE PAYMENT RECORD
 *
 * Creates a new payment record in the system with proper validation
 * and initial status. This is typically called when initiating a payment.
 *
 * @route   POST /api/payments
 * @access  Admin/Instructor
 * @param   {Object} req.body - Payment details
 * @param   {ObjectId} req.body.userId - Student making payment
 * @param   {ObjectId} req.body.course - Course being purchased
 * @param   {Number} req.body.finalAmount - Final payment amount
 * @param   {String} req.body.method - Payment method (stripe/paypal/direct_transfer)
 * @returns {Object} Created payment record
 */

/**
 * Auto-enroll student after successful payment
 */
const autoEnrollStudent = async (studentId, courseId, paymentId) => {
  try {
    // Check if already enrolled
    const course = await Course.findById(courseId);
    if (course.enrolledStudents.includes(studentId)) {
      return { success: true, message: "Already enrolled" };
    }

    // Add to course
    course.enrolledStudents.push(studentId);
    course.students += 1;
    await course.save();

    // Add to user
    const user = await User.findById(studentId);
    user.enrolledCourses.push(courseId);
    await user.save();

    return { success: true, message: "Auto-enrolled successfully" };
  } catch (error) {
    logger.error("Auto-enrollment error:", error);
    return { success: false, message: "Auto-enrollment failed" };
  }
};

// @desc    Initiate payment for a course
// @route   POST /api/payments/initiate
// @access  Private

/**
 * Finalize enrollment and update user bills idempotently
 */
const finalizeEnrollmentAndBills = async (payment) => {
  // Auto-enroll student in course if this is a course payment
  if (payment.course) {
    const course = await Course.findById(payment.course._id || payment.course);
    if (course && !course.enrolledStudents.includes(payment.userId)) {
      course.enrolledStudents.push(payment.userId); // FIXED: Use userId
      await course.save();
    }

    // Create enrollment request with automatic approval for card/PayPal payments
    const existingEnrollmentRequest = await EnrollmentRequest.findOne({
      student: payment.userId, // FIXED: Use userId from payment
      course: payment.course._id || payment.course,
    });

    if (!existingEnrollmentRequest) {
      await EnrollmentRequest.create({
        student: payment.userId, // FIXED: Use userId from payment
        course: payment.course._id || payment.course,
        status: "approved",
        paymentMethod:
          payment.method === "stripe"
            ? "stripe"
            : payment.method === "paypal"
            ? "paypal"
            : "direct_transfer",
        approvedBy: {
          role: "automatic",
          approvedAt: new Date(),
        },
      });
    } else if (existingEnrollmentRequest.status === "pending") {
      // Update existing pending request to approved with automatic approval
      existingEnrollmentRequest.status = "approved";
      existingEnrollmentRequest.paymentMethod =
        payment.method === "stripe"
          ? "stripe"
          : payment.method === "paypal"
          ? "paypal"
          : "direct_transfer";
      existingEnrollmentRequest.approvedBy = {
        role: "automatic",
        approvedAt: new Date(),
      };
      await existingEnrollmentRequest.save();
    }

    // Create billing transaction for course payment (match direct transaction logic)
    try {
      if (course.instructor) {
        // Get admin settings for profit calculation
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

        const originalAmount =
          payment.finalAmount || payment.originalAmount || payment.amount;
        const finalAmount = originalAmount;
        const adminFee = adminSettings.paymentSettings.studentAdminFee || 2;
        const adminPercentage =
          adminSettings.paymentSettings.globalDeductionPercentage || 10;
        const totalAdminProfit =
          adminFee + (originalAmount * adminPercentage) / 100;
        const instructorAmount = originalAmount - totalAdminProfit;

        await createBillingTransactionForCoursePayment({
          studentId: payment.userId._id || payment.userId,
          courseId: payment.course._id || payment.course,
          instructorId: course.instructor,
          originalAmount: originalAmount,
          finalAmount: finalAmount,
          adminFee: adminFee,
          adminPercentage: adminPercentage,
          instructorAmount: instructorAmount,
          paymentId: payment._id,
          method: payment.method,
        });
        logger.info(
          `Γ£à Billing transaction created for ${payment.method} payment: ${payment._id}`
        );
        logger.info(
          `≡ƒÆ░ Payment breakdown: Total: $${originalAmount}, Admin: $${totalAdminProfit.toFixed(
            2
          )}, Instructor: $${instructorAmount.toFixed(2)}`
        );
      }
    } catch (billingError) {
      logger.error("Γ¥î Error creating billing transaction:", billingError);
      // Don't fail the enrollment if billing fails, but log it
    }

    // Update user's bills: mark existing bill (if any) as paid; avoid duplicates
    const user = await User.findById(payment.userId._id || payment.userId);
    if (user) {
      const existingBill = user.bills.find(
        (b) => b.paymentId && b.paymentId.toString() === payment._id.toString()
      );

      if (existingBill) {
        existingBill.status = "paid";
        existingBill.paidAt = payment.paidAt || new Date();
      } else {
        user.bills.push({
          description: `Course enrollment: ${course?.title || ""}`,
          amount: payment.amount,
          status: "paid",
          paidAt: payment.paidAt || new Date(),
          paymentMethod: payment.method,
          paymentId: payment._id,
          courseId: course._id,
          instructorId: course.instructor,
          billType: "course_payment",
        });
      }
      await user.save();
    }
  } else if (payment.type === "credit_addition") {
    // Handle credit addition payments
    await addCreditsToUser(
      payment.userId,
      payment.amount,
      payment._id,
      payment.method
    );
  }
};

// @desc    Get all payments (Admin)
// @route   GET /api/payments
// @access  Private/Admin

module.exports = {
  autoEnrollStudent,
  processInstructorCommission,
  finalizeEnrollmentAndBills
};
