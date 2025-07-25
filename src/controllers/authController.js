const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { generateVerificationToken } = require("../utils/token");
const { sendEmail } = require("../utils");
const AppError = require("../utils/AppError");
const crypto = require("crypto");
const { uploadImage,s3 } = require("../utils/s3Upload");
const {
  getPasswordResetOTPTemplate,
  emailVerificationTemplate,
} = require("../utils/emailTemplates");

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

    if (existingUser && existingUser.isEmailVerified) {
      return next(new AppError("User already exists. Please log in.", 409));
    }

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

    const link = `${process.env.CONFIRM_EMAIL_URL}?token=${token}`;

    await sendEmail({
      to: newUser.email,
      subject: "Norvor Account Verification",
      html: emailVerificationTemplate(link),
    });

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

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError("Invalid email or password", 404);
    }

    if (!user.isEmailVerified) {
      throw new AppError(
        "Email is not verified. Please verify your email first.",
        403
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.status !== "active") {
      throw new AppError("User account is inactive. Contact support.", 403);
    }

    const payload = {
      userId: user._id,
      orgId: user.organizationId,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    user.lastLoginAt = new Date();
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === "production",
      // sameSite: "Strict",
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
    next(err);
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) throw new AppError("Email is required", 400);

    const user = await User.findOne({ email });
    if (!user) throw new AppError("User with this email does not exist", 404);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetPasswordOTP = hashedOtp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

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

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const isOtpValid =
      user.resetPasswordOTP === hashedOtp &&
      user.resetPasswordOTPExpires > Date.now();

    if (!isOtpValid) throw new AppError("Invalid or expired OTP", 400);

    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    const resetToken = jwt.sign(
      { email },
      process.env.JWT_RESET_SECRET,
      { expiresIn: "10m" }
    );

    res.status(200).json({ message: "OTP verified", resetToken });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      throw new AppError("Reset token and new password are required", 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_RESET_SECRET);
    } catch (err) {
      throw new AppError("Invalid or expired reset token", 401);
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) throw new AppError("User not found", 404);

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (err) {
    next(err);
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

exports.resendOTP = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError("Email is required", 400));

  const user = await User.findOne({ email });
  if (!user) return next(new AppError("User not found", 404));

  const now = new Date();
  if (user.resendOtpCooldown && now - user.resendOtpCooldown < 60000) {
    const secondsLeft = Math.ceil(
      (60000 - (now - user.resendOtpCooldown)) / 1000
    );
    return next(
      new AppError(
        `Please wait ${secondsLeft}s before requesting a new OTP.`,
        429
      )
    );
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  user.emailVerificationOTP = otp;
  user.resetPasswordOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // valid for 10 mins
  user.resendOtpCooldown = now;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Verify Your Email - OTP",
    html: getPasswordResetOTPTemplate(otp),
  });

  res.status(200).json({
    success: true,
    message: "OTP resent successfully",
  });
};

exports.resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError("Email is required", 400));
    }

    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.isEmailVerified) {
      return next(new AppError("Email is already verified", 400));
    }

    const now = new Date();
    const lastSent = user.lastVerificationEmailSentAt;

    if (lastSent && now - lastSent < 60 * 1000) {
      const waitTime = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
      return next(
        new AppError(
          `Please wait ${waitTime} seconds before requesting again`,
          429
        )
      );
    }

    const token = generateVerificationToken(user._id);

    const link = `${process.env.CONFIRM_EMAIL_URL}?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Norvor Account Verification",
      html: emailVerificationTemplate(link),
    });

    user.lastVerificationEmailSentAt = new Date();

    await user.save();

    res.status(200).json({ message: "Verification email sent successfully" });
  } catch (err) {
    next(err);
  }
};

exports.refreshAuthToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token missing" });
    }

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err) {
          return res
            .status(403)
            .json({ message: "Invalid or expired refresh token" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const newAccessToken = jwt.sign(
          { userId: user._id, email: user.email },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );

        // Re-issue refresh token for rotation strategy
        // const newRefreshToken = jwt.sign(
        //   { userId: user._id },
        //   process.env.REFRESH_TOKEN_SECRET,
        //   { expiresIn: "7d" }
        // );
        // res.cookie("refreshToken", newRefreshToken, {
        //   httpOnly: true,
        //   secure: process.env.NODE_ENV === "production",
        //   sameSite: "Strict",
        //   maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        // });

        // Set new access token in cookie
        // res.cookie("accessToken", newAccessToken, {
        //   httpOnly: true,
        //   secure: process.env.NODE_ENV === "production",
        //   sameSite: "Strict",
        //   maxAge: 15 * 60 * 1000, // 15 mins
        // });

        res
          .status(200)
          .json({ message: "Token refreshed", accessToken: newAccessToken });
      }
    );
  } catch (err) {
    next(err);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-password"); // exclude password

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

exports.getUserByEmail = async (req, res, next) => {
  const { email } = req.params;

  if (!email) {
    return next(new AppError("Email is required", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(200).json({ user: null }); // For cross-service use
  }

  return res.status(200).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

exports.updateUserProfile = async (req, res, next) => {
  try {
    const _id= req.user._id

    const updated = await User.findOneAndUpdate(
      { _id },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return next(new AppError("User profile not found.", 404));
    }

     res.status(200).json({
    success: true,
    message: "User profile updated successfully.",updated
  });
  } catch (err) {
    next(err);
  }
};


exports.uploadProfilePicture = async (req, res, next) => {
  try {
    const _id = req.user._id;
    if (!req.file) {
        return next(new AppError("No file uploaded.", 400));
    }

    const imageUrl = await uploadImage(req.file.buffer, _id, req.file.originalname);

    const profile = await User.findOneAndUpdate(
      { _id },
      { profileImageURL: imageUrl },
      { new: true, upsert: true }
    );

      res.status(200).json({
    success: true,
    message: "Profile image uploaded successfully.",profile
  });
  } catch (err) {
    next(err);
  }
};


exports.downloadImage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    if (!userId) {
    return next(new AppError("User ID is required.", 400));
    }

    const extensions = [".jpg", ".jpeg", ".png", ".webp"];
    let foundKey = null;

    for (const ext of extensions) {
      const key = `user/profilepics/${userId}${ext}`;
      try {
        await s3.headObject({ Bucket: "norvorcrm", Key: key }).promise();
        foundKey = key;
        break;
      } catch (_) {}
    }

    if (!foundKey) {
      return next(new AppError("Image not found.", 404));
    }

    const stream = s3.getObject({ Bucket: "norvorcrm", Key: foundKey }).createReadStream();
    res.setHeader("Content-Type", "image/jpeg");
    stream.pipe(res);
  } catch (err) {
    console.error("Error downloading image:", err);
    res.status(500).json({
    success: true,
    message: "Failed to download image.",profile
  });
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError("User not found.", 404));
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new AppError("Current password is incorrect.", 400));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

exports.updateRecoveryEmail = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { recoveryEmail } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { recoveryEmail } },
      { new: true }
    ).select("-password");

    if (!user) {
      return next(new AppError("User not found.", 404));
    }

    return res.status(200).json({
      success: true,
      message: "Recovery email updated successfully.",
      user,
    });
  } catch (err) {
    next(err);
  }
};
