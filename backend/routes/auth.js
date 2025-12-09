const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

const router = express.Router();

// Generate JWT tokens
const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { userId, id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );
  
  const refreshToken = jwt.sign(
    { userId, id: userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
  
  return { accessToken, refreshToken };
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account. User will need to verify email and wait for admin approval.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address (must be unique)
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 description: User phone number (must be unique)
 *                 example: +1234567890
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password (min 6 characters, must contain uppercase, lowercase, and number)
 *                 example: SecurePassword123!
 *               currency:
 *                 type: string
 *                 enum: [USD, RWF, Yuan]
 *                 description: Preferred currency
 *                 default: USD
 *                 example: USD
 *           examples:
 *             example1:
 *               summary: Example registration
 *               value:
 *                 fullName: John Doe
 *                 email: john@example.com
 *                 phone: +1234567890
 *                 password: SecurePassword123!
 *                 currency: USD
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Registration successful! Please check your email to verify your account.
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               emailExists:
 *                 value:
 *                   message: Email already registered
 *               phoneExists:
 *                 value:
 *                   message: Phone number already registered
 */
// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { fullName, email, phone, password, currency } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: {
        [Op.or]: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Phone number already registered'
      });
    }

    // Create new user
    const user = await User.create({
      fullName,
      email,
      phone,
      passwordHash: password, // Will be hashed by pre-save hook
      currency: currency || 'USD', // Default to USD if not provided
      role: 'user',
      verified: false,
      approved: true // Auto-approve new users
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours expiry

    // Update user with verification token
    await user.update({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

    // Send verification email
    let emailSent = false;
    let verificationUrl = '';
    try {
      const emailResult = await sendVerificationEmail(user.email, verificationToken, user.fullName);
      if (emailResult.success) {
        console.log(`✅ Verification email sent to ${user.email}`);
        emailSent = true;
        if (emailResult.verificationUrl) {
          verificationUrl = emailResult.verificationUrl;
        }
      } else {
        console.warn(`⚠️ Failed to send verification email to ${user.email}:`, emailResult.error);
        if (process.env.NODE_ENV === 'development' && emailResult.debug) {
          console.log('📧 Development mode - Email not configured');
          console.log('📧 Verification token:', verificationToken);
          verificationUrl = emailResult.verificationUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
          console.log('📧 Manual verification URL:', verificationUrl);
        }
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails, but log it
      verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    
    // Save refresh token
    await user.update({ refreshToken });

    const responseMessage = emailSent 
      ? 'Registration successful! Please check your email to verify your account.'
      : 'Registration successful! Email service not configured. Please contact support for account verification.';
    
    const response = {
      message: responseMessage,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
        approved: user.approved
      },
      accessToken,
      refreshToken
    };
    
    // In development, include verification URL if email wasn't sent
    if (!emailSent && process.env.NODE_ENV === 'development' && verificationUrl) {
      response.debug = {
        message: 'Email service not configured. Use this URL to verify:',
        verificationUrl: verificationUrl,
        verificationToken: verificationToken
      };
    }
    
    res.status(201).json(response);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password to receive access token
 *     tags: [Authentication]
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
 *                 format: email
 *                 description: User email address
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *                 example: SecurePassword123!
 *           examples:
 *             example1:
 *               summary: Example login request
 *               value:
 *                 email: john@example.com
 *                 password: SecurePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token (use this for Authorization header)
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Invalid email or password
 */
// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email (with password hash)
    const user = await User.scope('withPassword').findOne({ 
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    
    // Update refresh token and last login
    await user.update({
      refreshToken: refreshToken,
      lastLogin: new Date()
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
        approved: user.approved,
        profileImage: user.profileImage
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       403:
 *         description: Invalid refresh token
 */
// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and verify refresh token
    const user = await User.findByPk(decoded.userId);
    
    if (!user || user.refreshToken !== refreshToken || !user.isActive) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.role);
    
    // Update refresh token
    await user.update({ refreshToken: tokens.refreshToken });

    res.json({
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: |
 *       Logout the current user and invalidate their refresh token.
 *       
 *       **Authentication Required:** This endpoint requires a valid JWT token.
 *       Click the "Authorize" button at the top of the page and enter your token.
 *       
 *       **No Parameters:** This endpoint doesn't require any request body or parameters.
 *       The user is identified from the JWT token in the Authorization header.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               message: "Logout successful"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 */
// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear refresh token
    await User.update(
      { refreshToken: null },
      { where: { id: req.user.id } }
    );

    res.json({ message: 'Logout successful' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: |
 *       Get the currently authenticated user's information.
 *       
 *       **Authentication Required:** This endpoint requires a valid JWT token.
 *       Click the "Authorize" button at the top of the page and enter your token.
 *       
 *       **No Parameters:** This endpoint doesn't require any query or path parameters.
 *       The user is identified from the JWT token in the Authorization header.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             examples:
 *               example1:
 *                 summary: Example response
 *                 value:
 *                   user:
 *                     id: "507f1f77bcf86cd799439011"
 *                     fullName: "John Doe"
 *                     email: "john@example.com"
 *                     phone: "+1234567890"
 *                     role: "user"
 *                     verified: true
 *                     approved: true
 *                     profileImage: "https://example.com/profile.jpg"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: "Unauthorized"
 */
// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash', 'refreshToken'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
        approved: user.approved,
        profileImage: user.profileImage,
        address: user.address,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user information' });
  }
});

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
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
 *         description: Password reset email sent (if email exists)
 */
// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Don't reveal if email exists
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.fullName);
      console.log(`✅ Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    res.json({ 
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Remove this in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.purpose !== 'password-reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Find user and update password
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Update password (will be hashed by pre-save hook) and invalidate sessions
    await user.update({
      passwordHash: newPassword,
      refreshToken: null
    });

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
});

module.exports = router;