const Joi = require("joi");

exports.registerValidator = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().required(),
  password: Joi.when("loginMethod.provider", {
    is: "password",
    then: Joi.string()
      .min(8)
      .pattern(
        new RegExp(
          "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={};':\"|,.<>/?]).+$"
        )
      )
      .message(
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
      )
      .required(),
    otherwise: Joi.optional(),
  }),
  organizationInviteToken: Joi.string().optional().allow(null, ""),
  loginMethod: Joi.object({
    provider: Joi.string()
      .valid("password", "google", "facebook", "apple")
      .default("password"),
  }).default({ provider: "password" }),
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
  resetToken: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});



exports.updateUserProfileValidator = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]{6,20}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone number must be a valid format",
    }),
  profileImageURL: Joi.string().uri().optional(),
  organizationId: Joi.string().hex().length(24).optional(), // assuming MongoDB ObjectId
  status: Joi.string()
    .valid("active", "inactive", "invited", "suspended")
    .optional(),
});