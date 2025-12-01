const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
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

// @route   GET /api/chat/messages
// @desc    Get user's chat messages (simplified for support chat)
// @access  Private
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    
    if (isAdmin) {
      // Admin view: Get all support chats
      const chats = await Chat.find({
        chatType: 'support'
      }).populate('participants', 'fullName email role');

      // Collect all messages from all chats with proper sender info
      const allMessages = [];
      
      for (const chat of chats) {
        for (const msg of chat.messages) {
          const sender = chat.participants.find(p => p._id.toString() === msg.sender?.toString());
          
          allMessages.push({
            id: msg._id.toString(),
            senderId: msg.sender?.toString() || 'unknown',
            senderName: sender?.fullName || 'Unknown',
            senderRole: sender?.role || 'user',
            content: msg.text || '',
            type: msg.type || 'text',
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            fileSize: msg.fileSize,
            timestamp: msg.createdAt,
            status: msg.isRead ? 'read' : 'delivered',
            chatId: chat._id.toString()
          });
        }
      }

      // Sort by timestamp
      allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      res.json({
        messages: allMessages,
        chatId: chats[0]?._id || null
      });

    } else {
      // User view: Get their support chat - Enhanced to ensure we find the correct chat
      // Try multiple queries to find the user's chat
      let chat = await Chat.findOne({
        participants: req.user._id,
        chatType: 'support'
      }).populate('participants', 'fullName email role');

      // If not found, try finding by user ID in participants array (more reliable)
      if (!chat) {
        chat = await Chat.findOne({
          'participants': { $in: [req.user._id] },
          chatType: 'support'
        }).populate('participants', 'fullName email role');
      }

      // If still not found, try to find any chat where user is a participant
      if (!chat) {
        const allChats = await Chat.find({
          chatType: 'support'
        }).populate('participants', 'fullName email role');
        
        chat = allChats.find(c => 
          c.participants.some(p => p._id.toString() === req.user._id.toString())
        );
      }

      if (!chat) {
        // Only create new chat if absolutely no chat exists for this user
        const admin = await User.findOne({ 
          role: { $in: ['admin', 'super_admin'] }, 
          isActive: true 
        }).sort({ createdAt: 1 }); // Get first admin
        
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
        await chat.populate('participants', 'fullName email role');
        console.log(`✅ Created new support chat ${chat._id} for user ${req.user._id}`);
      } else {
        console.log(`✅ Found existing chat ${chat._id} with ${chat.messages.length} messages for user ${req.user._id}`);
      }

      // Ensure user is in participants (safety check)
      const userIdStr = req.user._id.toString();
      const isParticipant = chat.participants.some(p => p._id.toString() === userIdStr);
      if (!isParticipant) {
        chat.participants.push(req.user._id);
        await chat.save();
        await chat.populate('participants', 'fullName email role');
        console.log(`➕ Added user ${req.user._id} to chat ${chat._id} participants`);
      }

      // Format messages for frontend with proper sender info - Include fileSize
      // Sort messages by timestamp to ensure correct order
      const sortedMessages = [...chat.messages].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const messages = sortedMessages.map(msg => {
        const sender = chat.participants.find(p => p._id.toString() === msg.sender?.toString());
        
        return {
          id: msg._id.toString(),
          senderId: msg.sender?.toString() || req.user._id.toString(),
          senderName: sender?.fullName || (msg.sender?.toString() === req.user._id.toString() ? req.user.fullName : 'Support'),
          senderRole: sender?.role || (msg.sender?.toString() === req.user._id.toString() ? req.user.role : 'admin'),
          content: msg.text || '',
          type: msg.type || 'text',
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          fileSize: msg.fileSize,
          timestamp: msg.createdAt,
          status: msg.isRead ? 'read' : 'delivered'
        };
      });

      console.log(`📨 Returning ${messages.length} messages for user ${req.user._id} from chat ${chat._id}`);

      res.json({
        messages,
        chatId: chat._id.toString()
      });
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
    const skip = (page - 1) * limit;
    
    const { status, priority, assigned } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assigned === 'true') query.assignedTo = req.user._id;
    if (assigned === 'false') query.assignedTo = { $exists: false };

    const chats = await Chat.find(query)
      .populate('participants', 'fullName email role profileImage')
      .populate('orderId', 'orderId productName status')
      .populate('assignedTo', 'fullName email')
      .populate('lastMessage.sender', 'fullName')
      .sort({ 'lastMessage.createdAt': -1 })
      .skip(skip)
      .limit(limit);

    const total = await Chat.countDocuments(query);

    // Get chat statistics
    const stats = await Chat.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

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

    const chat = await Chat.findByIdAndDelete(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

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