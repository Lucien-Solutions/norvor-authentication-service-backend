const Joi = require('joi');

exports.registerValidator = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().required(),
  password: Joi.when('loginMethod.provider', {
    is: 'password',
    then: Joi.string()
      .min(8)
      .pattern(
        new RegExp(
          '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={};\':"|,.<>/?]).+$'
        )
      )
      .message(
        'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character'
      )
      .required(),
    otherwise: Joi.optional(),
  }),
  organizationInviteToken: Joi.string().optional().allow(null, ''),
  loginMethod: Joi.object({
    provider: Joi.string()
      .valid('password', 'google', 'facebook', 'apple')
      .default('password'),
  }).default({ provider: 'password' }),
});

exports.loginValidator = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

exports.verifyEmailValidator = Joi.object({
  token: Joi.string().required(),
});

exports.requestPasswordResetValidator = Joi.object({
  email: Joi.string().email().required(),
});

exports.resendOtpValidator = Joi.object({
  email: Joi.string().email().required(),
});

exports.requestEmailVerficationValidator = Joi.object({
  email: Joi.string().email().required(),
});

exports.verifyResetOTPValidator = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(), // 6 digit numeric OTP
});

exports.resetPasswordValidator = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().min(6).required(),
});
