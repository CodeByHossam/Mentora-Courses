const logger = require('./logger');
const cron = require("node-cron");
const { processAnnualFees } = require("./billingUtils");

/**
 * Initialize all cron jobs for the billing system
 */
const initializeBillingCronJobs = () => {
  // Run annual fee processing daily at 2 AM
  cron.schedule(
    "0 2 * * *",
    async () => {
      logger.info("Running daily annual fee processing...");
      try {
        const results = await processAnnualFees();
        logger.info(
          `Annual fee processing completed. Processed ${results.length} users.`
        );
      } catch (error) {
        logger.error("Error in annual fee processing cron job:", error);
      }
    },
    {
      scheduled: true,
      timezone: "UTC",
    }
  );

  // Run account status check every 6 hours
  cron.schedule(
    "0 */6 * * *",
    async () => {
      logger.info("Running account status check...");
      try {
        const User = require("../models/User");
        const { checkAndUpdateAccountStatus } = require("./billingUtils");

        // Get all active users
        const users = await User.find({ isActive: true });
        let updatedCount = 0;

        for (const user of users) {
          try {
            const oldStatus = user.billingInfo?.accountStatus;
            const userKey =
              user.role === "admin"
                ? "adminId"
                : user.role === "instructor"
                ? "instructorId"
                : "studentId";
            const newStatus = await checkAndUpdateAccountStatus(
              user._id,
              userKey
            );
            if (oldStatus !== newStatus) {
              updatedCount++;
            }
          } catch (error) {
            logger.error(
              `Error checking account status for user ${user._id}:`,
              error
            );
          }
        }

        logger.info(
          `Account status check completed. Updated ${updatedCount} accounts.`
        );
      } catch (error) {
        logger.error("Error in account status check cron job:", error);
      }
    },
    {
      scheduled: true,
      timezone: "UTC",
    }
  );

  logger.info("Billing cron jobs initialized successfully");
};

module.exports = {
  initializeBillingCronJobs,
};
