const logger = require('./logger');
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Simple unified notification utility
 * Just pass a message and recipient, and it creates a notification
 */

/**
 * Create a simple notification
 * @param {Object} options - Notification options
 * @param {String} options.recipientId - User ID who should receive the notification
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {String} options.type - Notification type (optional, defaults to 'system')
 * @param {String} options.senderId - User ID who triggered the notification (optional)
 * @param {String} options.actionUrl - URL to navigate when clicked (optional)
 * @param {String} options.priority - Priority level (optional, defaults to 'normal')
 */
const createNotification = async (options) => {
  try {
    const {
      recipientId,
      title,
      message,
      type = "system",
      senderId = null,
      actionUrl = null,
      priority = "normal",
    } = options;

    // Validate required fields
    if (!recipientId || !title || !message) {
      logger.error(
        "❌ Notification creation failed: Missing required fields (recipientId, title, message)"
      );
      return null;
    }

    // Create the notification
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      actionUrl,
      priority,
      isRead: false,
    });

    logger.info(`✅ Notification created: "${title}" for user ${recipientId}`);
    return notification;
  } catch (error) {
    logger.error("❌ Error creating notification:", error);
    return null;
  }
};

/**
 * Create notification for enrollment request
 * @param {String} studentId - Student who made the request
 * @param {String} instructorId - Instructor who should be notified
 * @param {String} courseName - Name of the course
 * @param {String} studentName - Name of the student
 */
const notifyEnrollmentRequest = async (
  studentId,
  instructorId,
  courseName,
  studentName
) => {
  return await createNotification({
    recipientId: instructorId,
    senderId: studentId,
    title: "New Enrollment Request",
    message: `${studentName} has requested to enroll in your course "${courseName}"`,
    type: "course_enrollment",
    actionUrl: "/instructor/payments",
    priority: "normal",
  });
};

/**
 * Create notification for payment received
 * @param {String} studentId - Student who made the payment
 * @param {String} instructorId - Instructor who should be notified
 * @param {String} courseName - Name of the course
 * @param {String} studentName - Name of the student
 * @param {Number} amount - Payment amount
 * @param {String} method - Payment method
 */
const notifyPaymentReceived = async (
  studentId,
  instructorId,
  courseName,
  studentName,
  amount,
  method
) => {
  return await createNotification({
    recipientId: instructorId,
    senderId: studentId,
    title: "New Payment Received",
    message: `${studentName} has submitted a ${method} payment of $${amount} for "${courseName}"`,
    type: "payment",
    actionUrl: "/instructor/payments",
    priority: "high",
  });
};

/**
 * Create notification for enrollment approved
 * @param {String} instructorId - Instructor who approved
 * @param {String} studentId - Student who should be notified
 * @param {String} courseName - Name of the course
 * @param {String} instructorName - Name of the instructor
 */
const notifyEnrollmentApproved = async (
  instructorId,
  studentId,
  courseName,
  instructorName
) => {
  return await createNotification({
    recipientId: studentId,
    senderId: instructorId,
    title: "Enrollment Approved",
    message: `Your enrollment request for "${courseName}" has been approved by ${instructorName}`,
    type: "course_enrollment",
    actionUrl: "/student/courses",
    priority: "high",
  });
};

/**
 * Create notification for enrollment rejected
 * @param {String} instructorId - Instructor who rejected
 * @param {String} studentId - Student who should be notified
 * @param {String} courseName - Name of the course
 * @param {String} instructorName - Name of the instructor
 * @param {String} reason - Rejection reason (optional)
 */
const notifyEnrollmentRejected = async (
  instructorId,
  studentId,
  courseName,
  instructorName,
  reason = ""
) => {
  const reasonText = reason ? ` Reason: ${reason}` : "";
  return await createNotification({
    recipientId: studentId,
    senderId: instructorId,
    title: "Enrollment Request Rejected",
    message: `Your enrollment request for "${courseName}" has been rejected by ${instructorName}.${reasonText}`,
    type: "course_enrollment",
    actionUrl: "/courses",
    priority: "normal",
  });
};

/**
 * Create notification for payment approved
 * @param {String} instructorId - Instructor who approved
 * @param {String} studentId - Student who should be notified
 * @param {String} courseName - Name of the course
 * @param {Number} amount - Payment amount
 */
const notifyPaymentApproved = async (
  instructorId,
  studentId,
  courseName,
  amount
) => {
  return await createNotification({
    recipientId: studentId,
    senderId: instructorId,
    title: "Payment Approved",
    message: `Your payment of $${amount} for "${courseName}" has been approved. You are now enrolled!`,
    type: "payment",
    actionUrl: "/student/courses",
    priority: "high",
  });
};

/**
 * Create notification for new message
 * @param {String} senderId - User who sent the message
 * @param {String} recipientId - User who should receive notification
 * @param {String} senderName - Name of sender
 * @param {String} subject - Message subject
 */
const notifyNewMessage = async (senderId, recipientId, senderName, subject) => {
  return await createNotification({
    recipientId,
    senderId,
    title: `New message from ${senderName}`,
    message: `${senderName} sent you a message: "${subject}"`,
    type: "message",
    actionUrl: "/messages",
    priority: "normal",
  });
};

module.exports = {
  createNotification,
  notifyEnrollmentRequest,
  notifyPaymentReceived,
  notifyEnrollmentApproved,
  notifyEnrollmentRejected,
  notifyPaymentApproved,
  notifyNewMessage,
};
