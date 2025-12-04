module.exports = (sequelize, DataTypes) => {
  const Chat = sequelize.define('Chat', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    chatType: {
      type: DataTypes.ENUM('direct', 'support', 'group'),
      defaultValue: 'support',
      field: 'chat_type'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'order_id',
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    lastMessageText: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'last_message_text'
    },
    lastMessageCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_message_created_at'
    },
    lastMessageSender: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'last_message_sender',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
      defaultValue: 'open'
    },
    assignedToId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_to_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    tableName: 'chats',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['order_id'] },
      { fields: ['last_message_created_at'] },
      { fields: ['status', 'priority'] }
    ]
  });

  return Chat;
};
