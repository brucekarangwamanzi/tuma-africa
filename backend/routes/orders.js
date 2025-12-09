const express = require('express');
const { Op } = require('sequelize');
const { Order, User } = require('../models');
const { authenticateToken, requireRole, requireApproval } = require('../middleware/auth');
const { validateOrderCreation, validateOrderUpdate, validatePagination } = require('../middleware/validation');
const { createOrderNotification } = require('../utils/notifications');

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - quantity
 *               - unitPrice
 *             properties:
 *               productName:
 *                 type: string
 *               productLink:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unitPrice:
 *                 type: number
 *               shippingCost:
 *                 type: number
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               freightType:
 *                 type: string
 *                 enum: [air, sea]
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 */
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
      freightType = 'sea',
      description,
      totalPrice,
      finalAmount
    } = req.body;

    const order = await Order.create({
      userId: req.user.id,
      productName,
      productLink: productLink || '',
      quantity,
      unitPrice,
      totalPrice: totalPrice || (quantity * unitPrice),
      shippingCost,
      finalAmount: finalAmount || ((quantity * unitPrice) + shippingCost),
      priority,
      freightType,
      description: description || '',
      shippingAddress: {
        fullName: req.user.fullName,
        phone: req.user.phone || '',
        street: req.user.addressStreet || '',
        city: req.user.addressCity || '',
        state: req.user.addressState || '',
        country: req.user.addressCountry || '',
        zipCode: req.user.addressZipCode || ''
      },
      stageHistory: [{
        stage: 'pending',
        timestamp: new Date(),
        notes: 'Order created by customer'
      }]
    });

    // Load user association
    await order.reload({
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }]
    });

    // Create notification for order creation
    try {
      const io = req.app.get('io');
      if (io) {
        await createOrderNotification(order, 'created', io);
      }
    } catch (notificationError) {
      // Don't fail order creation if notification fails
      console.error('Failed to create order notification:', notificationError);
    }

    res.status(201).json({
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ 
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
});

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get orders (filtered by user role)
 *     tags: [Orders]
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, approved, purchased, warehouse, shipped, delivered, cancelled]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 */
// @route   GET /api/orders
// @desc    Get orders (filtered by role)
// @access  Private
router.get('/', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { status, priority, search } = req.query;
    
    // Build query based on user role
    let where = {};
    
    if (req.user.role === 'user') {
      where.userId = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admin can see all orders or assigned orders
      if (req.query.assigned === 'true') {
        where.assignedEmployeeId = req.user.id;
      }
    }
    // Super admin can see all orders (no additional filter)

    // Apply filters
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where[Op.or] = [
        { orderId: { [Op.iLike]: `%${search}%` } },
        { productName: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count: total, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: User, as: 'assignedEmployeeUser', attributes: ['id', 'fullName', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

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

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Get single order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 */
// @route   GET /api/orders/:orderId
// @desc    Get single order
// @access  Private
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Try to find by UUID first, then by custom orderId
    let where = {};
    
    // Check if it's a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(orderId)) {
      where.id = orderId;
    } else {
      where.orderId = orderId;
    }
    
    // Users can only see their own orders
    if (req.user.role === 'user') {
      where.userId = req.user.id;
    }

    const order = await Order.findOne({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone', 'profileImage'] },
        { model: User, as: 'assignedEmployeeUser', attributes: ['id', 'fullName', 'email'] }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

/**
 * @swagger
 * /orders/{orderId}:
 *   put:
 *     summary: Update order (Admin/Super Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, approved, purchased, warehouse, shipped, delivered, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
// @route   PUT /api/orders/:orderId
// @desc    Update order
// @access  Private (Admin/Super Admin)
router.put('/:orderId', authenticateToken, requireRole(['admin', 'super_admin']), validateOrderUpdate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    // Try to find by UUID first, then by custom orderId
    let where = {};
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(orderId)) {
      where.id = orderId;
    } else {
      where.orderId = orderId;
    }

    const order = await Order.findOne({ where });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Track status changes
    const oldStatus = order.status;
    
    // Prepare update data
    const updateData = { ...updates };
    delete updateData.stageHistory; // Don't update stageHistory directly

    // Add stage history entry if status changed
    if (updates.status && updates.status !== oldStatus) {
      const stageHistory = order.stageHistory || [];
      stageHistory.push({
        stage: updates.status,
        timestamp: new Date(),
        updatedBy: req.user.id,
        notes: updates.notes || `Status updated to ${updates.status}`
      });
      updateData.stageHistory = stageHistory;
    }

    // Set assigned employee if not set
    if (!order.assignedEmployeeId && req.user.role === 'admin') {
      updateData.assignedEmployeeId = req.user.id;
    }

    await order.update(updateData);
    
    // Reload with associations
    await order.reload({
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
        { model: User, as: 'assignedEmployeeUser', attributes: ['id', 'fullName', 'email'] }
      ]
    });

    // Create notification if status changed
    if (updates.status && updates.status !== oldStatus) {
      const io = req.app.get('io');
      await createOrderNotification(order, 'status_changed', io);
    }

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

    // Try to find by UUID first, then by custom orderId
    let where = {};
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(orderId)) {
      where.id = orderId;
    } else {
      where.orderId = orderId;
    }

    const order = await Order.findOne({ where });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const notes = order.notes || [];
    notes.push({
      text: text.trim(),
      createdBy: req.user.id,
      createdAt: new Date()
    });

    await order.update({ notes });

    res.json({
      message: 'Note added successfully',
      note: notes[notes.length - 1]
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

    // Try to find by UUID first, then by custom orderId
    let where = {};
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(orderId)) {
      where.id = orderId;
    } else {
      where.orderId = orderId;
    }

    const order = await Order.findOne({ where });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    const stageHistory = order.stageHistory || [];
    stageHistory.push({
      stage: status,
      timestamp: new Date(),
      updatedBy: req.user.id,
      notes: `Status updated from ${oldStatus} to ${status}`
    });

    await order.update({ status, stageHistory });
    await order.reload({
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }]
    });

    // Create notification for status change
    const io = req.app.get('io');
    await createOrderNotification(order, 'status_changed', io);

    res.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

/**
 * @swagger
 * /orders/{orderId}:
 *   delete:
 *     summary: Cancel or delete order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled/deleted successfully
 *       404:
 *         description: Order not found
 */
// @route   DELETE /api/orders/:orderId
// @desc    Cancel/Delete order
// @access  Private
router.delete('/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Try to find by UUID first, then by custom orderId
    let where = {};
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(orderId)) {
      where.id = orderId;
    } else {
      where.orderId = orderId;
    }
    
    // Users can only cancel their own pending orders
    if (req.user.role === 'user') {
      where.userId = req.user.id;
      where.status = 'pending';
    }

    const order = await Order.findOne({ where });
    
    if (!order) {
      return res.status(404).json({ 
        message: req.user.role === 'user' 
          ? 'Order not found or cannot be cancelled' 
          : 'Order not found' 
      });
    }

    if (req.user.role === 'user') {
      // Users can only cancel pending orders
      const stageHistory = order.stageHistory || [];
      stageHistory.push({
        stage: 'cancelled',
        timestamp: new Date(),
        notes: 'Order cancelled by customer'
      });
      
      await order.update({ status: 'cancelled', stageHistory });
      await order.reload({
        include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }]
      });

      // Create notification for cancellation
      const io = req.app.get('io');
      await createOrderNotification(order, 'cancelled', io);
      
      res.json({ message: 'Order cancelled successfully' });
    } else {
      // Admins can delete orders
      await order.destroy();
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
    const { sequelize } = require('../models');
    
    // Get status stats
    const statusStats = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.cast(sequelize.col('final_amount'), 'DECIMAL')), 'totalValue']
      ],
      group: ['status'],
      raw: true
    });

    const recentOrders = await Order.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Get monthly stats for last 12 months
    const monthlyStats = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.cast(sequelize.col('final_amount'), 'DECIMAL')), 'revenue']
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
        }
      },
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      statusStats,
      recentOrders,
      monthlyStats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

module.exports = router;
