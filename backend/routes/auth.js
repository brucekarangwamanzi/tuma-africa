const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
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

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Phone number already registered'
      });
    }

    // Create new user
    const user = new User({
      fullName,
      email,
      phone,
      passwordHash: password, // Will be hashed by pre-save middleware
      role: 'user',
      verified: false,
      approved: false
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours expiry

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;

    await user.save();

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
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    const responseMessage = emailSent 
      ? 'Registration successful! Please check your email to verify your account.'
      : 'Registration successful! Email service not configured. Please contact support for account verification.';
    
    const response = {
      message: responseMessage,
      user: {
        id: user._id,
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

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+passwordHash');
    
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
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    
    // Update refresh token and last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
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
    const user = await User.findById(decoded.userId);
    
    if (!user || user.refreshToken !== refreshToken || !user.isActive) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(user._id, user.role);
    
    // Update refresh token
    user.refreshToken = tokens.refreshToken;
    await user.save();

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

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Clear refresh token
    await User.findByIdAndUpdate(req.user._id, { 
      $unset: { refreshToken: 1 } 
    });

    res.json({ message: 'Logout successful' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash -refreshToken')
      .populate('address');

    res.json({
      user: {
        id: user._id,
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

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password-reset' },
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
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    user.refreshToken = undefined; // Invalidate all sessions
    await user.save();

    res.json({ message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
});

module.exports = router;