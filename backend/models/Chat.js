const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  text: {
    type: String,
    trim: true
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  chatType: {
    type: String,
    enum: ['direct', 'support', 'group'],
    default: 'support'
  },
  title: {
    type: String,
    trim: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  messages: [messageSchema],
  lastMessage: {
    text: String,
    createdAt: Date,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  metadata: {
    userAgent: String,
    ipAddress: String,
    source: String
  }
}, {
  timestamps: true
});

// Update lastMessage when new message is added
chatSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    // Ensure lastMessage is properly set
    if (lastMsg && lastMsg.createdAt) {
      this.lastMessage = {
        text: lastMsg.text || (lastMsg.fileName ? `Sent a file: ${lastMsg.fileName}` : 'File attachment'),
        createdAt: lastMsg.createdAt,
        sender: lastMsg.sender || this.participants[0]
      };
    }
  }
  next();
});

// Post-save hook to ensure messages are persisted
chatSchema.post('save', function(doc) {
  // Verify messages were saved
  if (doc.messages && doc.messages.length > 0) {
    console.log(`✅ Chat ${doc._id} saved with ${doc.messages.length} message(s)`);
  }
});

// Indexes for better performance
chatSchema.index({ participants: 1 });
chatSchema.index({ orderId: 1 });
chatSchema.index({ 'lastMessage.createdAt': -1 });
chatSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('Chat', chatSchema);