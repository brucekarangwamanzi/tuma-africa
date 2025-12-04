const express = require('express');
const { Op } = require('sequelize');
const { AdminSettings, User, Order, Product, sequelize } = require('../models');
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
    const settingsDoc = await AdminSettings.getSettings();
    // Return just the settings object, matching the frontend's expected format
    res.json({ settings: settingsDoc.settings || {} });

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
    
    // Frontend sends the entire settings object directly, not nested under 'settings'
    // Extract the actual settings data
    let settingsData = req.body;
    
    // If settings are nested under 'settings' key, extract them
    if (req.body.settings && typeof req.body.settings === 'object') {
      settingsData = req.body.settings;
    }
    
    // Clean up advertisements - remove empty ones
    if (settingsData.advertisements && Array.isArray(settingsData.advertisements)) {
      settingsData.advertisements = settingsData.advertisements.filter((ad) => 
        ad && ad.title && ad.title.trim() !== ''
      );
    }
    
    if (!settings) {
      // Create new settings record
      settings = await AdminSettings.create({
        settings: settingsData,
        lastUpdatedById: req.user.id,
        version: 1
      });
    } else {
      // Deep merge the settings - merge new data into existing settings
      const existingSettings = settings.settings || {};
      const updatedSettings = {
        ...existingSettings,
        ...settingsData
      };

      await settings.update({
        settings: updatedSettings,
        lastUpdatedById: req.user.id,
        version: (settings.version || 0) + 1
      });
    }

    await settings.reload({
      include: [{ model: User, as: 'lastUpdater', attributes: ['id', 'fullName', 'email'] }]
    });

    res.json({
      message: 'Settings updated successfully',
      settings: settings.settings // Return just the settings object, not the whole model
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
      User.count({ where: { role: 'user' } }),
      Order.count(),
      Product.count({ where: { isActive: true } }),
      Order.count({ where: { status: 'pending' } })
    ]);

    // Get order status distribution
    const orderStats = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.cast(sequelize.col('final_amount'), 'DECIMAL')), 'totalValue']
      ],
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
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email'] },
        { model: User, as: 'assignedEmployeeUser', attributes: ['id', 'fullName'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get monthly revenue (last 12 months)
    const monthlyRevenue = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('SUM', sequelize.cast(sequelize.col('final_amount'), 'DECIMAL')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
        },
        status: { [Op.in]: ['delivered', 'shipped'] }
      },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Format monthlyRevenue to match expected format
    const formattedMonthlyRevenue = monthlyRevenue.map(rev => ({
      _id: {
        year: new Date(rev.month).getFullYear(),
        month: new Date(rev.month).getMonth() + 1
      },
      revenue: parseFloat(rev.revenue) || 0,
      orders: parseInt(rev.orders) || 0
    }));

    // Get top products
    const topProducts = await Product.findAll({
      where: { isActive: true },
      attributes: [
        'name',
        [sequelize.literal("(popularity->>'orders')::int"), 'orders'],
        [sequelize.literal("(popularity->>'views')::int"), 'views']
      ],
      order: [[sequelize.literal("(popularity->>'orders')::int"), 'DESC']],
      limit: 5,
      raw: true
    });

    // Format topProducts to match expected format
    const formattedTopProducts = topProducts.map(product => ({
      name: product.name,
      popularity: {
        orders: parseInt(product.orders) || 0,
        views: parseInt(product.views) || 0
      }
    }));

    // Get user registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userRegistrations = await User.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Format userRegistrations to match expected format
    const formattedUserRegistrations = userRegistrations.map(reg => ({
      _id: reg.date,
      count: parseInt(reg.count) || 0
    }));

    // Calculate total revenue from delivered orders
    const totalRevenueResult = await Order.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.cast(sequelize.col('final_amount'), 'DECIMAL')), 'total']
      ],
      where: { status: { [Op.in]: ['delivered', 'shipped'] } },
      raw: true
    });

    const totalRevenue = parseFloat(totalRevenueResult[0]?.total) || 0;

    // Calculate monthly growth (simplified - comparing this month vs last month)
    const thisMonth = new Date();
    const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);
    const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);

    const [thisMonthOrders, lastMonthOrders] = await Promise.all([
      Order.count({ where: { createdAt: { [Op.gte]: thisMonthStart } } }),
      Order.count({ 
        where: { 
          createdAt: { 
            [Op.gte]: lastMonth, 
            [Op.lt]: thisMonthStart 
          } 
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
        totalRevenue,
        monthlyGrowth: parseFloat(monthlyGrowth)
      },
      orderStats: formattedOrderStats,
      recentOrders,
      monthlyRevenue: formattedMonthlyRevenue,
      topProducts: formattedTopProducts,
      userRegistrations: formattedUserRegistrations
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
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
      query[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count: total, rows: users } = await User.findAndCountAll({
      where: query,
      attributes: { exclude: ['passwordHash', 'refreshToken'] },
      order: [['createdAt', 'DESC']],
      offset: skip,
      limit
    });

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

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['passwordHash', 'refreshToken'] }
    });

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

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ approved });

    // Create notification for account approval/rejection
    const io = req.app.get('io');
    await createAccountApprovalNotification(user, approved, io);

    res.json({
      message: `User ${approved ? 'approved' : 'disapproved'} successfully`,
      user: {
        id: user.id,
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

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent changing own role
    if (user.id === req.user.id) {
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

    await user.update({ role });

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
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

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating own account
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    // Prevent regular admin from deactivating super admin
    if (req.user.role === 'admin' && user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot deactivate super admin' });
    }

    await user.update({ 
      isActive: false,
      refreshToken: null // Logout user
    });

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