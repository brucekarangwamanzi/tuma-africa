const express = require('express');
const { Op } = require('sequelize');
const { Chat, User, Message, ChatParticipants, Order } = require('../models');
const { authenticateToken, requireRole, requireApproval } = require('../middleware/auth');
const { validateChatMessage, validatePagination } = require('../middleware/validation');
const { createMessageNotification } = require('../utils/notifications');

const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chat/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, documents, and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

/**
 * @swagger
 * /chat/messages:
 *   post:
 *     summary: Send a chat message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, file, image]
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 */
// @route   POST /api/chat/messages
// @desc    Send a message (simplified for support chat)
// @access  Private
router.post('/messages', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    
    // Find or create user's support chat
    let chat = await Chat.findOne({
      participants: req.user._id,
      chatType: 'support'
    });

    if (!chat) {
      // Create new support chat
      const admin = await require('../models/User').findOne({ 
        role: { $in: ['admin', 'super_admin'] }, 
        isActive: true 
      });
      
      const participants = [req.user._id];
      if (admin) participants.push(admin._id);

      chat = new Chat({
        participants,
        chatType: 'support',
        title: 'Support Chat',
        status: 'open',
        priority: 'medium',
        messages: []
      });
    }

    // Create message
    const message = {
      sender: req.user._id,
      type,
      text: content?.trim() || '',
      fileUrl: req.file ? `/uploads/chat/${req.file.filename}` : undefined,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      createdAt: new Date(),
      isRead: false
    };

    chat.messages.push(message);
    chat.status = 'open';
    await chat.save();

    // Format response
    const createdMessage = chat.messages[chat.messages.length - 1];
    const formattedMessage = {
      id: createdMessage._id.toString(),
      senderId: req.user._id.toString(),
      senderName: req.user.fullName,
      senderRole: req.user.role,
      content: createdMessage.text || '',
      type: createdMessage.type || 'text',
      fileUrl: createdMessage.fileUrl,
      fileName: createdMessage.fileName,
      timestamp: createdMessage.createdAt,
      status: 'sent'
    };

    res.json({
      message: formattedMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

/**
 * @swagger
 * /chat/messages:
 *   get:
 *     summary: Get chat messages
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                 chats:
 *                   type: array
 */
// @route   GET /api/chat/messages
// @desc    Get user's chat messages (simplified for support chat)
// @access  Private
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    
    if (isAdmin) {
      // Admin view: Get all support chats
      const chats = await Chat.findAll({
        where: { chatType: 'support' },
        include: [
          {
            model: User,
            as: 'participants',
            attributes: ['id', 'fullName', 'email', 'role'],
            through: { attributes: [] }
          }
        ]
      });

      // Collect all messages from all chats with proper sender info
      const allMessages = [];
      
      for (const chat of chats) {
        const messages = await Message.findAll({
          where: { chatId: chat.id },
          include: [
            {
              model: User,
              as: 'senderUser',
              attributes: ['id', 'fullName', 'email', 'role']
            }
          ],
          order: [['createdAt', 'ASC']]
        });
        
        for (const msg of messages) {
          const sender = msg.senderUser;
          
          allMessages.push({
            id: msg.id,
            senderId: msg.sender || 'unknown',
            senderName: sender?.fullName || 'Unknown',
            senderRole: sender?.role || 'user',
            content: msg.text || '',
            type: msg.type || 'text',
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            timestamp: msg.createdAt,
            status: msg.isRead ? 'read' : 'delivered',
            chatId: chat.id
          });
        }
      }

      // Sort by timestamp
      allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // For admin view, return the first chat ID or create a default chat if none exists
      let chatId = chats[0]?.id || null;
      
      // If no chats exist and we have messages, we need to handle this case
      // But typically admins should see all chats, so this shouldn't happen
      if (!chatId && allMessages.length > 0) {
        // Get chat ID from first message
        chatId = allMessages[0].chatId || null;
      }

      res.json({
        messages: allMessages,
        chatId: chatId
      });

    } else {
      // User view: Get their support chat
      // Find chat where user is a participant using the many-to-many relationship
      const chats = await Chat.findAll({
        where: { chatType: 'support' },
        include: [
          {
            model: User,
            as: 'participants',
            where: { id: req.user.id },
            attributes: ['id', 'fullName', 'email', 'role'],
            through: { attributes: [] },
            required: true
          }
        ]
      });

      let chat = chats[0];

      if (!chat) {
        // Create new support chat if none exists
        const admin = await User.findOne({ 
          where: { 
            role: { [Op.in]: ['admin', 'super_admin'] }, 
            isActive: true 
          },
          order: [['createdAt', 'ASC']]
        });
        
        chat = await Chat.create({
          chatType: 'support',
          title: `Support Chat - ${req.user.fullName}`,
          status: 'open',
          priority: 'medium'
        });

        // Add user as participant (Sequelize uses plural method name for belongsToMany)
        // The method name is based on the alias 'participants', so it's addParticipants
        // It accepts an array of IDs or a single ID
        try {
          await chat.addParticipants(req.user.id);
          console.log(`✅ Added user ${req.user.id} as participant to chat ${chat.id}`);
        } catch (participantError) {
          console.error('Error adding user as participant:', participantError);
          // Try alternative method if addParticipants fails
          try {
            const { ChatParticipants } = require('../models');
            await ChatParticipants.create({
              chatId: chat.id,
              userId: req.user.id
            });
            console.log(`✅ Added user ${req.user.id} as participant via direct create`);
          } catch (createError) {
            console.error('Error creating participant directly:', createError);
            // Continue anyway - chat is created
          }
        }
        
        // Add admin as participant if found
        if (admin) {
          try {
            await chat.addParticipants(admin.id);
            console.log(`✅ Added admin ${admin.id} as participant to chat ${chat.id}`);
          } catch (participantError) {
            console.error('Error adding admin as participant:', participantError);
            // Try alternative method
            try {
              const { ChatParticipants } = require('../models');
              await ChatParticipants.create({
                chatId: chat.id,
                userId: admin.id
              });
              console.log(`✅ Added admin ${admin.id} as participant via direct create`);
            } catch (createError) {
              console.error('Error creating admin participant directly:', createError);
            }
          }
        }

        // Reload with participants to ensure we have the full chat object
        await chat.reload({
          include: [
            {
              model: User,
              as: 'participants',
              attributes: ['id', 'fullName', 'email', 'role'],
              through: { attributes: [] }
            }
          ]
        });
        
        console.log(`✅ Created new support chat ${chat.id} for user ${req.user.id} with ${chat.participants?.length || 0} participants`);
      } else {
        // Reload with participants
        await chat.reload({
          include: [
            {
              model: User,
              as: 'participants',
              attributes: ['id', 'fullName', 'email', 'role'],
              through: { attributes: [] }
            }
          ]
        });
        console.log(`✅ Found existing chat ${chat.id} for user ${req.user.id}`);
      }

      // Get messages for this chat
      const messages = await Message.findAll({
        where: { chatId: chat.id },
        include: [
          {
            model: User,
            as: 'senderUser',
            attributes: ['id', 'fullName', 'email', 'role']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      // Format messages for frontend
      const formattedMessages = messages.map(msg => {
        const sender = msg.senderUser;
        
        return {
          id: msg.id,
          senderId: msg.sender || req.user.id,
          senderName: sender?.fullName || (msg.sender === req.user.id ? req.user.fullName : 'Support'),
          senderRole: sender?.role || (msg.sender === req.user.id ? req.user.role : 'admin'),
          content: msg.text || '',
          type: msg.type || 'text',
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          timestamp: msg.createdAt,
          status: msg.isRead ? 'read' : 'delivered'
        };
      });

      // Ensure chatId is always returned
      if (!chat || !chat.id) {
        console.error('⚠️ Chat created but ID is missing!', { chat: chat ? { ...chat.toJSON(), id: chat.id } : null });
        return res.status(500).json({ message: 'Failed to create or retrieve chat' });
      }

      console.log(`📨 Returning ${formattedMessages.length} messages for user ${req.user.id} from chat ${chat.id}`);

      const response = {
        messages: formattedMessages,
        chatId: chat.id
      };
      
      console.log(`📤 Response chatId: ${response.chatId}, messages count: ${response.messages.length}`);
      
      res.json(response);
    }

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// @route   PUT /api/chat/messages/read-all
// @desc    Mark all messages as read
// @access  Private
router.put('/messages/read-all', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      participants: req.user._id,
      chatType: 'support'
    });

    if (!chat) {
      return res.json({ message: 'No chat found' });
    }

    // Mark all messages as read
    chat.messages.forEach(msg => {
      if (!msg.isRead) {
        msg.isRead = true;
        msg.readAt = new Date();
      }
    });

    await chat.save();

    res.json({ message: 'All messages marked as read' });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

// @route   GET /api/chat/:chatId/export
// @desc    Export chat history
// @access  Private (Admin/Super Admin)
router.get('/:chatId/export', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findById(chatId)
      .populate('participants', 'fullName email role')
      .populate('orderId', 'orderId productName');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Format chat data for export
    const exportData = {
      chatId: chat._id,
      title: chat.title,
      chatType: chat.chatType,
      status: chat.status,
      priority: chat.priority,
      participants: chat.participants.map(p => ({
        name: p.fullName,
        email: p.email,
        role: p.role
      })),
      order: chat.orderId ? {
        orderId: chat.orderId.orderId,
        productName: chat.orderId.productName
      } : null,
      messages: chat.messages.map(msg => ({
        type: msg.type,
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.createdAt,
        isRead: msg.isRead
      })),
      createdAt: chat.createdAt,
      exportedAt: new Date(),
      exportedBy: req.user.fullName
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=chat-${chatId}-${Date.now()}.json`);
    res.json(exportData);

  } catch (error) {
    console.error('Export chat error:', error);
    res.status(500).json({ message: 'Failed to export chat' });
  }
});

// @route   GET /api/chat
// @desc    Get user's chats
// @access  Private
router.get('/', authenticateToken, requireApproval, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const { status, priority } = req.query;
    
    let query = { participants: req.user._id };
    
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const chats = await Chat.find(query)
      .populate('participants', 'fullName email role profileImage')
      .populate('orderId', 'orderId productName status')
      .populate('lastMessage.sender', 'fullName')
      .sort({ 'lastMessage.createdAt': -1 })
      .skip(skip)
      .limit(limit);

    const total = await Chat.countDocuments(query);

    res.json({
      chats,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
});

// @route   POST /api/chat
// @desc    Create new chat or get existing one
// @access  Private
router.post('/', authenticateToken, requireApproval, async (req, res) => {
  try {
    const { orderId, title, message } = req.body;
    
    // Check if chat already exists for this order
    let chat;
    if (orderId) {
      chat = await Chat.findOne({ 
        orderId, 
        participants: req.user._id 
      });
    }

    if (!chat) {
      // Create new chat
      const participants = [req.user._id];
      
      // Add admin to chat (find first available admin)
      const admin = await require('../models/User').findOne({ 
        role: { $in: ['admin', 'super_admin'] }, 
        isActive: true 
      });
      
      if (admin) {
        participants.push(admin._id);
      }

      chat = new Chat({
        participants,
        chatType: 'support',
        title: title || (orderId ? `Support for Order ${orderId}` : 'General Support'),
        orderId: orderId || undefined,
        status: 'open',
        priority: 'medium'
      });

      // Add initial message if provided
      if (message && message.trim()) {
        chat.messages.push({
          type: 'text',
          text: message.trim(),
          createdAt: new Date()
        });
      }

      await chat.save();
    }

    await chat.populate([
      { path: 'participants', select: 'fullName email role profileImage' },
      { path: 'orderId', select: 'orderId productName status' }
    ]);

    res.status(201).json({
      message: 'Chat created successfully',
      chat
    });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ 
      message: 'Failed to create chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/chat/:chatId
// @desc    Get chat messages
// @access  Private
router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    })
    .populate('participants', 'fullName email role profileImage')
    .populate('orderId', 'orderId productName status')
    .populate('assignedTo', 'fullName email');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Get paginated messages
    const totalMessages = chat.messages.length;
    const startIndex = Math.max(0, totalMessages - (page * limit));
    const endIndex = totalMessages - ((page - 1) * limit);
    
    const messages = chat.messages.slice(startIndex, endIndex);

    // Mark messages as read
    const unreadMessages = chat.messages.filter(
      msg => !msg.isRead && msg.createdAt > (req.user.lastLogin || new Date(0))
    );
    
    unreadMessages.forEach(msg => {
      msg.isRead = true;
      msg.readAt = new Date();
    });
    
    if (unreadMessages.length > 0) {
      await chat.save();
    }

    res.json({
      chat: {
        ...chat.toObject(),
        messages
      },
      pagination: {
        current: page,
        total: totalMessages,
        hasMore: startIndex > 0
      }
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Failed to fetch chat' });
  }
});

// @route   POST /api/chat/:chatId/messages
// @desc    Send message to chat
// @access  Private
router.post('/:chatId/messages', authenticateToken, validateChatMessage, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, type = 'text', fileUrl, fileName, fileSize } = req.body;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Create message
    const message = {
      sender: req.user._id,
      type,
      text: text?.trim(),
      fileUrl,
      fileName,
      fileSize,
      createdAt: new Date(),
      isRead: false
    };

    chat.messages.push(message);
    
    // Update chat status if closed
    if (chat.status === 'closed') {
      chat.status = 'open';
    }

    await chat.save();

    // Get the created message with populated data
    const createdMessage = chat.messages[chat.messages.length - 1];

    // Create notifications for message
    try {
      const sender = await User.findById(req.user._id).select('fullName email role');
      if (sender) {
        await chat.populate('participants', 'fullName email role');
        const io = req.app.get('io');
        const notifications = await createMessageNotification(chat, createdMessage, sender, io);
        console.log(`📧 Created ${notifications.length} notification(s) for HTTP message`);
      }
    } catch (notifError) {
      console.error('Failed to create message notification:', notifError);
      console.error('Notification error details:', notifError.stack);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: createdMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// @route   PUT /api/chat/:chatId/status
// @desc    Update chat status
// @access  Private (Admin/Super Admin)
router.put('/:chatId/status', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { chatId } = req.params;
    const { status, priority, assignedTo } = req.body;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Update fields
    if (status) chat.status = status;
    if (priority) chat.priority = priority;
    if (assignedTo) chat.assignedTo = assignedTo;

    // Add system message for status changes
    if (status && status !== chat.status) {
      chat.messages.push({
        type: 'system',
        text: `Chat status changed to ${status}`,
        createdAt: new Date()
      });
    }

    await chat.save();
    await chat.populate([
      { path: 'participants', select: 'fullName email role' },
      { path: 'assignedTo', select: 'fullName email' }
    ]);

    res.json({
      message: 'Chat updated successfully',
      chat
    });

  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({ message: 'Failed to update chat' });
  }
});

// @route   GET /api/chat/admin/all
// @desc    Get all chats for admin
// @access  Private (Admin/Super Admin)
router.get('/admin/all', authenticateToken, requireRole(['admin', 'super_admin']), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const { status, priority, assigned } = req.query;
    
    const where = {};
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigned === 'true') where.assignedToId = req.user.id;
    if (assigned === 'false') where.assignedToId = null;

    const { count: total, rows: chats } = await Chat.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          as: 'participants', 
          attributes: ['id', 'fullName', 'email', 'role', 'profileImage'],
          through: { attributes: [] } // Exclude junction table attributes
        },
        { 
          model: Order, 
          as: 'order', 
          attributes: ['id', 'orderId', 'productName', 'status'],
          required: false
        },
        { 
          model: User, 
          as: 'assignedUser', 
          attributes: ['id', 'fullName', 'email'],
          required: false
        },
        {
          model: Message,
          as: 'messages',
          attributes: ['id'],
          required: false,
          separate: true // Separate query for better performance
        }
      ],
      order: [['lastMessageCreatedAt', 'DESC NULLS LAST']],
      offset,
      limit,
      distinct: true // Important for counting with many-to-many relationships
    });

    // Get chat statistics using Sequelize
    const { sequelize } = require('../models');
    const statsResult = await Chat.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const stats = statsResult.map(stat => ({
      _id: stat.status,
      count: parseInt(stat.count) || 0
    }));

    res.json({
      chats,
      stats,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get admin chats error:', error);
    res.status(500).json({ message: 'Failed to fetch chats' });
  }
});

// @route   DELETE /api/chat/:chatId
// @desc    Delete chat
// @access  Private (Admin/Super Admin)
router.delete('/:chatId', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findByPk(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await chat.destroy();

    res.json({ message: 'Chat deleted successfully' });

  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Failed to delete chat' });
  }
});

// Duplicate route removed - using the main route at line 119

// @route   POST /api/chat/messages
// @desc    Send a new message (simplified)
// @access  Private
router.post('/messages', authenticateToken, requireApproval, upload.single('file'), async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    const file = req.file;

    // Find user's support chat - Enhanced to ensure chat exists
    let chat = await Chat.findOne({
      participants: req.user._id,
      chatType: 'support'
    });

    if (!chat) {
      // Create chat if it doesn't exist (safety net)
      const admin = await User.findOne({ 
        role: { $in: ['admin', 'super_admin'] }, 
        isActive: true 
      }).sort({ createdAt: 1 });
      
      const participants = [req.user._id];
      if (admin) participants.push(admin._id);
      
      chat = new Chat({
        participants,
        chatType: 'support',
        title: `Support Chat - ${req.user.fullName}`,
        status: 'open',
        priority: 'medium',
        messages: []
      });
      
      await chat.save();
      console.log(`✅ Created missing chat ${chat._id} for user ${req.user._id}`);
    }

    // Create message object - Include all fields
    const messageData = {
      sender: req.user._id,
      type: type,
      text: content || '',
      createdAt: new Date(),
      isRead: false
    };

    // Handle file upload - Include fileSize
    if (file) {
      messageData.fileUrl = `/uploads/chat/${file.filename}`;
      messageData.fileName = file.originalname;
      messageData.fileSize = file.size;
      messageData.type = 'file';
    }

    // Add message to chat
    chat.messages.push(messageData);
    
    // Update last message info
    chat.lastMessage = {
      sender: req.user._id,
      text: content || (file ? `Sent a file: ${file.originalname}` : ''),
      createdAt: new Date()
    };

    // Reopen chat if closed
    if (chat.status === 'closed') {
      chat.status = 'open';
    }

    // Save to database - CRITICAL: Ensure message is persisted
    await chat.save();
    console.log(`💾 Saved HTTP message to chat ${chat._id}`);

    // Get the created message
    const createdMessage = chat.messages[chat.messages.length - 1];
    
    // Transform message to match frontend expectations - Include fileSize
    const message = {
      id: createdMessage._id.toString(),
      senderId: req.user._id.toString(),
      senderName: req.user.fullName,
      senderRole: req.user.role,
      content: createdMessage.text || '',
      type: createdMessage.type || 'text',
      fileUrl: createdMessage.fileUrl,
      fileName: createdMessage.fileName,
      fileSize: createdMessage.fileSize,
      timestamp: createdMessage.createdAt.toISOString(),
      status: 'sent'
    };

    res.status(201).json({
      message: message,
      success: true
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// @route   PUT /api/chat/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const chat = await Chat.findOne({
      participants: req.user._id,
      'messages._id': messageId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Find and update the message
    const message = chat.messages.id(messageId);
    if (message) {
      message.isRead = true;
      message.readAt = new Date();
      await chat.save();
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
});

// @route   PUT /api/chat/messages/read-all
// @desc    Mark all messages as read
// @access  Private
router.put('/messages/read-all', authenticateToken, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      participants: req.user._id,
      chatType: 'support'
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Mark all messages as read
    chat.messages.forEach(message => {
      if (!message.isRead) {
        message.isRead = true;
        message.readAt = new Date();
      }
    });

    await chat.save();

    res.json({ success: true });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

// Duplicate route removed - using the main route at line 119

// @route   POST /api/chat/messages
// @desc    Send a message
// @access  Private
router.post('/messages', authenticateToken, requireApproval, upload.single('file'), async (req, res) => {
  try {
    const { content, type = 'text' } = req.body;
    
    if (!content && !req.file) {
      return res.status(400).json({ message: 'Message content or file is required' });
    }

    // Find or create user's support chat
    let chat = await Chat.findOne({ 
      participants: req.user._id,
      type: 'support' 
    });

    if (!chat) {
      chat = new Chat({
        participants: [req.user._id],
        type: 'support',
        title: 'Customer Support',
        status: 'active',
        priority: 'normal'
      });
      await chat.save();
    }

    // Create message object
    const message = {
      sender: req.user._id,
      content: content || '',
      type: type,
      status: 'sent',
      createdAt: new Date()
    };

    // Handle file upload
    if (req.file) {
      message.fileUrl = `/uploads/chat/${req.file.filename}`;
      message.fileName = req.file.originalname;
      message.type = 'file';
    }

    // Add message to chat
    chat.messages.push(message);
    chat.lastMessage = {
      content: message.content || `Sent a ${message.type}`,
      sender: req.user._id,
      createdAt: new Date()
    };
    chat.updatedAt = new Date();

    await chat.save();

    // Populate the new message
    await chat.populate('messages.sender', 'fullName email role');
    
    const newMessage = chat.messages[chat.messages.length - 1];

    res.status(201).json({
      message: newMessage,
      chatId: chat._id
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// @route   PUT /api/chat/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    const chat = await Chat.findOne({
      participants: req.user._id,
      'messages._id': messageId
    });

    if (!chat) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Update message status
    const message = chat.messages.id(messageId);
    if (message) {
      message.status = 'read';
      await chat.save();
    }

    res.json({ message: 'Message marked as read' });

  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Failed to mark message as read' });
  }
});

// @route   PUT /api/chat/messages/read-all
// @desc    Mark all messages as read
// @access  Private
router.put('/messages/read-all', authenticateToken, async (req, res) => {
  try {
    await Chat.updateMany(
      { participants: req.user._id },
      { $set: { 'messages.$[].status': 'read' } }
    );

    res.json({ message: 'All messages marked as read' });

  } catch (error) {
    console.error('Mark all messages as read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

// Admin routes for chat management
// @route   GET /api/admin/chat/sessions
// @desc    Get all chat sessions for admin
// @access  Private (Admin/Super Admin)
router.get('/admin/sessions', authenticateToken, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    
    let query = { type: 'support' };
    
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;

    const chats = await Chat.find(query)
      .populate('participants', 'fullName email role')
      .populate('lastMessage.sender', 'fullName')
      .sort({ updatedAt: -1 });

    // Transform data for admin interface
    const sessions = chats.map(chat => {
      const user = chat.participants.find(p => p.role === 'user');
      const unreadCount = chat.messages.filter(m => 
        m.sender.toString() === user?._id.toString() && m.status !== 'read'
      ).length;

      return {
        id: chat._id,
        userId: user?._id,
        userName: user?.fullName || 'Unknown User',
        userEmail: user?.email || '',
        lastMessage: chat.lastMessage?.content || 'No messages',
        lastMessageTime: chat.lastMessage?.createdAt || chat.createdAt,
        unreadCount,
        status: chat.status,
        priority: chat.priority,
        assignedTo: chat.assignedTo,
        tags: chat.tags || []
      };
    });

    // Filter by search if provided
    const filteredSessions = search 
      ? sessions.filter(session => 
          session.userName.toLowerCase().includes(search.toLowerCase()) ||
          session.userEmail.toLowerCase().includes(search.toLowerCase()) ||
          session.lastMessage.toLowerCase().includes(search.toLowerCase())
        )
      : sessions;

    res.json({ sessions: filteredSessions });

  } catch (error) {
    console.error('Get chat sessions error:', error);
    res.status(500).json({ message: 'Failed to fetch chat sessions' });
  }
});

module.exports = router;