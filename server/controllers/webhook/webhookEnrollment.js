// Post-payment auto-enrollment and bill updates. Split from webhookHelpers.js; bodies unchanged.

const logger = require('../../utils/logger');
const User = require("../../models/User");
const {
  createBillingTransactionForCoursePayment,
} = require("../../utils/billingUtils");

/**
 * Handle automatic enrollment after successful payment
 */

const handleAutoEnrollment = async (payment) => {
  logger.info("🎓 handleAutoEnrollment called for payment:", payment._id);

  try {
    // Check if auto-enrollment is enabled (this should be fetched from admin settings)
    const autoEnrollEnabled = true; // TODO: Get from AdminSettings
    logger.info("⚙️ Auto-enrollment enabled:", autoEnrollEnabled);

    if (!autoEnrollEnabled) {
      logger.info("⚠️ Auto-enrollment disabled, skipping");
      return;
    }

    const course = payment.course;
    const student = payment.userId;

    logger.info("📚 Course:", course ? course.title : "NOT FOUND");
    logger.info("👤 Student:", student ? student.name : "NOT FOUND");

    if (!course || !student) {
      logger.error("❌ Missing course or student data for enrollment");
      return;
    }

    // Check if student is already enrolled
    const alreadyEnrolled = course.enrolledStudents.includes(student._id);
    logger.info("🔍 Student already enrolled:", alreadyEnrolled);

    if (alreadyEnrolled) {
      logger.info("⚠️ Student already enrolled, skipping enrollment");
      return;
    }

    logger.info("➕ Adding student to course enrolled students");
    // Add student to course
    course.enrolledStudents.push(student._id);
    await course.save();
    logger.info("✅ Student added to course successfully");

    // Add course to student's enrolled courses
    const courseAlreadyInStudent = student.enrolledCourses.includes(course._id);
    logger.info(
      "🔍 Course already in student enrolled courses:",
      courseAlreadyInStudent
    );

    if (!courseAlreadyInStudent) {
      logger.info("➕ Adding course to student enrolled courses");
      student.enrolledCourses.push(course._id);
      await student.save();
      logger.info("✅ Course added to student successfully");
    }

    // Create billing transaction for instructor commission tracking
    logger.info("💰 Starting billing transaction creation");
    try {
      const paymentAmount = payment.finalAmount || payment.amount;
      logger.info("💵 Payment amount:", paymentAmount);
      logger.info("👨‍🏫 Course instructor:", course.instructor);

      if (course.instructor && paymentAmount) {
        logger.info("📊 Getting admin settings for fee calculation");
        // Get admin settings for fee calculation (match direct transaction logic)
        const AdminSettings = require("../../models/AdminSettings");
        let adminSettings = await AdminSettings.findOne();
        if (!adminSettings) {
          logger.info("⚙️ Creating default admin settings");
          // Create default settings if none exist
          adminSettings = await AdminSettings.create({
            paymentSettings: {
              globalDeductionPercentage: 10, // 10% default
              studentAdminFee: 2, // $2 default admin fee
            },
          });
        }

        const originalAmount = paymentAmount;
        const finalAmount = paymentAmount;
        const adminFee = adminSettings.paymentSettings.studentAdminFee || 2;
        const adminPercentage =
          adminSettings.paymentSettings.globalDeductionPercentage || 10;
        const totalAdminProfit =
          adminFee + (originalAmount * adminPercentage) / 100;
        const instructorAmount = originalAmount - totalAdminProfit;

        logger.info("🧮 Billing calculation:", {
          originalAmount,
          adminFee,
          adminPercentage,
          totalAdminProfit: totalAdminProfit.toFixed(2),
          instructorAmount: instructorAmount.toFixed(2),
        });

        logger.info("🔄 Calling createBillingTransactionForCoursePayment");
        await createBillingTransactionForCoursePayment({
          studentId: student._id,
          courseId: course._id,
          instructorId: course.instructor,
          originalAmount: originalAmount,
          finalAmount: finalAmount,
          adminFee: adminFee,
          adminPercentage: adminPercentage,
          instructorAmount: instructorAmount,
          paymentId: payment._id,
          method: "stripe",
        });
        logger.info(
          `✅ Billing transaction created for Stripe webhook payment: ${payment._id}`
        );
        logger.info(
          `💰 Payment breakdown: Total: $${originalAmount}, Admin: $${totalAdminProfit.toFixed(
            2
          )}, Instructor: $${instructorAmount.toFixed(2)}`
        );
      } else {
        logger.info(
          "⚠️ Skipping billing transaction - missing instructor or payment amount"
        );
      }
    } catch (billingError) {
      logger.error(
        "❌ Error creating billing transaction in webhook:",
        billingError
      );
      logger.error("❌ Billing error stack:", billingError.stack);
      // Don't fail the enrollment if billing fails
    }
  } catch (error) {
    logger.error("Error in auto-enrollment:", error);
    // Don't throw error - payment was successful, enrollment can be handled manually
  }
};

/**
 * Update user bills after successful payment
 */

const updateUserBills = async (payment) => {
  try {
    const user = await User.findById(payment.userId._id);
    if (!user) {
      logger.error("User not found:", payment.userId._id);
      return;
    }

    // Find and update the corresponding bill
    const billIndex = user.bills.findIndex(
      (bill) =>
        bill.paymentId && bill.paymentId.toString() === payment._id.toString()
    );

    if (billIndex !== -1) {
      user.bills[billIndex].status = "paid";
      user.bills[billIndex].paidAt = payment.paidAt;
      await user.save();
    }
  } catch (error) {
    logger.error("Error updating user bills:", error);
    // Don't throw error - payment was successful
  }
};

module.exports = {
  handleAutoEnrollment,
  updateUserBills
};
