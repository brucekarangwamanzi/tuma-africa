const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

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
             req.path.includes('/notifications/unread-count'); // Allow frequent polling of unread count
    }
    return false;
  }
});
app.use('/api/', limiter);

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://tuma-africa-frontend.onrender.com',
      'https://tuma-africa-backend.onrender.com',
      process.env.FRONTEND_URL,
      /^https:\/\/.*\.vercel\.app$/, // Allow all Vercel deployments
      /^https:\/\/.*\.railway\.app$/, // Allow Railway deployments
      /^https:\/\/.*\.onrender\.com$/ // Allow Render deployments
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

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tuma-africa-cargo', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

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
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.0.246:${PORT}`);
});

// Make io accessible to routes
app.set('io', null); // Will be set after io initialization

// Socket.IO setup with enhanced configuration
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          'https://tuma-africa-frontend.onrender.com',
          /^https:\/\/.*\.vercel\.app$/, // Allow all Vercel deployments
          /^https:\/\/.*\.railway\.app$/, // Allow Railway deployments
          /^https:\/\/.*\.onrender\.com$/, // Allow Render deployments
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
const Chat = require('./models/Chat');
const User = require('./models/User');
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
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    
    // Get user details
    const user = await User.findById(decoded.id).select('fullName email role');
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
      
      // Find or create chat - Enhanced logic
      if (chatId) {
        chat = await Chat.findById(chatId);
      }
      
      if (!chat) {
        // Try to find existing support chat for this user
        chat = await Chat.findOne({
          participants: socket.userId,
          chatType: 'support'
        });
        
        if (!chat) {
          // Create new chat if doesn't exist
          const admin = await User.findOne({ 
            role: { $in: ['admin', 'super_admin'] }, 
            isActive: true 
          }).sort({ createdAt: 1 }); // Get first admin
          
          const participants = [socket.userId];
          if (admin) {
            participants.push(admin._id);
          }
          
          chat = new Chat({
            participants,
            chatType: 'support',
            title: `Support Chat - ${socket.userName}`,
            status: 'open',
            priority: 'medium',
            messages: []
          });
          
          await chat.save();
          console.log(`✅ Created new chat ${chat._id} for ${socket.userName} with ${participants.length} participants`);
        } else {
          console.log(`✅ Found existing chat ${chat._id} for ${socket.userName}`);
        }
      }
      
      // Ensure current user is in participants
      const userIdStr = socket.userId.toString();
      const isParticipant = chat.participants.some(p => p.toString() === userIdStr);
      if (!isParticipant) {
        chat.participants.push(socket.userId);
        console.log(`➕ Added ${socket.userName} to chat participants`);
      }
      
      // Add message to chat - Include all fields
      const newMessage = {
        sender: socket.userId,
        type: message.type || 'text',
        text: message.content || '',
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize || (message.fileUrl ? undefined : undefined), // Include if provided
        createdAt: new Date(),
        isRead: false
      };
      
      chat.messages.push(newMessage);
      chat.lastMessage = {
        text: message.content || (message.fileName ? `Sent a file: ${message.fileName}` : 'File attachment'),
        createdAt: new Date(),
        sender: socket.userId
      };
      
      // Update chat status if closed
      if (chat.status === 'closed') {
        chat.status = 'open';
      }
      
      // Save to database - CRITICAL: Save before emitting
      await chat.save();
      console.log(`💾 Saved message to database in chat ${chat._id}`);
      
      // Reload chat to get the saved message with _id
      chat = await Chat.findById(chat._id);
      savedMessage = chat.messages[chat.messages.length - 1];
      
      if (!savedMessage || !savedMessage._id) {
        throw new Error('Failed to retrieve saved message');
      }
      
      // Prepare message data for emission
      const messageData = {
        chatId: chat._id.toString(),
        message: {
          id: savedMessage._id.toString(),
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
      console.log(`📤 Confirmed message ${savedMessage._id} to sender`);
      
      // Emit to all participants except sender
      const participantIds = chat.participants.map(p => p.toString());
      participantIds.forEach(participantId => {
        if (participantId !== userIdStr) {
          io.to(`user:${participantId}`).emit('message:new', messageData);
          console.log(`📤 Sent message to participant ${participantId}`);
        }
      });
      
      // Emit to all admins (if sender is not admin)
      if (socket.userRole !== 'admin' && socket.userRole !== 'super_admin') {
        io.to('admins').emit('message:new', messageData);
        console.log(`📢 Notified all admins about message from ${socket.userName}`);
      } else {
        // If admin sent message, notify all users in the chat
        io.to('users').emit('message:new', messageData);
        console.log(`📢 Notified users about message from admin ${socket.userName}`);
      }

      // Create notifications for message (non-blocking)
      try {
        const sender = await User.findById(socket.userId).select('fullName email role');
        if (sender) {
          // Ensure chat participants are populated
          if (!chat.populated('participants')) {
            await chat.populate('participants', 'fullName email role');
          }
          
          // Create notifications for all participants except sender
          const notifications = await createMessageNotification(chat, savedMessage, sender, io);
          console.log(`📧 Created ${notifications.length} notification(s) for message`);
        }
      } catch (notifError) {
        // Don't fail message send if notification fails
        console.error('⚠️ Failed to create message notification (non-critical):', notifError.message);
      }
      
    } catch (error) {
      console.error('❌ Socket message error:', error);
      console.error('Error stack:', error.stack);
      
      // Try to save message to a recovery queue or log for manual processing
      if (chat && savedMessage) {
        console.error(`⚠️ Message may be lost! Chat: ${chat._id}, Message content: ${savedMessage.text?.substring(0, 50)}`);
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
      const chat = await Chat.findById(chatId);
      
      if (chat) {
        // Notify other participants
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId) {
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
      const chat = await Chat.findById(chatId);
      
      if (chat) {
        // Notify other participants
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId) {
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
      const chat = await Chat.findById(chatId);
      
      if (chat) {
        const message = chat.messages.id(messageId);
        if (message) {
          message.isRead = true;
          message.readAt = new Date();
          await chat.save();
          
          // Notify sender
          io.to(`user:${message.sender}`).emit('message:read', {
            chatId,
            messageId,
            readBy: socket.userId,
            readAt: new Date()
          });
          
          console.log(`✓ Message ${messageId} marked as read by ${socket.userName}`);
        }
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