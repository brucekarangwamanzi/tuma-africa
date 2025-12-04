const express = require('express');
const { Op } = require('sequelize');
const { User, Order, Chat, Message } = require('../models');
const { authenticateToken, requireApproval } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash', 'refreshToken'] }
    });

    res.json({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *               profileImage:
 *                 type: string
 *               currency:
 *                 type: string
 *                 enum: [USD, RWF, Yuan]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
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
      if (address) {
        // Update individual address fields
        if (address.street !== undefined) updateData.addressStreet = address.street;
        if (address.city !== undefined) updateData.addressCity = address.city;
        if (address.state !== undefined) updateData.addressState = address.state;
        if (address.country !== undefined) updateData.addressCountry = address.country;
        if (address.zipCode !== undefined) updateData.addressZipCode = address.zipCode;
      }
      if (profileImage) updateData.profileImage = profileImage;
      if (currency && ['RWF', 'Yuan', 'USD'].includes(currency)) {
        updateData.currency = currency;
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      await user.update(updateData);
      
      // Reload to get updated data
      await user.reload({
        attributes: { exclude: ['passwordHash', 'refreshToken'] }
      });

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
      const user = await User.scope('withPassword').findByPk(req.user.id);
      
      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update password
      await user.update({
        passwordHash: newPassword, // Will be hashed by beforeUpdate hook
        refreshToken: null // Invalidate all sessions
      });

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
    const user = await User.scope('withPassword').findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    // Deactivate account
    await user.update({
      isActive: false,
      refreshToken: null
    });

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
    const { sequelize } = require('../models');

    // Get user's order statistics
    const orderStats = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.cast(sequelize.col('final_amount'), 'DECIMAL')), 'totalValue']
      ],
      where: { userId: req.user.id },
      group: ['status'],
      raw: true
    });

    // Format orderStats to match expected format
    const formattedOrderStats = orderStats.map(stat => ({
      _id: stat.status,
      count: parseInt(stat.count) || 0,
      totalValue: parseFloat(stat.totalValue) || 0
    }));

    // Get recent orders
    const recentOrders = await Order.findAll({
      where: { userId: req.user.id },
      attributes: ['id', 'orderId', 'productName', 'status', 'finalAmount', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Get unread messages count
    // Find chats where user is a participant
    const userChats = await Chat.findAll({
      include: [
        {
          model: User,
          as: 'participants',
          where: { id: req.user.id },
          through: { attributes: [] },
          required: true
        }
      ],
      attributes: ['id']
    });

    const chatIds = userChats.map(chat => chat.id);
    
    const unreadMessagesCount = await Message.count({
      where: {
        chatId: { [Op.in]: chatIds },
        isRead: false,
        sender: { [Op.ne]: req.user.id }, // Don't count own messages
        createdAt: { [Op.gt]: req.user.lastLogin || new Date(0) }
      }
    });

    // Get active chats count
    const activeChats = await Chat.count({
      include: [
        {
          model: User,
          as: 'participants',
          where: { id: req.user.id },
          through: { attributes: [] },
          required: true
        }
      ],
      where: {
        status: { [Op.in]: ['open', 'in_progress'] }
      }
    });

    res.json({
      orderStats: formattedOrderStats,
      recentOrders,
      unreadMessages: unreadMessagesCount,
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
    const user = await User.findByPk(req.user.id);
    
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

    await user.update({
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires
    });

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
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { [Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token' 
      });
    }

    // Verify the email
    await user.update({
      verified: true,
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      emailVerificationExpires: null
    });

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
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Get recent order updates
    const orderUpdates = await Order.findAll({ 
      where: {
        userId: req.user.id,
        updatedAt: { [Op.gt]: sevenDaysAgo } // Last 7 days
      },
      attributes: ['id', 'orderId', 'productName', 'status', 'updatedAt', 'stageHistory'],
      order: [['updatedAt', 'DESC']],
      limit: 10
    });

    const notifications = orderUpdates.map(order => ({
      id: order.id,
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