const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const Organization = require("../models/Organization");
const { generateVerificationToken } = require("../utils/token");
const { sendVerificationEmail, sendEmail } = require("../utils");
const AppError = require("../routes/AppError");
const crypto = require("crypto");
const getPasswordResetOTPTemplate = require("../utils/emailTemplates");

// const Role = require('../../models/Role');

exports.registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      organizationInviteToken = null,
      loginMethod = { provider: "password" },
    } = req.body;

    if (!email || (!password && loginMethod.provider === "password")) {
      return next(new AppError("Missing required fields.", 400));
    }

    const existingUser = await User.findOne({ email });

    // CASE 1: Email already exists and verified
    if (existingUser && existingUser.isEmailVerified) {
      return next(new AppError("User already exists. Please log in.", 409));
    }

    // CASE 2: Email exists but not verified
    if (existingUser && !existingUser.isEmailVerified) {
      return next(
        new AppError(
          "User already registered but not verified. Please verify email.",
          409
        )
      );
    }

    let hashedPassword = null;
    if (loginMethod.provider === "password") {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newUserData = {
      name,
      email,
      password: hashedPassword,
      loginMethod,
      status: "invited", // Default unless updated by invite logic
      isEmailVerified: false,
    };

    // OPTIONAL: Invite flow for organization
    // if (organizationInviteToken) {
    //   const inviteData = await validateOrgInvite(organizationInviteToken);
    //   if (!inviteData) return next(new AppError("Invalid or expired invite.", 400));
    //   newUserData.organizationId = inviteData.organizationId;
    //   newUserData.roleId = inviteData.roleId;
    //   newUserData.status = "active";
    // }

    const newUser = new User(newUserData);
    await newUser.save();

    const token = generateVerificationToken(newUser._id);

    await sendVerificationEmail(newUser.email, token);

    return res.status(201).json({
      message: "Registration successful. Please verify your email.",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("[Register Error]", error);
    return next(new AppError("Internal server error", 500));
  }
};

exports.verifyEmail = async (req, res, next) => {
  const { token } = req.body;

  if (!token) return next(new AppError("Token is required", 400));

  try {
    const decoded = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return next(new AppError("User not found", 404));
    if (user.isEmailVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    user.isEmailVerified = true;
    user.status = "active";
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("JWT verification error:", err);
    return next(new AppError("Invalid or expired token", 400));
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError("Invalid email or password", 404);
    }

    // Email verification check
    if (!user.isEmailVerified) {
      throw new AppError(
        "Email is not verified. Please verify your email first.",
        403
      );
    }

    // Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    // User status check
    if (user.status !== "active") {
      throw new AppError("User account is inactive. Contact support.", 403);
    }

    // Payload
    const payload = {
      userId: user._id,
      orgId: user.organizationId,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === "production", // use https in prod
      // sameSite: "Strict", // or 'Lax' if cross-site requests allowed
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: {
          id: user.organizationId,
        },
      },
    });
  } catch (err) {
    next(err); // Pass to global error handler
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) throw new AppError("Email is required", 400);

    const user = await User.findOne({ email });
    if (!user) throw new AppError("User with this email does not exist", 404);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before saving
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Store hashed OTP and expiry in user
    user.resetPasswordOTP = hashedOtp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Send OTP via email
    await sendEmail({
      to: email,
      subject: "Password Reset OTP",
      html: getPasswordResetOTPTemplate(otp),
    });

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (err) {
    next(err);
  }
};

exports.verifyPasswordResetOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) throw new AppError("Email and OTP are required", 400);

    const user = await User.findOne({ email });
    if (!user) throw new AppError("User not found", 404);

    // Check OTP validity
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const isOtpValid =
      user.resetPasswordOTP === hashedOtp &&
      user.resetPasswordOTPExpires > Date.now();

    if (!isOtpValid) throw new AppError("Invalid or expired OTP", 400);

    // Mark OTP as verified (or allow password reset now)
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    user.canResetPassword = true; // Optional flag
    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      throw new AppError("Email and new password are required", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and optionally clear any OTP/reset token fields
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    await user.save();

    res.status(200).json({
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (err) {
    next(err); // Pass to centralized error handler
  }
};

exports.logoutUser = async (req, res) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === "production",
      // sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === "production",
      // sameSite: "strict",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
