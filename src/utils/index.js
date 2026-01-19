const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html }) {
  try {
    const result = await resend.emails.send({
      from: 'Norvor <noreply@norvor.com>',
      to: [to],
      subject,
      html,
    });

    console.log('Email sent via Resend:', result);
    return result;
  } catch (err) {
    console.error('Error sending email via Resend:', err);
    throw err;
  }
}

module.exports = { sendEmail };
