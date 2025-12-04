const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// Import all models
const User = require('./User')(sequelize, DataTypes);
const Product = require('./Product')(sequelize, DataTypes);
const Order = require('./Order')(sequelize, DataTypes);
const Chat = require('./Chat')(sequelize, DataTypes);
const Message = require('./Message')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);
const AdminSettings = require('./AdminSettings')(sequelize, DataTypes);
const ChatParticipants = require('./ChatParticipants')(sequelize, DataTypes);

// Define associations
// User associations
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
User.hasMany(Product, { foreignKey: 'createdById', as: 'createdProducts' });
User.hasMany(Product, { foreignKey: 'lastUpdatedById', as: 'updatedProducts' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
User.hasMany(Order, { foreignKey: 'assignedEmployeeId', as: 'assignedOrders' });
User.belongsToMany(Chat, { 
  through: ChatParticipants, 
  foreignKey: 'userId',
  otherKey: 'chatId',
  as: 'chats'
});

// Product associations
Product.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });
Product.belongsTo(User, { foreignKey: 'lastUpdatedById', as: 'lastUpdater' });

// Order associations
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Order.belongsTo(User, { foreignKey: 'assignedEmployeeId', as: 'assignedEmployeeUser' });
Order.hasMany(Chat, { foreignKey: 'orderId', as: 'chats' });

// Chat associations
Chat.belongsToMany(User, { 
  through: ChatParticipants, 
  foreignKey: 'chatId',
  otherKey: 'userId',
  as: 'participants'
});
Chat.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Chat.belongsTo(User, { foreignKey: 'assignedToId', as: 'assignedUser' });
Chat.hasMany(Message, { foreignKey: 'chatId', as: 'messages' });

// Message associations
Message.belongsTo(Chat, { foreignKey: 'chatId', as: 'chat' });
Message.belongsTo(User, { foreignKey: 'sender', as: 'senderUser' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// AdminSettings associations
AdminSettings.belongsTo(User, { foreignKey: 'lastUpdatedById', as: 'lastUpdater' });

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  Chat,
  Message,
  Notification,
  AdminSettings,
  ChatParticipants
};

