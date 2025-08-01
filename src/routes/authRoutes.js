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
  refreshAuthToken,
  getUserById,
  getUserByEmail,
  downloadImage,
  updateUserProfile,
  uploadProfilePicture,
  changePassword,
  updateRecoveryEmail,
  verifyLoginOtp
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
  updateUserProfileValidator,
  changePasswordValidator,
  recoveryEmailValidator,
  verifyLoginOtpValidator
} = require("../validators/authValidators");
const upload = require("../middlewares/upload");
const { verifyJWT } = require("../middlewares/authMiddleware");

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
 *     summary: Login user generate otp
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
 *         description: Login OTP Generated Successfully
 *         headers:
 *          Set-Cookie:
 *            description: Authentication token cookie
 *            schema:
 *              type: string
 *       400:
 *         description: Missing fields or invalid credentials
 */
router.post("/login", validateRequest(loginValidator), loginUser);

/**
 * @swagger
 * /auth/login-verify:
 *   post:
 *     summary: Verify OTP for login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempToken
 *               - otp
 *             properties:
 *               tempToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..........
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: OTP Verified Successfully
 *         headers:
 *           Set-Cookie:
 *             description: Authentication token cookie
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 */


router.post("/login-verify", validateRequest(verifyLoginOtpValidator),verifyLoginOtp);

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
 *     summary: Verify OTP for password reset and receive reset token
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
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully, reset token returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP verified
 *                 resetToken:
 *                   type: string
 *                   description: Token required to reset the password
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
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
 *               - resetToken
 *               - newPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *                 description: Token received after OTP verification
 *               newPassword:
 *                 type: string
 *                 example: MySecurePassword123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successful. You can now log in with your new password.
 *       400:
 *         description: Validation error (e.g., missing fields)
 *       401:
 *         description: Invalid or expired reset token
 *       404:
 *         description: User not found
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
 *               - tempToken
 *             properties:
 *               tempToken:
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
router.post("/refresh-token", refreshAuthToken);

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

/**
 * @swagger
 * /auth/get-user-by-email/{email}:
 *   get:
 *     summary: Get user by email
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The email of the user to fetch
 *     responses:
 *       200:
 *         description: Successfully retrieved user or null if not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   anyOf:
 *                     - type: "null"
 *                     - type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "64e1111ca7e435f7c48904a1"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         email:
 *                           type: string
 *                           example: "john@example.com"
 *                         role:
 *                           type: string
 *                           example: "user"
 *       400:
 *         description: Email is required
 */

/**
 * @swagger
 * /auth/update-profile:
 *   patch:
 *     summary: Update user profile for the authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               profileImageURL:
 *                 type: string
 *               organizationId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [active, inactive, invited, suspended]
 *             required:
 *               - name
 *               - email
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       404:
 *         description: User profile not found
 */


/**
 * @swagger
 * /auth/upload-profile-image:
 *   patch:
 *     summary: Upload profile image for the authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file to upload
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile image uploaded successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64a0f3c1e6b3a0f3c1e6b3a0"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john@example.com"
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     profileImageURL:
 *                       type: string
 *                       format: uri
 *                       example: "https://example.com/images/profile.jpg"
 *                     organizationId:
 *                       type: string
 *                       format: uuid
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     status:
 *                       type: string
 *                       enum: [active, inactive, invited, suspended]
 *                       example: "active"
 *       400:
 *         description: No file uploaded or invalid file
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /auth/download-profile-image:
 *   get:
 *     summary: Download the authenticated user's profile image
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns the user's profile image
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 *       500:
 *         description: Failed to download image
 */

/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     summary: Change password for the authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: myOldPassword123
 *               newPassword:
 *                 type: string
 *                 example: myNewPassword456
 *               confirmNewPassword:
 *                 type: string
 *                 example: myNewPassword456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or current password incorrect
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /auth/update-recovery-email:
 *   patch:
 *     summary: Add or update the recovery email of the authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recoveryEmail
 *             properties:
 *               recoveryEmail:
 *                 type: string
 *                 format: email
 *                 example: recovery@example.com
 *     responses:
 *       200:
 *         description: Recovery email updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Recovery email updated successfully.
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     recoveryEmail:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */


router.get("/get-user-by-email/:email", getUserByEmail);
router.get("/user/:id", getUserById);
router.patch("/update-profile",validateRequest(updateUserProfileValidator),verifyJWT, updateUserProfile);
router.patch("/upload-profile-image",verifyJWT, upload.single("image"), uploadProfilePicture);
router.get(
  "/download-profile-image",verifyJWT,
  downloadImage
);
router.patch(
  "/change-password",
  validateRequest(changePasswordValidator),
  verifyJWT,
  changePassword
);

router.patch(
  "/update-recovery-email",
  validateRequest(recoveryEmailValidator),
  verifyJWT,
  updateRecoveryEmail
);


module.exports = router;
