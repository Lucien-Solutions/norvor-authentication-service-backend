const express = require('express');
const router = express.Router();

const {
  loginUser,
  registerUser,
  verifyEmail,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
  resendVerificationEmail,
  resendOTP,
  refreshAuthToken,
  getUserById,
} = require('../controllers/authController');
const validateRequest = require('../validators/validateRequest');
const {
  registerValidator,
  verifyEmailValidator,
  loginValidator,
  requestPasswordResetValidator,
  verifyResetOTPValidator,
  resetPasswordValidator,
  requestEmailVerficationValidator,
  resendOtpValidator,
} = require('../validators/authValidators');

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
router.post('/register', validateRequest(registerValidator), registerUser);

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
  '/verify-email',
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
 *         headers:
 *          Set-Cookie:
 *            description: Authentication token cookie
 *            schema:
 *              type: string
 *       400:
 *         description: Missing fields or invalid credentials
 */
router.post('/login', validateRequest(loginValidator), loginUser);

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
  '/request-password-reset',
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
  '/verify-password-reset-otp',
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
  '/reset-password',
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
router.post('/resend-otp', validateRequest(resendOtpValidator), resendOTP);

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
  '/resend-account-verification-link',
  validateRequest(requestEmailVerficationValidator),
  resendVerificationEmail
);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Use a valid refresh token (sent as cookie) to generate a new access token.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token refreshed
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Refresh token missing
 *       403:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', refreshAuthToken);

/**
 * @swagger
 * /auth/user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to fetch
 *     responses:
 *       200:
 *         description: Successfully retrieved user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64e1111ca7e435f7c48904a1"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (not allowed to access this user's data)
 *       404:
 *         description: User not found
 */
router.get('/user/:id', getUserById);

module.exports = router;
