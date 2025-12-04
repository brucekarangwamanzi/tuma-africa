module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'order_id',
      defaultValue: function() {
        return 'TMA-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
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
    },
    productName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'product_name',
      validate: {
        notEmpty: { msg: 'Product name is required' }
      }
    },
    productLink: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
      field: 'product_link'
    },
    productImage: {
      type: DataTypes.STRING,
      defaultValue: '',
      field: 'product_image'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'Quantity must be at least 1' }
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      field: 'unit_price'
    },
    totalPrice: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      field: 'total_price'
    },
    shippingCost: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      field: 'shipping_cost'
    },
    finalAmount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      field: 'final_amount'
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'approved', 'purchased', 'warehouse', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'medium', 'high', 'urgent'),
      defaultValue: 'normal'
    },
    freightType: {
      type: DataTypes.ENUM('sea', 'air'),
      defaultValue: 'sea',
      field: 'freight_type'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    specifications: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    shippingAddress: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    trackingInfo: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    stageHistory: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
      defaultValue: []
    },
    assignedEmployeeId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'assigned_employee_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.ARRAY(DataTypes.JSONB),
      defaultValue: []
    },
    attachments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'partial', 'paid', 'refunded'),
      defaultValue: 'pending',
      field: 'payment_status'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'payment_method'
    },
    isUrgent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_urgent'
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['user_id', 'status'] },
      { fields: ['order_id'] },
      { fields: ['createdAt'] } // Use camelCase for createdAt
    ],
    hooks: {
      beforeSave: (order) => {
        // Calculate final amount
        order.finalAmount = (parseFloat(order.totalPrice) || 0) + (parseFloat(order.shippingCost) || 0);
      }
    }
  });

  return Order;
};
