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
  max: process.env.RATE_LIMIT_MAX || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/products', require('./routes/products'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/public', require('./routes/public'));

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
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.IO setup
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000'],
    credentials: true
  }
});

// Socket.IO connection handling
const Chat = require('./models/Chat');
const jwt = require('jsonwebtoken');

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Join user's personal room
  socket.join(`user:${socket.userId}`);
  
  // Join admin room if user is admin
  if (socket.userRole === 'admin' || socket.userRole === 'super_admin') {
    socket.join('admins');
  }
  
  // Handle new message
  socket.on('message:send', async (data) => {
    try {
      const { chatId, message } = data;
      
      // Find or create chat
      let chat = await Chat.findById(chatId);
      if (!chat) {
        // Create new chat if doesn't exist
        const User = require('./models/User');
        const admin = await User.findOne({ 
          role: { $in: ['admin', 'super_admin'] }, 
          isActive: true 
        });
        
        chat = new Chat({
          participants: [socket.userId, admin?._id].filter(Boolean),
          chatType: 'support',
          title: 'Support Chat',
          status: 'open',
          priority: 'medium',
          messages: []
        });
      }
      
      // Add message to chat
      const newMessage = {
        sender: socket.userId,
        type: message.type || 'text',
        text: message.content,
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        createdAt: new Date(),
        isRead: false
      };
      
      chat.messages.push(newMessage);
      await chat.save();
      
      // Get the saved message
      const savedMessage = chat.messages[chat.messages.length - 1];
      
      // Get sender information
      const User = require('./models/User');
      const sender = await User.findById(socket.userId).select('fullName role');
      
      const messageData = {
        chatId: chat._id,
        message: {
          id: savedMessage._id,
          senderId: socket.userId,
          senderName: sender?.fullName || 'Unknown',
          senderRole: sender?.role || 'user',
          content: savedMessage.text,
          type: savedMessage.type,
          fileUrl: savedMessage.fileUrl,
          fileName: savedMessage.fileName,
          timestamp: savedMessage.createdAt,
          status: 'sent'
        }
      };
      
      // Emit to all participants
      chat.participants.forEach(participantId => {
        io.to(`user:${participantId}`).emit('message:new', messageData);
      });
      
      // Also emit to all admins
      io.to('admins').emit('message:new', messageData);
      
    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle typing indicator
  socket.on('user:typing:start', (data) => {
    const { chatId } = data;
    socket.to(`chat:${chatId}`).emit('user:typing', {
      userId: socket.userId,
      isTyping: true
    });
  });
  
  socket.on('user:typing:stop', (data) => {
    const { chatId } = data;
    socket.to(`chat:${chatId}`).emit('user:typing', {
      userId: socket.userId,
      isTyping: false
    });
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
            messageId
          });
        }
      }
    } catch (error) {
      console.error('Mark read error:', error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

module.exports = { app, server, io };

module.exports = app;