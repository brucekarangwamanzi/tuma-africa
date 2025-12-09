module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'chat_id',
      references: {
        model: 'chats',
        key: 'id'
      }
    },
    sender: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('text', 'file', 'image', 'system'),
      defaultValue: 'text'
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_url'
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_name'
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_size'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'read_at'
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['chat_id', 'created_at'] },
      { fields: ['sender'] }
    ]
  });

  return Message;
};

