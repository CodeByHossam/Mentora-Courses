// PayPal webhook completion and failure handling. Split from webhookHelpers.js; bodies unchanged.

const logger = require('../../utils/logger');
const Payment = require("../../models/Payment");
const Course = require("../../models/Course");
const User = require("../../models/User");
const {
  createBillingTransactionForCoursePayment,
} = require("../../utils/billingUtils");

// @desc    Handle PayPal webhooks
// @route   POST /api/webhooks/paypal
// @access  Public (but verified via signature)

const handlePayPalPaymentCompleted = async (webhookEvent) => {
  logger.info("🎯 handlePayPalPaymentCompleted called");
  logger.info(
    "📊 Webhook event resource:",
    JSON.stringify(webhookEvent.resource, null, 2)
  );

  try {
    const resource = webhookEvent.resource;
    const customId = resource.custom_id;

    logger.info("🔍 Custom ID from PayPal webhook:", customId);

    if (!customId) {
      logger.error("❌ No custom_id found in PayPal webhook");
      return;
    }

    // Find payment by ID
    logger.info("🔍 Searching for payment with ID:", customId);
    const payment = await Payment.findById(customId)
      .populate("userId", "name email enrolledCourses")
      .populate("course", "title instructor enrolledStudents");

    logger.info(
      "💾 Payment found:",
      payment ? `ID: ${payment._id}, Status: ${payment.status}` : "NOT FOUND"
    );

    if (!payment) {
      logger.error("❌ Payment not found for PayPal webhook:", customId);
      return;
    }

    // Check if already processed
    if (payment.status === "paid") {
      logger.info(
        "⚠️ PayPal payment already processed, skipping:",
        payment._id
      );
      return;
    }

    logger.info("💰 Updating PayPal payment status to paid");
    // Update payment status
    payment.status = "paid";
    payment.paidAt = new Date();
    payment.paypalPaymentId = resource.id;
    payment.paymentGatewayResponse = resource;

    logger.info("💾 Saving PayPal payment to database");
    await payment.save();
    logger.info("✅ PayPal payment saved successfully");

    // Auto-enroll student in course
    logger.info("🎓 Starting PayPal auto-enrollment process");
    const course = await Course.findById(payment.course._id);
    logger.info("📚 Course found:", course ? course.title : "NOT FOUND");
    logger.info(
      "👤 Student:",
      payment.userId ? payment.userId.name : "NOT FOUND"
    );

    if (course && !course.enrolledStudents.includes(payment.userId._id)) {
      logger.info("➕ Adding student to course enrolled students");
      course.enrolledStudents.push(payment.userId._id);
      await course.save();
      logger.info("✅ Student enrolled in course successfully");

      // Add course to student's enrolled courses
      const student = payment.userId;
      if (student && !student.enrolledCourses.includes(course._id)) {
        logger.info("➕ Adding course to student enrolled courses");
        student.enrolledCourses.push(course._id);
        await student.save();
        logger.info("✅ Course added to student successfully");
      }

      // Create billing transaction for instructor commission tracking
      logger.info("💰 Starting PayPal billing transaction creation");
      try {
        const paymentAmount = payment.finalAmount || payment.amount;
        logger.info("💵 PayPal payment amount:", paymentAmount);
        logger.info("👨‍🏫 Course instructor:", course.instructor);

        if (course.instructor && paymentAmount) {
          logger.info("📊 Getting admin settings for PayPal fee calculation");
          // Get admin settings for fee calculation (match direct transaction logic)
          const AdminSettings = require("../../models/AdminSettings");
          let adminSettings = await AdminSettings.findOne();
          if (!adminSettings) {
            logger.info("⚙️ Creating default admin settings for PayPal");
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

          logger.info("🧮 PayPal billing calculation:", {
            originalAmount,
            adminFee,
            adminPercentage,
            totalAdminProfit: totalAdminProfit.toFixed(2),
            instructorAmount: instructorAmount.toFixed(2),
          });

          logger.info(
            "🔄 Calling createBillingTransactionForCoursePayment for PayPal"
          );
          await createBillingTransactionForCoursePayment({
            studentId: payment.userId._id,
            courseId: payment.course._id,
            instructorId: course.instructor,
            originalAmount: originalAmount,
            finalAmount: finalAmount,
            adminFee: adminFee,
            adminPercentage: adminPercentage,
            instructorAmount: instructorAmount,
            paymentId: payment._id,
            method: "paypal",
          });
          logger.info(
            `✅ Billing transaction created for PayPal payment: ${payment._id}`
          );
          logger.info(
            `💰 PayPal payment breakdown: Total: $${originalAmount}, Admin: $${totalAdminProfit.toFixed(
              2
            )}, Instructor: $${instructorAmount.toFixed(2)}`
          );
        } else {
          logger.info(
            "⚠️ Skipping PayPal billing transaction - missing instructor or payment amount"
          );
        }
      } catch (billingError) {
        logger.error(
          "❌ Error creating billing transaction for PayPal payment:",
          billingError
        );
        logger.error("❌ PayPal billing error stack:", billingError.stack);
        // Don't fail the enrollment if billing fails
      }
    } else {
      logger.info("⚠️ Student already enrolled in course or course not found");
    }

    // Update user's bills
    const user = await User.findById(payment.userId._id);
    if (user) {
      user.bills.push({
        description: `Course enrollment: ${payment.course.title}`,
        amount: payment.amount,
        status: "paid",
        paidAt: new Date(),
        paymentMethod: "paypal",
        paymentId: payment._id,
      });
      await user.save();
    }
  } catch (error) {
    logger.error("Error handling PayPal payment completion:", error);
  }
};

// Helper function to handle PayPal payment failure

const handlePayPalPaymentFailed = async (webhookEvent) => {
  try {
    const resource = webhookEvent.resource;
    const customId = resource.custom_id;

    if (!customId) {
      logger.error("No custom_id found in PayPal webhook");
      return;
    }

    // Find payment by ID
    const payment = await Payment.findById(customId);

    if (!payment) {
      logger.error("Payment not found for PayPal webhook:", customId);
      return;
    }

    // Update payment status
    payment.status = "failed";
    payment.failureReason = `PayPal payment denied: ${
      resource.reason_code || "Unknown reason"
    }`;
    await payment.save();
  } catch (error) {
    logger.error("Error handling PayPal payment failure:", error);
  }
};

module.exports = {
  handlePayPalPaymentCompleted,
  handlePayPalPaymentFailed
};
