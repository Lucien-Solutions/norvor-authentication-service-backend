const express = require("express");
const router = express.Router();

const {
  loginUser,
  logoutUser,
  getMe,
  registerUser,
  verifyEmail,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
} = require("../controllers/authController");
const validateRequest = require("../validators/validateRequest");
const {
  registerValidator,
  verifyEmailValidator,
  loginValidator,
  requestPasswordResetValidator,
  verifyResetOTPValidator,
  resetPasswordValidator,
} = require("../validators/authValidators");

// const validateRequest = require("../middlewares/validateRequest");
// const authMiddleware = require("../middlewares/authMiddleware");

// @route   POST /api/auth/register
router.post("/register", validateRequest(registerValidator), registerUser);

// @route   POST /api/auth/register
router.post(
  "/verify-email",
  validateRequest(verifyEmailValidator),
  verifyEmail
);

// // @route   POST /api/auth/login
router.post("/login", validateRequest(loginValidator), loginUser);

// @route   POST /api/auth/request-password-reset
router.post(
  "/request-password-reset",
  validateRequest(requestPasswordResetValidator),
  requestPasswordReset
);

// @route   POST /api/auth/verify-password-reset-otp
router.post(
  "/verify-password-reset-otp",
  validateRequest(verifyResetOTPValidator),
  verifyPasswordResetOTP
);

// @route   POST /api/auth/reset-password
router.post(
  "/reset-password",
  validateRequest(resetPasswordValidator),
  resetPassword
);

// // @route   POST /api/auth/logout
// router.post("/logout", authMiddleware, logoutUser);

// @route   GET /api/auth/me
// router.get("/user", getUser);

module.exports = router;
