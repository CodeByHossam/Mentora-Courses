const sendEmail = require("../utils/emailSender");

/*
@desc:Sending a contact form 
@route: POST /api/email
@access: Public
@Method:POST
*/

const sendContactForm = async (req, res) => {
  const { email:from, subject, message:text } = req.body;

  if (!from || !subject || !text) {
    return res
      .status(400)
      .json({ error: "Missing required fields: to, subject, text" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(from)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  try {
    await sendEmail({ from, subject, text });
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ error:error.message || "Failed to send email" });
  }
};

//send reset password link
const sendResetPasswordLink = async (req, res) => {
  // Implement the logic to send the reset password link
}
//send course enrollment request
//send course enrollment confirmation
//send user account activation link
module.exports = {
  sendContactForm,
};
