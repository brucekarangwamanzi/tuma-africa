module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM(
        'order_update',
        'order_created',
        'order_cancelled',
        'message_received',
        'message_sent',
        'admin_action',
        'system_announcement',
        'account_approved',
        'account_rejected',
        'payment_received',
        'shipment_update'
      ),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Title is required' }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Message is required' }
      }
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    },
    data: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    link: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    icon: {
      type: DataTypes.STRING,
      defaultValue: 'bell'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['user_id', 'read', 'createdAt'] },
      { fields: ['user_id', 'createdAt'] },
      { fields: ['expires_at'] }
    ]
  });

  return Notification;
};
