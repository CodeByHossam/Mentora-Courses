const nodemailer = require("nodemailer");

// Prefer explicit SMTP configuration; fallback to Gmail service if provided
const buildTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "0", 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (host && port && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for 587/STARTTLS
      auth: { user, pass },
      tls: {
        // Allow self-signed in dev if explicitly set
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === "false" ? false : true,
      },
    });
  }

  // Fallback: Gmail service (requires app password)
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const transporter = buildTransport();

/**
 * Send email (text and/or HTML)
 * @param {Object} options { to, subject, text, html, from }
 */
const sendEmail = async ({ to, subject, text, html, from }) => {
  const sender = from || process.env.EMAIL_FROM || process.env.EMAIL_USER;
  if (!to) throw new Error("Email 'to' address is required");

  try {
    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      text,
      html,
      replyTo: sender,
    });
    return info;
  } catch (error) {
    console.error("Error sending email:", error?.response || error);
    throw error;
  }
};

module.exports = sendEmail;
