const express = require("express");
const router = express.Router();
const {registerUser,loginUser,verifyEmail,verifyMFALogin,logoutUser} = require("../controllers/cognitoController")
const validateRequest = require("../validators/validateRequest");
const {registerValidator,loginValidator,verifyEmailValidator} = require("../validators/authValidators")

/**
 * @swagger
 * tags:
 *   name: Cognito
 *   description: Cognito-related endpoints
 */

/**
 * @swagger
 * /cognito/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Cognito]
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
 * /cognito/verify-email:
 *   post:
 *     summary: Verify user email with OTP
 *     tags: [Cognito]
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
 * /cognito/login:
 *   post:
 *     summary: Login user generate otp
 *     tags: [Cognito]
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
router.post("/login",validateRequest(loginValidator), loginUser);

/**
 * @swagger
 * /cognito/verify-mfa:
 *   post:
 *     summary: Verify OTP for login
 *     tags: [Cognito]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email 
 *               - code
 *               - session
 *               - challengeName
 *             properties:
 *               email :
 *                 type: string
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: 123456
 *               session:
 *                 type: string
 *                 example: sdasfefdfseffefefsfefefefwfesefcd.............
 *               challengeName:
 *                 type: string
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


router.post("/verify-mfa",verifyMFALogin);


/**
 * @swagger
 * /cognito/logout:
 *   post:
 *     summary: Logout user from Cognito
 *     tags: [Cognito]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         description: Missing or invalid refresh token
 */

router.post("/logout", logoutUser);

module.exports = router;