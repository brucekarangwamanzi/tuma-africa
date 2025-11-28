const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 * @param {Object} options - Notification options
 * @param {String} options.userId - User ID to notify
 * @param {String} options.type - Notification type
 * @param {String} options.title - Notification title
 * @param {String} options.message - Notification message
 * @param {Object} options.data - Additional data
 * @param {String} options.link - Link to navigate to
 * @param {String} options.icon - Icon name
 * @param {String} options.priority - Priority level
 * @param {Date} options.expiresAt - Expiration date
 * @param {Object} options.io - Socket.IO instance for real-time updates
 */
async function createNotification({
  userId,
  type,
  title,
  message,
  data = {},
  link = '',
  icon = 'bell',
  priority = 'medium',
  expiresAt = null,
  io = null
}) {
  try {
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data,
      link,
      icon,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await notification.save();

    // Emit Socket.IO event for real-time notification
    if (io) {
      // Convert userId to string for Socket.IO room
      const userIdStr = userId.toString ? userId.toString() : String(userId);
      
      // Convert notification to plain object for Socket.IO
      const notificationData = notification.toObject ? notification.toObject() : {
        _id: notification._id.toString(),
        userId: notification.userId.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        readAt: notification.readAt,
        data: notification.data,
        link: notification.link,
        icon: notification.icon,
        priority: notification.priority,
        expiresAt: notification.expiresAt,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt
      };
      
      io.to(`user:${userIdStr}`).emit('notification:new', notificationData);
      console.log(`📬 Emitted notification to user:${userIdStr}`);
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

/**
 * Create order notification
 */
async function createOrderNotification(order, action, io = null) {
  const notifications = [];

  // Notify user about their order
  if (order.userId) {
    let title, message, type, link, priority = 'medium';

    switch (action) {
      case 'created':
        title = 'Order Created';
        message = `Your order "${order.productName}" has been created successfully. Order ID: ${order.orderId}`;
        type = 'order_created';
        link = `/orders/${order._id}`;
        priority = 'high';
        break;
      case 'status_changed':
        title = 'Order Status Updated';
        message = `Your order "${order.productName}" (${order.orderId}) status changed to ${order.status}`;
        type = 'order_update';
        link = `/orders/${order._id}`;
        priority = order.status === 'cancelled' ? 'urgent' : 'high';
        break;
      case 'stage_updated':
        title = 'Order Progress Update';
        message = `Your order "${order.productName}" (${order.orderId}) has progressed to a new stage`;
        type = 'order_update';
        link = `/orders/${order._id}`;
        priority = 'medium';
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = `Your order "${order.productName}" (${order.orderId}) has been cancelled`;
        type = 'order_cancelled';
        link = `/orders/${order._id}`;
        priority = 'urgent';
        break;
      default:
        return notifications;
    }

    // Ensure userId is a valid ObjectId
    const userId = order.userId?._id || order.userId || null;
    if (!userId) {
      console.error('Cannot create notification: userId is missing', order);
      return notifications;
    }

    const userNotification = await createNotification({
      userId: userId,
      type,
      title,
      message,
      data: {
        orderId: order.orderId,
        orderId_db: order._id ? order._id.toString() : '',
        status: order.status,
        productName: order.productName
      },
      link,
      icon: 'package',
      priority,
      io
    });

    if (userNotification) {
      notifications.push(userNotification);
    }
  }

  // Notify admins about new orders (except for status updates)
  if (action === 'created' && io) {
    try {
      // Emit to all admins
      const orderId = order._id ? order._id.toString() : '';
      const userId = order.userId?._id || order.userId || null;
      const userName = order.userId?.fullName || 'Customer';
      
      io.to('admins').emit('notification:new', {
        type: 'order_created',
        title: 'New Order Received',
        message: `New order "${order.productName}" from ${userName}. Order ID: ${order.orderId}`,
        data: {
          orderId: order.orderId,
          orderId_db: orderId,
          userId: userId
        },
        link: orderId ? `/admin/orders/${orderId}` : '/admin/orders',
        icon: 'package',
        priority: 'high'
      });
    } catch (error) {
      console.error('Failed to emit admin notification:', error);
    }
  }

  return notifications;
}

/**
 * Create message notification
 */
async function createMessageNotification(chat, message, sender, io = null) {
  const notifications = [];

  // Notify all participants except sender
  if (chat.participants && Array.isArray(chat.participants)) {
    const senderId = sender._id ? sender._id.toString() : sender.toString();
    console.log(`📧 Creating message notifications. Sender: ${senderId}, Participants: ${chat.participants.length}`);
    
    for (const participant of chat.participants) {
      // Handle both ObjectId and populated user objects
      let participantId;
      if (participant._id) {
        // Populated user object
        participantId = participant._id.toString();
      } else {
        // Plain ObjectId
        participantId = participant.toString();
      }
      
      // Skip if this is the sender
      if (participantId !== senderId) {
        // Get message text - handle different message structures
        // Chat messages use 'text' field, but also check for 'content' for compatibility
        let messageText = message.text || message.content || message.message;
        
        // If it's a file message, show appropriate text
        if (!messageText && message.type === 'file') {
          messageText = message.fileName ? `Sent ${message.fileName}` : 'Sent a file';
        }
        
        // Fallback if still no text
        if (!messageText) {
          messageText = 'You have a new message';
        }
        
        // Get message ID
        const messageId = message._id ? message._id.toString() : (message.id || '');
        
        // Get userId - handle both ObjectId and populated user objects
        let userIdForNotification;
        if (participant._id) {
          // Populated user object
          userIdForNotification = participant._id;
        } else if (typeof participant === 'object' && participant.toString) {
          // Plain ObjectId
          userIdForNotification = participant;
        } else {
          // String ID - convert to ObjectId
          const mongoose = require('mongoose');
          userIdForNotification = mongoose.Types.ObjectId.isValid(participant) 
            ? new mongoose.Types.ObjectId(participant) 
            : participant;
        }
        
        const notification = await createNotification({
          userId: userIdForNotification, // Use ObjectId for database
          type: 'message_received',
          title: `New message from ${sender.fullName || sender.email || 'User'}`,
          message: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
          data: {
            chatId: chat._id.toString(),
            messageId: messageId,
            senderId: senderId,
            senderName: sender.fullName || sender.email || 'User'
          },
          link: `/messages?chat=${chat._id}`,
          icon: 'message-circle',
          priority: 'high',
          io
        });

        if (notification) {
          notifications.push(notification);
          console.log(`✅ Created notification for user ${participantId}`);
        } else {
          console.error(`❌ Failed to create notification for user ${participantId}`);
        }
      }
    }
  } else {
    console.warn('⚠️ Chat has no participants or participants is not an array');
  }

  console.log(`📬 Created ${notifications.length} message notification(s)`);
  return notifications;
}

/**
 * Create account approval notification
 */
async function createAccountApprovalNotification(user, approved, io = null) {
  const notification = await createNotification({
    userId: user._id,
    type: approved ? 'account_approved' : 'account_rejected',
    title: approved ? 'Account Approved' : 'Account Rejected',
    message: approved
      ? 'Your account has been approved. You can now place orders and access all features.'
      : 'Your account registration has been rejected. Please contact support for more information.',
    data: {
      userId: user._id.toString(),
      approved
    },
    link: approved ? '/dashboard' : '/profile',
    icon: approved ? 'check-circle' : 'x-circle',
    priority: 'high',
    io
  });

  return notification;
}

module.exports = {
  createNotification,
  createOrderNotification,
  createMessageNotification,
  createAccountApprovalNotification
};

