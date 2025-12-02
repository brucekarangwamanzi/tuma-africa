const express = require('express');
const AdminSettings = require('../models/AdminSettings');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { createAccountApprovalNotification } = require('../utils/notifications');
const { authenticateToken, requireRole, sensitiveOperation } = require('../middleware/auth');
const { validateAdminSettings, validatePagination } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Get admin settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 */
// @route   GET /api/admin/settings
// @desc    Get admin settings
// @access  Private (Admin/Super Admin)
router.get('/settings', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();
    res.json({ settings });

  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// @route   POST /api/admin/settings
// @desc    Update admin settings
// @access  Private (Super Admin only)
router.post('/settings', authenticateToken, requireRole(['super_admin']), sensitiveOperation, validateAdminSettings, async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();
    
    // Clean up advertisements - remove empty ones
    if (req.body.advertisements) {
      req.body.advertisements = req.body.advertisements.filter((ad) => 
        ad && ad.title && ad.title.trim() !== ''
      );
    }
    
    if (!settings) {
      settings = new AdminSettings(req.body);
    } else {
      // Deep merge the settings
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key])) {
          settings[key] = { ...settings[key], ...req.body[key] };
        } else {
          settings[key] = req.body[key];
        }
      });
    }

    settings.lastUpdatedBy = req.user._id;
    settings.version += 1;
    
    await settings.save();
    await settings.populate('lastUpdatedBy', 'fullName email');

    res.json({
      message: 'Settings updated successfully',
      settings
    });

  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({ 
      message: 'Failed to update settings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard data
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userCount:
 *                   type: integer
 *                 orderCount:
 *                   type: integer
 *                 productCount:
 *                   type: integer
 *                 orderStats:
 *                   type: array
 *                 recentOrders:
 *                   type: array
 */
// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin/Super Admin)
router.get('/dashboard', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    // Get basic stats
    const [userCount, orderCount, productCount, pendingOrders] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ status: 'pending' })
    ]);

    // Get order status distribution
    const orderStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$finalAmount' }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find()
      .populate('userId', 'fullName email')
      .populate('assignedEmployee', 'fullName')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get monthly revenue (last 12 months)
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          },
          status: { $in: ['delivered', 'shipped'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$finalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top products
    const topProducts = await Product.find({ isActive: true })
      .sort({ 'popularity.orders': -1 })
      .limit(5)
      .select('name popularity.orders popularity.views');

    // Get user registrations (last 30 days)
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Calculate total revenue from delivered orders
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped'] } } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ]);

    // Calculate monthly growth (simplified - comparing this month vs last month)
    const thisMonth = new Date();
    const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
    const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);

    const [thisMonthOrders, lastMonthOrders] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      Order.countDocuments({ 
        createdAt: { 
          $gte: lastMonth, 
          $lt: thisMonthStart 
        } 
      })
    ]);

    const monthlyGrowth = lastMonthOrders > 0 
      ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders * 100).toFixed(1)
      : 0;

    res.json({
      stats: {
        totalUsers: userCount,
        totalOrders: orderCount,
        pendingOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyGrowth: parseFloat(monthlyGrowth)
      },
      orderStats,
      recentOrders,
      monthlyRevenue,
      topProducts,
      userRegistrations
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users for admin management
// @access  Private (Admin/Super Admin)
router.get('/users', authenticateToken, requireRole(['admin', 'super_admin']), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { role, approved, verified, search } = req.query;
    
    let query = {};
    
    if (role) query.role = role;
    if (approved !== undefined) query.approved = approved === 'true';
    if (verified !== undefined) query.verified = verified === 'true';
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// @route   GET /api/admin/users/:userId
// @desc    Get single user details
// @access  Private (Admin/Super Admin)
router.get('/users/:userId', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-passwordHash -refreshToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// @route   PUT /api/admin/users/:userId/approve
// @desc    Approve/disapprove user
// @access  Private (Admin/Super Admin)
router.put('/users/:userId/approve', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { approved } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.approved = approved;
    await user.save();

    // Create notification for account approval/rejection
    const io = req.app.get('io');
    await createAccountApprovalNotification(user, approved, io);

    res.json({
      message: `User ${approved ? 'approved' : 'disapproved'} successfully`,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        approved: user.approved
      }
    });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Failed to update user approval status' });
  }
});

// @route   PUT /api/admin/users/:userId/role
// @desc    Update user role
// @access  Private (Admin/Super Admin with restrictions)
router.put('/users/:userId/role', authenticateToken, requireRole(['admin', 'super_admin']), sensitiveOperation, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent changing own role
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    // Only super_admin can create other super_admins
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admins can create other super admins' });
    }

    // Only super_admin can modify other super_admins
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Only super admins can modify other super admins' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// @route   DELETE /api/admin/users/:userId
// @desc    Deactivate user
// @access  Private (Admin/Super Admin)
router.delete('/users/:userId', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    // Prevent regular admin from deactivating super admin
    if (req.user.role === 'admin' && user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot deactivate super admin' });
    }

    user.isActive = false;
    user.refreshToken = undefined; // Logout user
    await user.save();

    res.json({ message: 'User deactivated successfully' });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Failed to deactivate user' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Private (Admin/Super Admin)
router.get('/analytics', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateFilter;
    switch (period) {
      case '7d':
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        dateFilter = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Order analytics
    const orderAnalytics = await Order.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$finalAmount' },
          avgValue: { $avg: '$finalAmount' }
        }
      }
    ]);

    // Daily order trends
    const dailyTrends = await Order.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Product performance
    const productPerformance = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          name: 1,
          category: 1,
          orders: '$popularity.orders',
          views: '$popularity.views',
          conversionRate: {
            $cond: [
              { $gt: ['$popularity.views', 0] },
              { $divide: ['$popularity.orders', '$popularity.views'] },
              0
            ]
          }
        }
      },
      { $sort: { orders: -1 } },
      { $limit: 10 }
    ]);

    // User engagement
    const userEngagement = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    '$lastLogin',
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      period,
      orderAnalytics,
      dailyTrends,
      productPerformance,
      userEngagement
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

module.exports = router;