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
  testEmail,
  resendVerificationEmail,
  resendOTP,
} = require("../controllers/authController");
const validateRequest = require("../validators/validateRequest");
const {
  registerValidator,
  verifyEmailValidator,
  loginValidator,
  requestPasswordResetValidator,
  verifyResetOTPValidator,
  resetPasswordValidator,
  requestEmailVerficationValidator,
  resendOtpValidator,
} = require("../validators/authValidators");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication-related endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post("/register", validateRequest(registerValidator), registerUser);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify user email with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/verify-email",
  validateRequest(verifyEmailValidator),
  verifyEmail
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and return tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Missing fields or invalid credentials
 */
router.post("/login", validateRequest(loginValidator), loginUser);

/**
 * @swagger
 * /auth/request-password-reset:
 *   post:
 *     summary: Request password reset via email OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       400:
 *         description: Invalid email or user not found
 */
router.post(
  "/request-password-reset",
  validateRequest(requestPasswordResetValidator),
  requestPasswordReset
);

/**
 * @swagger
 * /auth/verify-password-reset-otp:
 *   post:
 *     summary: Verify OTP for password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: Invalid or expired OTP
 */
router.post(
  "/verify-password-reset-otp",
  validateRequest(verifyResetOTPValidator),
  verifyPasswordResetOTP
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password after OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/reset-password",
  validateRequest(resetPasswordValidator),
  resetPassword
);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Request password reset via email OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent to email
 *       400:
 *         description: Invalid email or user not found
 *       429:
 *         description: Too many requests - wait before trying again
 */
router.post("/resend-otp", validateRequest(resendOtpValidator), resendOTP);

/**
 * @swagger
 * /auth/resend-account-verification-link:
 *   post:
 *     summary: Request account verification link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       400:
 *         description: Email is already verified or email is missing
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many requests - wait before trying again
 */
router.post(
  "/resend-account-verification-link",
  validateRequest(requestEmailVerficationValidator),
  resendVerificationEmail
);

router.post("/test-email", testEmail);

module.exports = router;
