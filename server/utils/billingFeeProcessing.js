const logger = require('./logger');
const InstructorBillingAccount = require("../models/InstructorBillingAccount");
const StudentBillingAccount = require("../models/StudentBillingAccount");
const User = require("../models/User");
const AdminSettings = require("../models/AdminSettings");

/**
 * Process annual fees for all users
 * Runs daily to check if annual fees are due
 */
const processAnnualFees = async () => {
  try {
    logger.info("💰 Starting annual fee processing...");

    // Get admin settings for fee amounts
    const adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      logger.info("⚠️ No admin settings found, skipping annual fee processing");
      return [];
    }

    const studentAnnualFee =
      adminSettings.paymentSettings?.studentAnnualFee || 10;
    const instructorAnnualFee =
      adminSettings.paymentSettings?.instructorAnnualFee || 10;

    const results = [];
    const currentYear = new Date().getFullYear();
    const currentDate = new Date();

    // Process student annual fees
    const students = await User.find({ role: "student", isActive: true });
    for (const student of students) {
      try {
        const studentAccount = await StudentBillingAccount.findOne({
          studentId: student._id,
        });
        if (!studentAccount) continue;

        // Check if annual fee is due (account created more than a year ago)
        const accountAge = Math.floor(
          (currentDate - studentAccount.createdAt) /
            (365.25 * 24 * 60 * 60 * 1000)
        );

        if (accountAge >= 1) {
          // Check if annual fee for current year has been processed
          const hasCurrentYearFee = studentAccount.creditTransactions.some(
            (t) => t.description.includes(`Annual fee for ${currentYear}`)
          );

          if (!hasCurrentYearFee) {
            studentAccount.addAnnualFee(studentAnnualFee, currentYear);
            await studentAccount.save();

            results.push({
              userId: student._id,
              userType: "student",
              feeAmount: studentAnnualFee,
              year: currentYear,
            });

            logger.info(
              `💳 Added annual fee of $${studentAnnualFee} for student ${student.email}`
            );
          }
        }
      } catch (error) {
        logger.error(
          `❌ Error processing annual fee for student ${student.email}:`,
          error.message
        );
      }
    }

    // Process instructor annual fees
    const instructors = await User.find({ role: "instructor", isActive: true });
    for (const instructor of instructors) {
      try {
        const instructorAccount = await InstructorBillingAccount.findOne({
          instructorId: instructor._id,
        });
        if (!instructorAccount) continue;

        // Check if annual fee is due (account created more than a year ago)
        const accountAge = Math.floor(
          (currentDate - instructorAccount.createdAt) /
            (365.25 * 24 * 60 * 60 * 1000)
        );

        if (accountAge >= 1) {
          // Check if annual fee for current year has been processed
          const hasCurrentYearFee = instructorAccount.courseSales.some(
            (sale) =>
              sale.description &&
              sale.description.includes(`Annual fee for ${currentYear}`)
          );

          if (!hasCurrentYearFee) {
            // Add annual fee as owed amount
            instructorAccount.owedAdminFees =
              (instructorAccount.owedAdminFees || 0) + instructorAnnualFee;
            await instructorAccount.save();

            results.push({
              userId: instructor._id,
              userType: "instructor",
              feeAmount: instructorAnnualFee,
              year: currentYear,
            });

            logger.info(
              `💳 Added annual fee of $${instructorAnnualFee} for instructor ${instructor.email}`
            );
          }
        }
      } catch (error) {
        logger.error(
          `❌ Error processing annual fee for instructor ${instructor.email}:`,
          error.message
        );
      }
    }

    logger.info(
      `✅ Annual fee processing completed. Processed ${results.length} users.`
    );
    return results;
  } catch (error) {
    logger.error("❌ Error in processAnnualFees:", error);
    throw error;
  }
};

module.exports = {
  processAnnualFees
};
