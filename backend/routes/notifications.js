const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
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

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user._id, 
      read: false 
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
      : req.user._id;

    const notification = new Notification({
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

    await notification.save();

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

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

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
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { 
        $set: { 
          read: true, 
          readAt: new Date() 
        } 
      }
    );

    res.json({ 
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
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
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

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

    const query = { userId: req.user._id };
    if (readOnly === 'true') {
      query.read = true;
    }

    const result = await Notification.deleteMany(query);

    res.json({ 
      message: 'Notifications deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Delete notifications error:', error);
    res.status(500).json({ message: 'Failed to delete notifications' });
  }
});

module.exports = router;

