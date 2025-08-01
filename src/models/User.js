// models/User.js
const mongoose = require("mongoose");

const LoginMethodSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["password", "google", "github"],
      default: "password",
    },
    providerId: String,
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
 profileImageURL: String,
    phone: {
      type: String,
    },
    recoveryEmail:{
      type: String,
    },
    password: {
      type: String,
      required: function () {
        return (
          !this.loginMethod?.provider ||
          this.loginMethod.provider === "password"
        );
      },
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
    },

    // // Reference to custom role
    // roleId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Role",
    //   required: true,
    // },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "invited", "suspended"],
      default: "invited",
    },

    loginMethod: LoginMethodSchema,

    resetPasswordOTP: String,
    resetPasswordOTPExpires: Date,
    resendOtpCooldown: Date,

    lastVerificationEmailSentAt: Date,

    lastLoginAt: Date,
    lastIp: String,
    userAgent: String,

    isDeleted: {
      type: Boolean,
      default: false,
    },

    otp:{
      type:String
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
