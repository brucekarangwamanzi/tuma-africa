const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const User = require('../models/User');
require('dotenv').config();

async function createSampleChatData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tuma-africa-cargo');
    console.log('Connected to MongoDB');

    // Get the test user
    const testUser = await User.findOne({ email: 'user@tuma-africa.com' });
    const adminUser = await User.findOne({ email: 'admin@tuma-africa.com' });

    if (!testUser || !adminUser) {
      console.log('Please run createAdmin.js first to create users');
      process.exit(1);
    }

    // Create a sample chat
    const sampleChat = new Chat({
      participants: [testUser._id, adminUser._id],
      type: 'support',
      title: 'Customer Support - Product Inquiry',
      status: 'active',
      priority: 'normal',
      messages: [
        {
          sender: testUser._id,
          content: 'Hi, I have a question about the Wireless Bluetooth Headphones.',
          type: 'text',
          status: 'read',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          sender: adminUser._id,
          content: 'Hello! I\'d be happy to help you with information about our headphones. What would you like to know?',
          type: 'text',
          status: 'read',
          createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5 hours ago
        },
        {
          sender: testUser._id,
          content: 'What is the battery life and do they have noise cancellation?',
          type: 'text',
          status: 'delivered',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        },
        {
          sender: adminUser._id,
          content: 'Great questions! The headphones have 30-hour battery life and active noise cancellation. They also support fast charging - 15 minutes gives you 3 hours of playback.',
          type: 'text',
          status: 'sent',
          createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        }
      ],
      lastMessage: {
        content: 'Great questions! The headphones have 30-hour battery life...',
        sender: adminUser._id,
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    });

    await sampleChat.save();
    console.log('✅ Sample chat created successfully!');
    console.log('Chat participants:', testUser.fullName, 'and', adminUser.fullName);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating chat data:', error);
    process.exit(1);
  }
}

createSampleChatData();