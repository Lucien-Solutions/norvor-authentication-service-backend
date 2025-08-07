exports.getPasswordResetOTPTemplate = otp => {
  const year = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Password Reset OTP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #6a0dad;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
            text-align: center;
          }
          .content h2 {
            color: #333;
            font-size: 20px;
            margin-bottom: 10px;
          }
          .otp-box {
            display: inline-block;
            margin: 20px auto;
            padding: 15px 30px;
            background-color: #f0e5ff;
            color: #6a0dad;
            font-size: 24px;
            font-weight: bold;
            border-radius: 6px;
            letter-spacing: 5px;
          }
          .footer {
            background-color: #fafafa;
            color: #888;
            font-size: 12px;
            text-align: center;
            padding: 15px 10px;
          }
          .note {
            margin-top: 20px;
            font-size: 14px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Norvor</h1>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            <div class="otp-box">${otp}</div>
            <p class="note">This OTP is valid for the next 10 minutes. Do not share it with anyone.</p>
          </div>
          <div class="footer">
            &copy; ${year} Norvor. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
};

exports.getVerifyOTPTemplate = otp => {
  const year = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Verify OTP Request</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: #6a0dad;
            color: #ffffff;
            padding: 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            padding: 30px 20px;
            text-align: center;
          }
          .content h2 {
            color: #333;
            font-size: 20px;
            margin-bottom: 10px;
          }
          .otp-box {
            display: inline-block;
            margin: 20px auto;
            padding: 15px 30px;
            background-color: #f0e5ff;
            color: #6a0dad;
            font-size: 24px;
            font-weight: bold;
            border-radius: 6px;
            letter-spacing: 5px;
          }
          .footer {
            background-color: #fafafa;
            color: #888;
            font-size: 12px;
            text-align: center;
            padding: 15px 10px;
          }
          .note {
            margin-top: 20px;
            font-size: 14px;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Norvor</h1>
          </div>
          <div class="content">
            <h2>Verify OTP Request</h2>
            <p>We received a request to verify your password. Use the OTP below to proceed:</p>
            <div class="otp-box">${otp}</div>
            <p class="note">This OTP is valid for the next 10 minutes. Do not share it with anyone.</p>
          </div>
          <div class="footer">
            &copy; ${year} Norvor. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
};

exports.emailVerificationTemplate = link => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Email Verification</title>
    <style>
      body {
        margin: 0;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background-color: #f9f9f9;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background: #fff;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 0 20px rgba(0,0,0,0.05);
      }
      .header {
        background-color: #6a0dad;
        padding: 20px;
        text-align: center;
        color: white;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .content {
        padding: 30px 20px;
        text-align: center;
      }
      .content p {
        font-size: 16px;
        margin-bottom: 30px;
      }
      .btn {
        display: inline-block;
        padding: 12px 25px;
        background-color: #6a0dad;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        transition: background 0.3s ease;
      }
      .btn:hover {
        background-color: #5800a3;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #999;
        padding: 15px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to Norvor!</h1>
      </div>
      <div class="content">
        <p>Please click the button below to verify your email address.</p>
        <a href=${link} class="btn">Verify Email</a>
        <p style="margin-top: 20px;">If the button doesn’t work, copy and paste the following link into your browser:</p>
        <p><a href=${link}>${link}</a></p>
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} Norvor. All rights reserved.
      </div>
    </div>
  </body>
  </html>
  `;
};
