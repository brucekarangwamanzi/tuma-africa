const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireApproval } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash -refreshToken');

    res.json({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', 
  authenticateToken, 
  requireApproval,
  [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Please provide a valid phone number'),
    
    body('address.street')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Street address cannot exceed 200 characters'),
    
    body('address.city')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('City cannot exceed 100 characters'),
    
    body('address.country')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Country cannot exceed 100 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { fullName, phone, address, profileImage, currency } = req.body;
      
      const updateData = {};
      if (fullName) updateData.fullName = fullName;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = { ...req.user.address, ...address };
      if (profileImage) updateData.profileImage = profileImage;
      if (currency && ['RWF', 'Yuan', 'USD'].includes(currency)) {
        updateData.currency = currency;
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
      ).select('-passwordHash -refreshToken');

      res.json({
        message: 'Profile updated successfully',
        user
      });

    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({ 
          message: `${field} already exists` 
        });
      }
      
      res.status(500).json({ 
        message: 'Failed to update profile',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password',
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    
    body('newPassword')
      .isLength({ min: 6, max: 128 })
      .withMessage('New password must be between 6 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match');
        }
        return true;
      })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await User.findById(req.user._id).select('+passwordHash');
      
      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update password
      user.passwordHash = newPassword; // Will be hashed by pre-save middleware
      user.refreshToken = undefined; // Invalidate all sessions
      await user.save();

      res.json({ message: 'Password changed successfully' });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  }
);

// @route   DELETE /api/users/account
// @desc    Deactivate user account
// @access  Private
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required to deactivate account' });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+passwordHash');
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Deactivate account
    user.isActive = false;
    user.refreshToken = undefined;
    await user.save();

    res.json({ message: 'Account deactivated successfully' });

  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({ message: 'Failed to deactivate account' });
  }
});

// @route   GET /api/users/dashboard-stats
// @desc    Get user dashboard statistics
// @access  Private
router.get('/dashboard-stats', authenticateToken, requireApproval, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Chat = require('../models/Chat');

    // Get user's order statistics
    const orderStats = await Order.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$finalAmount' }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderId productName status finalAmount createdAt');

    // Get unread messages count
    const unreadMessages = await Chat.aggregate([
      { $match: { participants: req.user._id } },
      { $unwind: '$messages' },
      { 
        $match: { 
          'messages.isRead': false,
          'messages.createdAt': { $gt: req.user.lastLogin || new Date(0) }
        }
      },
      { $count: 'unreadCount' }
    ]);

    // Get active chats count
    const activeChats = await Chat.countDocuments({
      participants: req.user._id,
      status: { $in: ['open', 'in_progress'] }
    });

    res.json({
      orderStats,
      recentOrders,
      unreadMessages: unreadMessages[0]?.unreadCount || 0,
      activeChats,
      user: {
        fullName: req.user.fullName,
        email: req.user.email,
        joinDate: req.user.createdAt,
        verified: req.user.verified,
        approved: req.user.approved
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// @route   POST /api/users/verify-email
// @desc    Request email verification (resend)
// @access  Private
router.post('/verify-email', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    const { sendVerificationEmail } = require('../utils/emailService');
    const emailResult = await sendVerificationEmail(user.email, verificationToken, user.fullName);

    if (!emailResult.success) {
      // If email service is not configured, still allow the request but inform user
      if (process.env.NODE_ENV === 'development' && emailResult.debug) {
        console.log('📧 Development mode - Email not configured:', emailResult.debug);
        return res.json({ 
          message: 'Verification email would be sent. Email service not configured.',
          debug: emailResult.debug,
          verificationToken: verificationToken // Only in development
        });
      }
      return res.status(500).json({ 
        message: 'Failed to send verification email. Please contact support.',
        error: emailResult.error
      });
    }

    res.json({ 
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Failed to send verification email' });
  }
});

// @route   GET /api/users/verify-email/:token
// @desc    Verify email with token
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token' 
      });
    }

    // Verify the email
    user.verified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ 
      message: 'Email verified successfully!',
      verified: true
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Failed to verify email' });
  }
});

// @route   GET /api/users/notifications
// @desc    Get user notifications
// @access  Private
router.get('/notifications', authenticateToken, requireApproval, async (req, res) => {
  try {
    const Order = require('../models/Order');
    
    // Get recent order updates
    const orderUpdates = await Order.find({ 
      userId: req.user._id,
      updatedAt: { $gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('orderId productName status updatedAt stageHistory');

    const notifications = orderUpdates.map(order => ({
      id: order._id,
      type: 'order_update',
      title: `Order ${order.orderId} Updated`,
      message: `Your order "${order.productName}" status changed to ${order.status}`,
      timestamp: order.updatedAt,
      read: false,
      data: {
        orderId: order.orderId,
        status: order.status
      }
    }));

    res.json({ notifications });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

module.exports = router;