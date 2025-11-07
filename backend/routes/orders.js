const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const { authenticateToken, requireRole, requireApproval } = require('../middleware/auth');
const { validateOrderCreation, validateOrderUpdate, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (User)
router.post('/', authenticateToken, requireApproval, validateOrderCreation, async (req, res) => {
  try {
    const {
      productName,
      productLink,
      quantity,
      unitPrice,
      shippingCost = 0,
      priority = 'normal',
      description,
      totalPrice,
      finalAmount
    } = req.body;

    const order = new Order({
      userId: req.user._id,
      productName,
      productLink,
      quantity,
      unitPrice,
      totalPrice: totalPrice || (quantity * unitPrice),
      shippingCost,
      finalAmount: finalAmount || ((quantity * unitPrice) + shippingCost),
      priority,
      description,
      shippingAddress: {
        fullName: req.user.fullName,
        phone: req.user.phone || '',
        street: req.user.address?.street || '',
        city: req.user.address?.city || '',
        state: req.user.address?.state || '',
        country: req.user.address?.country || '',
        zipCode: req.user.address?.zipCode || ''
      },
      stageHistory: [{
        stage: 'pending',
        timestamp: new Date(),
        notes: 'Order created by customer'
      }]
    });

    await order.save();
    await order.populate('userId', 'fullName email phone');

    res.status(201).json({
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/orders
// @desc    Get orders (filtered by role)
// @access  Private
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { status, priority, search } = req.query;
    
    // Build query based on user role
    let query = {};
    
    if (req.user.role === 'user') {
      query.userId = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admin can see all orders or assigned orders
      if (req.query.assigned === 'true') {
        query.assignedEmployee = req.user._id;
      }
    }
    // Super admin can see all orders (no additional filter)

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('userId', 'fullName email phone')
      .populate('assignedEmployee', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// @route   GET /api/orders/:orderId
// @desc    Get single order
// @access  Private
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Try to find by MongoDB ObjectId first, then by custom orderId
    let query = {};
    
    // Check if it's a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { orderId };
    }
    
    // Users can only see their own orders
    if (req.user.role === 'user') {
      query.userId = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate('userId', 'fullName email phone profileImage')
      .populate('assignedEmployee', 'fullName email')
      .populate('stageHistory.updatedBy', 'fullName');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// @route   PUT /api/orders/:orderId
// @desc    Update order
// @access  Private (Admin/Super Admin)
router.put('/:orderId', authenticateToken, requireRole(['admin', 'super_admin']), validateOrderUpdate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    // Try to find by MongoDB ObjectId first, then by custom orderId
    let query = {};
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { orderId };
    }

    const order = await Order.findOne(query);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Track status changes
    const oldStatus = order.status;
    
    // Update order fields
    Object.keys(updates).forEach(key => {
      if (key !== 'stageHistory') {
        order[key] = updates[key];
      }
    });

    // Add stage history entry if status changed
    if (updates.status && updates.status !== oldStatus) {
      order.stageHistory.push({
        stage: updates.status,
        timestamp: new Date(),
        updatedBy: req.user._id,
        notes: updates.notes || `Status updated to ${updates.status}`
      });
    }

    // Set assigned employee if not set
    if (!order.assignedEmployee && req.user.role === 'admin') {
      order.assignedEmployee = req.user._id;
    }

    await order.save();
    await order.populate([
      { path: 'userId', select: 'fullName email phone' },
      { path: 'assignedEmployee', select: 'fullName email' },
      { path: 'stageHistory.updatedBy', select: 'fullName' }
    ]);

    res.json({
      message: 'Order updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// @route   POST /api/orders/:orderId/notes
// @desc    Add note to order
// @access  Private (Admin/Super Admin)
router.post('/:orderId/notes', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Note text is required' });
    }

    // Try to find by MongoDB ObjectId first, then by custom orderId
    let query = {};
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { orderId };
    }

    const order = await Order.findOne(query);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.notes.push({
      text: text.trim(),
      createdBy: req.user._id,
      createdAt: new Date()
    });

    await order.save();
    await order.populate('notes.createdBy', 'fullName');

    res.json({
      message: 'Note added successfully',
      note: order.notes[order.notes.length - 1]
    });

  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Failed to add note' });
  }
});

// @route   PUT /api/orders/:orderId/status
// @desc    Update order status
// @access  Private (Admin/Super Admin)
router.put('/:orderId/status', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Try to find by MongoDB ObjectId first, then by custom orderId
    let query = {};
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { orderId };
    }

    const order = await Order.findOne(query);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    order.status = status;

    // Add stage history entry
    order.stageHistory.push({
      stage: status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: `Status updated from ${oldStatus} to ${status}`
    });

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// @route   DELETE /api/orders/:orderId
// @desc    Cancel/Delete order
// @access  Private
router.delete('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Try to find by MongoDB ObjectId first, then by custom orderId
    let query = {};
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { orderId };
    }
    
    // Users can only cancel their own pending orders
    if (req.user.role === 'user') {
      query.userId = req.user._id;
      query.status = 'pending';
    }

    const order = await Order.findOne(query);
    
    if (!order) {
      return res.status(404).json({ 
        message: req.user.role === 'user' 
          ? 'Order not found or cannot be cancelled' 
          : 'Order not found' 
      });
    }

    if (req.user.role === 'user') {
      // Users can only cancel pending orders
      order.status = 'cancelled';
      order.stageHistory.push({
        stage: 'cancelled',
        timestamp: new Date(),
        notes: 'Order cancelled by customer'
      });
      await order.save();
      
      res.json({ message: 'Order cancelled successfully' });
    } else {
      // Admins can delete orders
      await Order.findByIdAndDelete(order._id);
      res.json({ message: 'Order deleted successfully' });
    }

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// @route   GET /api/orders/stats/dashboard
// @desc    Get order statistics for dashboard
// @access  Private (Admin/Super Admin)
router.get('/stats/dashboard', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$finalAmount' }
        }
      }
    ]);

    const recentOrders = await Order.find()
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5);

    const monthlyStats = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      statusStats: stats,
      recentOrders,
      monthlyStats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;