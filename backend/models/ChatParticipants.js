module.exports = (sequelize, DataTypes) => {
  const ChatParticipants = sequelize.define('ChatParticipants', {
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'chat_participants',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['chat_id', 'user_id'], unique: true },
      { fields: ['chat_id'] },
      { fields: ['user_id'] }
    ]
  });

  return ChatParticipants;
};

