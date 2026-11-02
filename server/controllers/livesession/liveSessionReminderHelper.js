// Live session reminder emails. Split from liveSessionCoreController.js; bodies unchanged.

const logger = require('../../utils/logger');
const Course = require("../../models/Course");
const User = require("../../models/User");
const sendEmail = require("../../utils/emailSender");

/**
 * Helper function to send session reminder emails
 */

const sendSessionReminder = async (session, reminderType = "upcoming") => {
  try {
    // Get course details and enrolled students
    const course = await Course.findById(session.course).populate(
      "enrolledStudents",
      "email name"
    );
    if (!course) return;

    const instructor = await User.findById(session.instructor);
    if (!instructor) return;

    const sessionDate = new Date(session.scheduledDate);
    const formattedDate = sessionDate.toLocaleDateString();
    const formattedTime = sessionDate.toLocaleTimeString();

    let subject, emailText;

    switch (reminderType) {
      case "upcoming":
        subject = `Upcoming Live Session: ${session.title}`;
        emailText = `
Hello,

This is a reminder that you have a live session scheduled:

Course: ${course.title}
Session: ${session.title}
Date: ${formattedDate}
Time: ${formattedTime}
Duration: ${session.duration} minutes
Instructor: ${instructor.name}

Description:
${session.description}

${
  session.zoomJoinUrl
    ? `Join URL: ${session.zoomJoinUrl}`
    : "Join details will be provided closer to the session time."
}
${session.zoomPassword ? `Meeting Password: ${session.zoomPassword}` : ""}

Please make sure to join on time. The session will start promptly at the scheduled time.

Best regards,
Mentora Team
        `;
        break;

      case "starting":
        subject = `Live Session Starting Now: ${session.title}`;
        emailText = `
Hello,

Your live session is starting now!

Course: ${course.title}
Session: ${session.title}
Instructor: ${instructor.name}

${
  session.zoomJoinUrl
    ? `Join Now: ${session.zoomJoinUrl}`
    : "Please check your course dashboard for join details."
}
${session.zoomPassword ? `Meeting Password: ${session.zoomPassword}` : ""}

Don't miss out - join the session now!

Best regards,
Mentora Team
        `;
        break;

      case "recording_available":
        subject = `Session Recording Available: ${session.title}`;
        emailText = `
Hello,

The recording for your recent live session is now available:

Course: ${course.title}
Session: ${session.title}
Date: ${formattedDate}
Instructor: ${instructor.name}

${
  session.recordingUrl
    ? `Watch Recording: ${session.recordingUrl}`
    : "The recording will be available in your course dashboard shortly."
}
${
  session.recordingPassword
    ? `Recording Password: ${session.recordingPassword}`
    : ""
}

You can access this recording anytime from your course dashboard.

Best regards,
Mentora Team
        `;
        break;
    }

    // Send email to all enrolled students
    const emailPromises = course.enrolledStudents.map((student) =>
      sendEmail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject,
        text: emailText,
      })
    );

    await Promise.all(emailPromises);
  } catch (error) {
    logger.error("Error sending session reminder:", error);
  }
};

module.exports = {
  sendSessionReminder
};
