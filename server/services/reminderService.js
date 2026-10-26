const logger = require('../utils/logger');
/**
 * Reminder Service
 *
 * Handles automated email reminders for live sessions
 */

const cron = require("node-cron");
const LiveSession = require("../models/LiveSession");
const Course = require("../models/Course");
const User = require("../models/User");
const sendEmail = require("../utils/emailSender");

class ReminderService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the reminder service with cron jobs
   */
  start() {
    if (this.isRunning) {
      logger.info("Reminder service is already running");
      return;
    }

    logger.info("🔔 Starting Live Session Reminder Service...");

    // Check for sessions starting in 24 hours (daily at 9 AM)
    cron.schedule("0 9 * * *", async () => {
      await this.send24HourReminders();
    });

    // Check for sessions starting in 1 hour (every hour)
    cron.schedule("0 * * * *", async () => {
      await this.send1HourReminders();
    });

    // Check for sessions starting in 15 minutes (every 15 minutes)
    cron.schedule("*/15 * * * *", async () => {
      await this.send15MinuteReminders();
    });

    // Check for sessions that just started (every 5 minutes)
    cron.schedule("*/5 * * * *", async () => {
      await this.sendStartingNowReminders();
    });

    // Clean up old reminder flags (daily at midnight)
    cron.schedule("0 0 * * *", async () => {
      await this.cleanupOldReminders();
    });

    this.isRunning = true;
    logger.info("✅ Live Session Reminder Service started successfully");
  }

  /**
   * Stop the reminder service
   */
  stop() {
    if (!this.isRunning) {
      logger.info("Reminder service is not running");
      return;
    }

    // Note: node-cron doesn't provide a direct way to stop all tasks
    // In a production environment, you might want to keep track of task references
    this.isRunning = false;
    logger.info("🛑 Live Session Reminder Service stopped");
  }

  /**
   * Send 24-hour advance reminders
   */
  async send24HourReminders() {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000); // 1 hour window

      const sessions = await LiveSession.find({
        scheduledDate: {
          $gte: tomorrow,
          $lt: tomorrowEnd,
        },
        status: "scheduled",
        reminderSent: { $ne: true },
      })
        .populate("course", "title enrolledStudents")
        .populate("instructor", "name email");

      logger.info(`📅 Found ${sessions.length} sessions for 24-hour reminders`);

      for (const session of sessions) {
        await this.sendSessionReminder(session, "24hour");
      }
    } catch (error) {
      logger.error("Error sending 24-hour reminders:", error);
    }
  }

  /**
   * Send 1-hour advance reminders
   */
  async send1HourReminders() {
    try {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const oneHourWindow = new Date(oneHourLater.getTime() + 10 * 60 * 1000); // 10 minute window

      const sessions = await LiveSession.find({
        scheduledDate: {
          $gte: oneHourLater,
          $lt: oneHourWindow,
        },
        status: "scheduled",
      })
        .populate("course", "title enrolledStudents")
        .populate("instructor", "name email");

      logger.info(`⏰ Found ${sessions.length} sessions for 1-hour reminders`);

      for (const session of sessions) {
        await this.sendSessionReminder(session, "1hour");
      }
    } catch (error) {
      logger.error("Error sending 1-hour reminders:", error);
    }
  }

  /**
   * Send 15-minute advance reminders
   */
  async send15MinuteReminders() {
    try {
      const now = new Date();
      const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);
      const reminderWindow = new Date(
        fifteenMinutesLater.getTime() + 5 * 60 * 1000
      ); // 5 minute window

      const sessions = await LiveSession.find({
        scheduledDate: {
          $gte: fifteenMinutesLater,
          $lt: reminderWindow,
        },
        status: "scheduled",
      })
        .populate("course", "title enrolledStudents")
        .populate("instructor", "name email");

      logger.info(
        `🚨 Found ${sessions.length} sessions for 15-minute reminders`
      );

      for (const session of sessions) {
        await this.sendSessionReminder(session, "15minute");
      }
    } catch (error) {
      logger.error("Error sending 15-minute reminders:", error);
    }
  }

  /**
   * Send "starting now" reminders
   */
  async sendStartingNowReminders() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const sessions = await LiveSession.find({
        scheduledDate: {
          $gte: fiveMinutesAgo,
          $lte: now,
        },
        status: "scheduled",
      })
        .populate("course", "title enrolledStudents")
        .populate("instructor", "name email");

      logger.info(`🔴 Found ${sessions.length} sessions starting now`);

      for (const session of sessions) {
        await this.sendSessionReminder(session, "starting");
      }
    } catch (error) {
      logger.error("Error sending starting now reminders:", error);
    }
  }

  /**
   * Send session reminder emails
   */
  async sendSessionReminder(session, reminderType) {
    try {
      if (!session.course || !session.course.enrolledStudents) {
        logger.info(
          `Skipping reminder for session ${session.title} - no enrolled students`
        );
        return;
      }

      // Get enrolled students' details
      const students = await User.find({
        _id: { $in: session.course.enrolledStudents },
      }).select("email name");

      if (students.length === 0) {
        logger.info(`No students found for session ${session.title}`);
        return;
      }

      const sessionDate = new Date(session.scheduledDate);
      const formattedDate = sessionDate.toLocaleDateString();
      const formattedTime = sessionDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      let subject, emailText;

      switch (reminderType) {
        case "24hour":
          subject = `📅 Live Session Tomorrow: ${session.title}`;
          emailText = `
Hello,

This is a reminder that you have a live session scheduled for tomorrow:

Course: ${session.course.title}
Session: ${session.title}
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${session.duration} minutes
Instructor: ${session.instructor.name}

Description:
${session.description}

Make sure to mark your calendar and prepare any materials you might need.

${
  session.zoomJoinUrl
    ? `Join URL: ${session.zoomJoinUrl}`
    : "Join details will be provided closer to the session time."
}
${session.zoomPassword ? `Meeting Password: ${session.zoomPassword}` : ""}

See you tomorrow!

Best regards,
Mentora Team
          `;
          break;

        case "1hour":
          subject = `⏰ Live Session in 1 Hour: ${session.title}`;
          emailText = `
Hello,

Your live session starts in 1 hour:

Course: ${session.course.title}
Session: ${session.title}
Time: ${formattedTime}
Duration: ${session.duration} minutes
Instructor: ${session.instructor.name}

${
  session.zoomJoinUrl
    ? `Join URL: ${session.zoomJoinUrl}`
    : "Join details will be available shortly."
}
${session.zoomPassword ? `Meeting Password: ${session.zoomPassword}` : ""}

Please ensure you have a stable internet connection and test your audio/video beforehand.

Best regards,
Mentora Team
          `;
          break;

        case "15minute":
          subject = `🚨 Live Session Starting Soon: ${session.title}`;
          emailText = `
Hello,

Your live session is starting in 15 minutes!

Course: ${session.course.title}
Session: ${session.title}
Instructor: ${session.instructor.name}

${
  session.zoomJoinUrl
    ? `Join Now: ${session.zoomJoinUrl}`
    : "Please check your course dashboard for join details."
}
${session.zoomPassword ? `Meeting Password: ${session.zoomPassword}` : ""}

Get ready to join - the session will begin shortly!

Best regards,
Mentora Team
          `;
          break;

        case "starting":
          subject = `🔴 Live Session Starting NOW: ${session.title}`;
          emailText = `
Hello,

Your live session is starting right now!

Course: ${session.course.title}
Session: ${session.title}
Instructor: ${session.instructor.name}

${
  session.zoomJoinUrl
    ? `Join Immediately: ${session.zoomJoinUrl}`
    : "Please check your course dashboard to join."
}
${session.zoomPassword ? `Meeting Password: ${session.zoomPassword}` : ""}

Don't miss out - join the session now!

Best regards,
Mentora Team
          `;
          break;
      }

      // Send emails to all enrolled students AND instructor
      const emailPromises = [];
      
      // Send to students
      students.forEach((student) => {
        emailPromises.push(
          sendEmail({
            from: process.env.EMAIL_USER,
            to: student.email,
            subject,
            text: emailText,
          }).catch((error) => {
            logger.error(`Failed to send reminder to ${student.email}:`, error);
          })
        );
      });
      
      // Send to instructor with customized message
      if (session.instructor && session.instructor.email) {
        const instructorSubject = subject.replace('Live Session', 'Your Live Session');
        const instructorEmailText = emailText.replace(
          'This is a reminder that you have a live session',
          'This is a reminder that you are teaching a live session'
        ).replace(
          'Your live session',
          'Your teaching session'
        ).replace(
          'See you tomorrow!',
          `You have ${students.length} student(s) enrolled. See you tomorrow!`
        ).replace(
          'Get ready to join',
          `Get ready to host the session for ${students.length} student(s)`
        ).replace(
          'Don\'t miss out - join the session now!',
          `Your session is starting! ${students.length} student(s) are waiting.`
        );
        
        emailPromises.push(
          sendEmail({
            from: process.env.EMAIL_USER,
            to: session.instructor.email,
            subject: instructorSubject,
            text: instructorEmailText,
          }).catch((error) => {
            logger.error(`Failed to send reminder to instructor ${session.instructor.email}:`, error);
          })
        );
      }

      await Promise.allSettled(emailPromises);

      // Update reminder flag for 24-hour reminders
      if (reminderType === "24hour") {
        session.reminderSent = true;
        session.reminderSentAt = new Date();
        await session.save();
      }

      logger.info(
        `✅ Sent ${reminderType} reminder for session: ${session.title} to ${students.length} students and instructor ${session.instructor.name}`
      );
    } catch (error) {
      logger.error(
        `Error sending ${reminderType} reminder for session ${session.title}:`,
        error
      );
    }
  }

  /**
   * Clean up old reminder flags
   */
  async cleanupOldReminders() {
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      const result = await LiveSession.updateMany(
        {
          scheduledDate: { $lt: threeDaysAgo },
          reminderSent: true,
        },
        {
          $unset: { reminderSent: 1, reminderSentAt: 1 },
        }
      );

      logger.info(
        `🧹 Cleaned up reminder flags for ${result.modifiedCount} old sessions`
      );
    } catch (error) {
      logger.error("Error cleaning up old reminders:", error);
    }
  }
}

// Create and export singleton instance
const reminderService = new ReminderService();

module.exports = reminderService;
