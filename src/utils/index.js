// const AWS = require('./aws');
// const ses = new AWS.SES({ apiVersion: '2010-12-01' });

// async function sendEmail({ to, subject, html }) {
//   const params = {
//     Source: 'Norvor <noreply@norvor.com>',
//     Destination: {
//       ToAddresses: [to],
//     },
//     Message: {
//       Subject: {
//         Data: subject,
//       },
//       Body: {
//         Html: {
//           Data: html,
//         },
//       },
//     },
//   };

//   try {
//     const result = await ses.sendEmail(params).promise();
//     console.log('Email sent:', result);
//     return result;
//   } catch (err) {
//     console.error('Error sending email:', err);
//     throw err;
//   }
// }

// module.exports = { sendEmail };

const resend = require('./resend');

async function sendEmail({ to, subject, html }) {
  try {
    const result = await resend.emails.send({
      from: 'Norvor <noreply@norvor.com>', // must be verified in Resend
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    console.log('Email sent:', result);
    return result;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
}

module.exports = { sendEmail };
