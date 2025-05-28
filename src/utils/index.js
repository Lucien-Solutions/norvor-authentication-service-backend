const { Resend } = require("resend");
const { emailVerificationTemplate } = require("./emailTemplates");

const resend = new Resend(process.env.RESEND_KEY);
const VERIFICATION_BASE_URL = "auth.norvor.com";

const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      // from: "Norvor <noreply@norvor.com>",
      from: "Norvor <noreply@cutememories.in>",
      to,
      subject,
      html,
    });

    return data;
  } catch (error) {
    console.error("[Resend Email Error]", error);
    throw new Error("Failed to send email");
  }
};

module.exports = { sendEmail };
