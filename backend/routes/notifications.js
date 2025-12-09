const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                 pagination:
 *                   type: object
 *                 unreadCount:
 *                   type: integer
 */
// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const where = { userId: req.user.id };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const { count: total, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset
    });

    const unreadCount = await Notification.count({ 
      where: { 
        userId: req.user.id, 
        read: false 
      } 
    });

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.count({ 
      where: { 
        userId: req.user.id, 
        read: false 
      } 
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

// @route   POST /api/notifications
// @desc    Create a new notification
// @access  Private (Admin/SuperAdmin only for creating notifications for others)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId, type, title, message, data, link, icon, priority, expiresAt } = req.body;

    // If userId is provided and user is admin/super_admin, allow creating for others
    // Otherwise, create for the current user
    const targetUserId = (req.user.role === 'admin' || req.user.role === 'super_admin') && userId
      ? userId
      : req.user.id;

    const notification = await Notification.create({
      userId: targetUserId,
      type: type || 'system_announcement',
      title,
      message,
      data: data || {},
      link: link || '',
      icon: icon || 'bell',
      priority: priority || 'medium',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    // Emit Socket.IO event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${targetUserId}`).emit('notification:new', notification);
    }

    res.status(201).json({ notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.update({
      read: true,
      readAt: new Date()
    });

    res.json({ notification });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const [updatedCount] = await Notification.update(
      { 
        read: true, 
        readAt: new Date() 
      },
      {
        where: { 
          userId: req.user.id, 
          read: false 
        }
      }
    );

    res.json({ 
      message: 'All notifications marked as read',
      updatedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.destroy();

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// @route   DELETE /api/notifications
// @desc    Delete all notifications
// @access  Private
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { readOnly = false } = req.query;

    const where = { userId: req.user.id };
    if (readOnly === 'true') {
      where.read = true;
    }

    const deletedCount = await Notification.destroy({ where });

    res.json({ 
      message: 'Notifications deleted successfully',
      deletedCount
    });
  } catch (error) {
    console.error('Delete notifications error:', error);
    res.status(500).json({ message: 'Failed to delete notifications' });
  }
});

module.exports = router;

