const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { generateVerificationToken } = require("../utils/token");
const { sendEmail } = require("../utils");
const AppError = require("../utils/AppError");
const {
  emailVerificationTemplate
} = require("../utils/emailTemplates");
const {createCognitoUser,loginWithMFA,verifyMFACode,revokeRefreshToken} = require("../utils/cognito")

exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Missing required fields.", 400));
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isEmailVerified) {
      return next(new AppError("User already exists.", 409));
    }

    if (existingUser && !existingUser.isEmailVerified) {
      return next(
        new AppError(
          "User already registered but not verified. Please verify email.",
          409
        )
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      status: "invited",
      tempPlainPassword: password
    });

    await newUser.save();

    const token = generateVerificationToken(newUser._id);
    const link = `${process.env.CONFIRM_EMAIL_URL}?token=${token}`;

    await sendEmail({
      to: newUser.email,
      subject: "Norvor Account Verification",
      html: emailVerificationTemplate(link)
    });

    return res.status(201).json({
      message: "Registration successful. Please verify your email.",
      userId: newUser._id
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
    const user = await User.findById(decoded.userId).select('+tempPlainPassword');

    if (!user) return next(new AppError("User not found", 404));
    if (user.isEmailVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }
    if (!user.tempPlainPassword) {
      return next(new AppError("Missing temporary password for Cognito", 500));
    }

    const cognitoSub = await createCognitoUser(user.email, user.tempPlainPassword);

    user.cognitoSub = cognitoSub;
    user.isEmailVerified = true;
    user.status = "active";
    user.tempPlainPassword = undefined;
    await user.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verification error:", err);
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
        if (!user) throw new AppError("Invalid email or password", 404);
        if (!user.isEmailVerified) {
        throw new AppError("Email not verified. Please verify first.", 403);
        }

        if (user.status !== "active") {
        throw new AppError("Account inactive. Contact support.", 403);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new AppError("Invalid email or password", 401);

        const cognitoResponse = await loginWithMFA(email, password);
        if (cognitoResponse.requiresMFA) {
        if (cognitoResponse.challenge === 'CUSTOM_CHALLENGE') {
            return res.status(200).json({
            message: "MFA required. Please check your email for verification code.",
            requiresMFA: true,
            challenge: cognitoResponse.challenge,
            session: cognitoResponse.session
            });
        }
        
        return res.status(200).json({
        message: "MFA required",
        requiresMFA: true,
        challenge: cognitoResponse.challenge,
        session: cognitoResponse.session
        });
    }

        const payload = {
        userId: user._id,
        orgId: user.organizationId,
        role: user.role
        };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
        });

        const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: "7d",
        });


    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.verifyMFALogin = async (req, res, next) => {
  try {
    const { session, code, challengeName, email } = req.body;

    if (!session || !code || !challengeName || !email) {
      throw new AppError("All MFA verification fields are required", 400);
    }

    const cognitoTokens = await verifyMFACode(email, session, code, challengeName);

    const user = await User.findOneAndUpdate(
      { email },
      { lastLoginAt: new Date() },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const payload = {
      userId: user._id,
      orgId: user.organizationId,
      role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m"
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "7d"
    });

    // Set HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict'
    });

    return res.status(200).json({
      message: "MFA verification successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      idToken: cognitoTokens.IdToken,
      refreshToken: cognitoTokens.RefreshToken
    });

  } catch (err) {
    console.error("MFA verification error:", err);
    
    if (err.name === 'NotAuthorizedException') {
      return next(new AppError("Invalid verification code", 401));
    }
    if (err.name === 'ExpiredCodeException') {
      return next(new AppError("Verification code has expired", 401));
    }
    if (err.name === 'InvalidParameterException') {
      return next(new AppError("Invalid MFA parameters", 400));
    }
    
    next(err);
  }
};


exports.logoutUser = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({ message: "No refresh token provided" });
    }

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
  } catch (err) {
    console.error("Logout failed:", err);
    return res.status(500).json({ message: "Failed to logout" });
  }
};