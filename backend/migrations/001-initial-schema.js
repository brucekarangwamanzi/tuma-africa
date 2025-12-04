'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      fullName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('user', 'admin', 'super_admin'),
        defaultValue: 'user'
      },
      verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      emailVerificationToken: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emailVerificationExpires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      emailVerifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      profileImage: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      addressStreet: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'address_street'
      },
      addressCity: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'address_city'
      },
      addressState: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'address_state'
      },
      addressCountry: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'address_country'
      },
      addressZipCode: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'address_zip_code'
      },
      currency: {
        type: Sequelize.ENUM('RWF', 'Yuan', 'USD'),
        defaultValue: 'USD'
      },
      refreshToken: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Products table
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      originalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'USD'
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subcategory: {
        type: Sequelize.STRING,
        allowNull: true
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      specifications: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      supplier: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      stock: {
        type: Sequelize.JSONB,
        defaultValue: {
          available: true,
          quantity: 0,
          minOrderQuantity: 1
        }
      },
      shipping: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      popularity: {
        type: Sequelize.JSONB,
        defaultValue: {
          views: 0,
          orders: 0,
          rating: 0,
          reviewCount: 0
        }
      },
      featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'published'),
        defaultValue: 'draft'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
      },
      createdById: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'created_by_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      lastUpdatedById: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'last_updated_by_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create indexes for products
    await queryInterface.addIndex('products', ['category', 'subcategory']);
    await queryInterface.addIndex('products', ['featured']);
    await queryInterface.addIndex('products', ['price']);
    await queryInterface.addIndex('products', ['is_active']);

    // Create Orders table
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      orderId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        field: 'order_id'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      productName: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'product_name'
      },
      productLink: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'product_link'
      },
      productImage: {
        type: Sequelize.STRING,
        defaultValue: '',
        field: 'product_image'
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      unitPrice: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'unit_price'
      },
      totalPrice: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'total_price'
      },
      shippingCost: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'shipping_cost'
      },
      finalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
        field: 'final_amount'
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'USD'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'approved', 'purchased', 'warehouse', 'shipped', 'delivered', 'cancelled'),
        defaultValue: 'pending'
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'medium', 'high', 'urgent'),
        defaultValue: 'normal'
      },
      freightType: {
        type: Sequelize.ENUM('sea', 'air'),
        defaultValue: 'sea',
        field: 'freight_type'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      specifications: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      shippingAddress: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      trackingInfo: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      stageHistory: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        defaultValue: []
      },
      assignedEmployeeId: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'assigned_employee_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      notes: {
        type: Sequelize.ARRAY(Sequelize.JSONB),
        defaultValue: []
      },
      attachments: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'partial', 'paid', 'refunded'),
        defaultValue: 'pending',
        field: 'payment_status'
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'payment_method'
      },
      isUrgent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_urgent'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create indexes for orders
    await queryInterface.addIndex('orders', ['user_id', 'status']);
    await queryInterface.addIndex('orders', ['order_id']);
    await queryInterface.addIndex('orders', ['created_at']);

    // Create Chats table
    await queryInterface.createTable('chats', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      chatType: {
        type: Sequelize.ENUM('direct', 'support', 'group'),
        defaultValue: 'support',
        field: 'chat_type'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: true
      },
      orderId: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'order_id',
        references: {
          model: 'orders',
          key: 'id'
        }
      },
      lastMessageText: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'last_message_text'
      },
      lastMessageCreatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'last_message_created_at'
      },
      lastMessageSender: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'last_message_sender',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      status: {
        type: Sequelize.ENUM('open', 'in_progress', 'resolved', 'closed'),
        defaultValue: 'open'
      },
      assignedToId: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'assigned_to_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Messages table
    await queryInterface.createTable('messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      chatId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'chat_id',
        references: {
          model: 'chats',
          key: 'id'
        }
      },
      sender: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      type: {
        type: Sequelize.ENUM('text', 'file', 'image', 'system'),
        defaultValue: 'text'
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      fileUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'file_url'
      },
      fileName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'file_name'
      },
      fileSize: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'file_size'
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_read'
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'read_at'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create ChatParticipants junction table
    await queryInterface.createTable('chat_participants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      chatId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'chat_id',
        references: {
          model: 'chats',
          key: 'id'
        }
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create unique index on chat_participants
    await queryInterface.addIndex('chat_participants', ['chat_id', 'user_id'], { unique: true });

    // Create Notifications table
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      type: {
        type: Sequelize.ENUM(
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
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'read_at'
      },
      data: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      link: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      icon: {
        type: Sequelize.STRING,
        defaultValue: 'bell'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'expires_at'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create indexes for notifications
    await queryInterface.addIndex('notifications', ['user_id', 'read', 'created_at']);
    await queryInterface.addIndex('notifications', ['user_id', 'created_at']);
    await queryInterface.addIndex('notifications', ['expires_at']);

    // Create AdminSettings table
    await queryInterface.createTable('admin_settings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      lastUpdatedById: {
        type: Sequelize.UUID,
        allowNull: true,
        field: 'last_updated_by_id',
        references: {
          model: 'users',
          key: 'id'
        }
      },
      version: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order (respecting foreign keys)
    await queryInterface.dropTable('admin_settings');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('chat_participants');
    await queryInterface.dropTable('messages');
    await queryInterface.dropTable('chats');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('users');
    
    // Drop ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_currency"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_products_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_priority"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_freight_type"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_payment_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chats_chat_type"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chats_priority"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chats_status"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_messages_type"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_type"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_priority"');
  }
};

