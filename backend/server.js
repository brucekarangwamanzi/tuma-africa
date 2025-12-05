const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
// Load .env from backend directory (works whether running from root or backend)
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Trust proxy for rate limiting (required when behind reverse proxy)
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : 'loopback');

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX || 500, // Increased from 100 to 500 for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for public endpoints and notification endpoints in development
    if (process.env.NODE_ENV !== 'production') {
      return req.path.includes('/public/') || 
             req.path.includes('/products') ||
             req.path.includes('/notifications/unread-count') ||
             req.path.includes('/orders'); // Allow frequent requests to orders in development
    }
    return false;
  }
});
app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.FRONTEND_URL
    ].filter(Boolean)
  : [
      'http://localhost:3000',
      'http://192.168.43.98:3000',
      'http://192.168.0.246:3000',
      /^http:\/\/192\.168\.\d+\.\d+:3000$/, // Allow any local network IP
      /^http:\/\/10\.\d+\.\d+\.\d+:3000$/, // Allow 10.x.x.x network
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/ // Allow 172.16-31.x.x network
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  // Log request body for POST/PUT/PATCH (except sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
    const bodyToLog = { ...req.body };
    // Hide sensitive fields
    if (bodyToLog.password) bodyToLog.password = '***';
    if (bodyToLog.passwordHash) bodyToLog.passwordHash = '***';
    if (bodyToLog.refreshToken) bodyToLog.refreshToken = '***';
    if (bodyToLog.accessToken) bodyToLog.accessToken = '***';
    
    console.log(`[${timestamp}] Request Body:`, JSON.stringify(bodyToLog, null, 2));
  }
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 200 && statusCode < 300 ? '✅' : 
                       statusCode >= 400 && statusCode < 500 ? '⚠️' : 
                       statusCode >= 500 ? '❌' : 'ℹ️';
    
    console.log(`[${timestamp}] ${statusEmoji} ${method} ${url} - Status: ${statusCode}`);
    
    return originalSend.call(this, data);
  };
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger API Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Tuma-Africa API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
}));

// Database connection - PostgreSQL
const { sequelize, testConnection } = require('./config/database');
const models = require('./models');

// Initialize database connection
(async () => {
  try {
    const connected = await testConnection();
    if (connected) {
      // Skip auto-sync - use migrations instead
      // Run: npx sequelize-cli db:migrate
      console.log('✅ Database connected');
      console.log('💡 To create tables, run: cd backend && npx sequelize-cli db:migrate');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('⚠️  Server will continue but database features may not work');
  }
})();

// Health check endpoint (must be before other routes)
app.use('/api', require('./health'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/products', require('./routes/products'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/public', require('./routes/public'));
app.use('/api/notifications', require('./routes/notifications'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for mobile access
const server = app.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 BACKEND SERVER STARTED');
  console.log('='.repeat(60));
  console.log(`📡 Server running on ${HOST}:${PORT}`);
  console.log(`🌐 Local access: http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.0.246:${PORT}`);
  console.log(`📚 Swagger API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(60));
  console.log('📋 Available Endpoints:');
  console.log('   - POST /api/auth/login');
  console.log('   - POST /api/auth/register');
  console.log('   - GET  /api/products');
  console.log('   - POST /api/products (Super Admin)');
  console.log('   - GET  /api/orders');
  console.log('   - POST /api/orders');
  console.log('   - ... and more');
  console.log('='.repeat(60) + '\n');
});

// Make io accessible to routes
app.set('io', null); // Will be set after io initialization

// Socket.IO setup with enhanced configuration
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          process.env.FRONTEND_URL
        ].filter(Boolean)
      : [
          'http://localhost:3000',
          'http://192.168.43.98:3000',
          'http://192.168.0.246:3000',
          /^http:\/\/192\.168\.\d+\.\d+:3000$/,
          /^http:\/\/10\.\d+\.\d+\.\d+:3000$/,
          /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:3000$/
        ],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
const { Chat, User, Message, ChatParticipants } = require('./models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { createMessageNotification } = require('./utils/notifications');

// Authentication middleware for Socket.IO
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    socket.userId = decoded.id || decoded.userId; // Support both id and userId from token
    socket.userRole = decoded.role;
    
    // Get user details using Sequelize
    const user = await User.findByPk(socket.userId, {
      attributes: ['id', 'fullName', 'email', 'role']
    });
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    socket.userName = user.fullName;
    socket.userEmail = user.email;
    
    next();
  } catch (err) {
    console.error('Socket auth error:', err.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Store active connections
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.userName} (${socket.userRole}) - Socket ID: ${socket.id}`);
  
  // Store active user
  activeUsers.set(socket.userId, {
    socketId: socket.id,
    userName: socket.userName,
    userRole: socket.userRole,
    connectedAt: new Date()
  });
  
  // Join user's personal room
  socket.join(`user:${socket.userId}`);
  
  // Join role-based rooms
  if (socket.userRole === 'admin' || socket.userRole === 'super_admin') {
    socket.join('admins');
    console.log(`Admin ${socket.userName} joined admins room`);
  } else {
    socket.join('users');
    console.log(`User ${socket.userName} joined users room`);
  }
  
  // Notify user is online
  socket.on('user:online', (data) => {
    console.log(`User ${socket.userName} is online`);
    socket.broadcast.emit('user:status', {
      userId: socket.userId,
      status: 'online'
    });
  });
  
  // Handle new message - Enhanced with better persistence
  socket.on('message:send', async (data) => {
    let chat = null;
    let savedMessage = null;
    
    try {
      const { chatId, message } = data;
      console.log(`📨 Message from ${socket.userName}:`, message.content?.substring(0, 50));
      
      // Validate message data
      if (!message || (!message.content && !message.fileUrl)) {
        socket.emit('error', { message: 'Message content or file is required' });
        return;
      }
      
      // Find or create chat - Enhanced logic using Sequelize
      if (chatId) {
        chat = await Chat.findByPk(chatId, {
          include: [
            { model: User, as: 'participants', attributes: ['id', 'fullName', 'email', 'role'] },
            { model: Message, as: 'messages', limit: 1, order: [['createdAt', 'DESC']] }
          ]
        });
      }
      
      if (!chat) {
        // Try to find existing support chat for this user using Sequelize
        const userChats = await Chat.findAll({
          where: { chatType: 'support' },
          include: [{
            model: User,
            as: 'participants',
            where: { id: socket.userId },
            attributes: ['id']
          }]
        });
        
        if (userChats.length > 0) {
          chat = userChats[0];
          // Reload with full data
          chat = await Chat.findByPk(chat.id, {
            include: [
              { model: User, as: 'participants', attributes: ['id', 'fullName', 'email', 'role'] }
            ]
          });
        } else {
          // Create new chat if doesn't exist
          const admin = await User.findOne({ 
            where: { 
              role: { [Op.in]: ['admin', 'super_admin'] }, 
              isActive: true 
            },
            order: [['createdAt', 'ASC']] // Get first admin
          });
          
          // Create chat
          chat = await Chat.create({
            chatType: 'support',
            title: `Support Chat - ${socket.userName}`,
            status: 'open',
            priority: 'medium'
          });
          
          // Add participants using Sequelize association
          await chat.addParticipants([socket.userId]);
          if (admin) {
            await chat.addParticipants([admin.id]);
          }
          
          // Reload with participants
          chat = await Chat.findByPk(chat.id, {
            include: [
              { model: User, as: 'participants', attributes: ['id', 'fullName', 'email', 'role'] }
            ]
          });
          
          console.log(`✅ Created new chat ${chat.id} for ${socket.userName}`);
        }
      } else {
        // Ensure current user is in participants
        const participants = chat.participants || [];
        const userIdStr = socket.userId.toString();
        const isParticipant = participants.some(p => p.id.toString() === userIdStr);
        if (!isParticipant) {
          await chat.addParticipants([socket.userId]);
          // Reload to get updated participants
          chat = await Chat.findByPk(chat.id, {
            include: [
              { model: User, as: 'participants', attributes: ['id', 'fullName', 'email', 'role'] }
            ]
          });
          console.log(`➕ Added ${socket.userName} to chat participants`);
        }
      }
      
      // Create message using Message model
      savedMessage = await Message.create({
        chatId: chat.id,
        sender: socket.userId,
        type: message.type || 'text',
        text: message.content || '',
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        isRead: false
      });
      
      // Update chat last message info
      await chat.update({
        lastMessageText: message.content || (message.fileName ? `Sent a file: ${message.fileName}` : 'File attachment'),
        lastMessageCreatedAt: new Date(),
        lastMessageSender: socket.userId
      });
      
      // Update chat status if closed
      if (chat.status === 'closed') {
        await chat.update({ status: 'open' });
        chat.status = 'open';
      }
      
      console.log(`💾 Saved message ${savedMessage.id} to database in chat ${chat.id}`);
      
      if (!savedMessage || !savedMessage.id) {
        throw new Error('Failed to retrieve saved message');
      }
      
      // Prepare message data for emission
      const messageData = {
        chatId: chat.id.toString(),
        message: {
          id: savedMessage.id.toString(),
          senderId: socket.userId,
          senderName: socket.userName,
          senderRole: socket.userRole,
          content: savedMessage.text || '',
          type: savedMessage.type,
          fileUrl: savedMessage.fileUrl,
          fileName: savedMessage.fileName,
          fileSize: savedMessage.fileSize,
          timestamp: savedMessage.createdAt.toISOString(),
          status: 'sent'
        }
      };
      
      // Emit to sender (confirmation) - Only after successful save
      socket.emit('message:new', messageData);
      console.log(`📤 Confirmed message ${savedMessage.id} to sender`);
      
      // Emit to all participants except sender - Target specific users in the chat
      const participants = chat.participants || [];
      const userIdStr = socket.userId.toString();
      participants.forEach(participant => {
        const participantId = participant.id.toString();
        if (participantId !== userIdStr) {
          // Emit to specific user
          io.to(`user:${participantId}`).emit('message:new', messageData);
          console.log(`📤 Sent message to participant ${participantId}`);
        }
      });
      
      // Also notify admins if sender is a regular user (for admin dashboard)
      if (socket.userRole !== 'admin' && socket.userRole !== 'super_admin') {
        io.to('admins').emit('message:new', messageData);
        console.log(`📢 Notified all admins about message from ${socket.userName}`);
      }
      // Note: When admin sends message, we already notified specific participants above
      // No need to broadcast to all users - only notify the specific user in the chat

      // Create notifications for message (non-blocking)
      try {
        const sender = await User.findByPk(socket.userId, {
          attributes: ['id', 'fullName', 'email', 'role']
        });
        if (sender) {
          // Chat already has participants loaded from include above
          // Create notifications for all participants except sender
          const notifications = await createMessageNotification(chat, savedMessage, sender, io);
          console.log(`📧 Created ${notifications.length} notification(s) for message`);
          
          // Log notification details for debugging
          if (notifications.length > 0) {
            notifications.forEach(notif => {
              console.log(`  → Notification for user ${notif.userId}: ${notif.title}`);
            });
          } else {
            console.warn(`⚠️ No notifications created. Chat has ${participants.length} participants, sender is ${sender.id}`);
          }
        }
      } catch (notifError) {
        // Don't fail message send if notification fails, but log the error
        console.error('⚠️ Failed to create message notification (non-critical):', notifError.message);
        console.error('Notification error stack:', notifError.stack);
      }
      
    } catch (error) {
      console.error('❌ Socket message error:', error);
      console.error('Error stack:', error.stack);
      
      // Try to save message to a recovery queue or log for manual processing
      if (chat && savedMessage) {
        console.error(`⚠️ Message may be lost! Chat: ${chat.id}, Message content: ${savedMessage.text?.substring(0, 50)}`);
      }
      
      socket.emit('error', { 
        message: 'Failed to send message. Please try again.', 
        error: error.message 
      });
    }
  });
  
  // Handle typing indicator
  socket.on('user:typing:start', async (data) => {
    try {
      const { chatId } = data;
      const chat = await Chat.findByPk(chatId, {
        include: [{ model: User, as: 'participants', attributes: ['id'] }]
      });
      
      if (chat && chat.participants) {
        // Notify other participants
        chat.participants.forEach(participant => {
          const participantId = participant.id.toString();
          if (participantId !== socket.userId.toString()) {
            io.to(`user:${participantId}`).emit('user:typing', {
              chatId,
              userId: socket.userId,
              userName: socket.userName,
              isTyping: true
            });
          }
        });
        
        // Also notify admins if user is typing
        if (socket.userRole !== 'admin' && socket.userRole !== 'super_admin') {
          io.to('admins').emit('user:typing', {
            chatId,
            userId: socket.userId,
            userName: socket.userName,
            isTyping: true
          });
        }
      }
    } catch (error) {
      console.error('Typing indicator error:', error);
    }
  });
  
  socket.on('user:typing:stop', async (data) => {
    try {
      const { chatId } = data;
      const chat = await Chat.findByPk(chatId, {
        include: [{ model: User, as: 'participants', attributes: ['id'] }]
      });
      
      if (chat && chat.participants) {
        // Notify other participants
        chat.participants.forEach(participant => {
          const participantId = participant.id.toString();
          if (participantId !== socket.userId.toString()) {
            io.to(`user:${participantId}`).emit('user:typing', {
              chatId,
              userId: socket.userId,
              userName: socket.userName,
              isTyping: false
            });
          }
        });
        
        // Also notify admins
        if (socket.userRole !== 'admin' && socket.userRole !== 'super_admin') {
          io.to('admins').emit('user:typing', {
            chatId,
            userId: socket.userId,
            userName: socket.userName,
            isTyping: false
          });
        }
      }
    } catch (error) {
      console.error('Typing indicator error:', error);
    }
  });
  
  // Handle message read
  socket.on('message:read', async (data) => {
    try {
      const { chatId, messageId } = data;
      const { Message } = require('./models');
      const message = await Message.findByPk(messageId);
      
      if (message && message.chatId.toString() === chatId) {
        await message.update({
          isRead: true,
          readAt: new Date()
        });
        
        // Notify sender
        io.to(`user:${message.sender}`).emit('message:read', {
          chatId,
          messageId,
          readBy: socket.userId,
          readAt: new Date()
        });
        
        console.log(`✓ Message ${messageId} marked as read by ${socket.userName}`);
      }
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`❌ User disconnected: ${socket.userName} - Reason: ${reason}`);
    
    // Remove from active users
    activeUsers.delete(socket.userId);
    
    // Notify others user is offline
    socket.broadcast.emit('user:status', {
      userId: socket.userId,
      status: 'offline'
    });
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.userName}:`, error);
  });
});

// Endpoint to get active users (for admin)
app.get('/api/socket/active-users', (req, res) => {
  const users = Array.from(activeUsers.entries()).map(([userId, data]) => ({
    userId,
    ...data
  }));
  res.json({ activeUsers: users, count: users.length });
});

console.log('✅ Socket.IO initialized successfully');

module.exports = { app, server, io };