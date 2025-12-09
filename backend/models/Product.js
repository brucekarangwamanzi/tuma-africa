module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name is required' },
        len: { args: [1, 200], msg: 'Product name cannot exceed 200 characters' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product description is required' },
        len: { args: [1, 1000], msg: 'Description cannot exceed 1000 characters' }
      }
    },
    price: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      validate: {
        min: { args: [0], msg: 'Price cannot be negative' }
      }
    },
    originalPrice: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
      validate: {
        min: { args: [0], msg: 'Original price cannot be negative' }
      }
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product image is required' }
      }
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Category is required' }
      }
    },
    subcategory: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: []
    },
    // Specifications as JSONB for flexibility
    specifications: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // Supplier information as JSONB
    supplier: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // Stock information as JSONB
    stock: {
      type: DataTypes.JSONB,
      defaultValue: {
        available: true,
        quantity: 0,
        minOrderQuantity: 1
      }
    },
    // Shipping information as JSONB
    shipping: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // Popularity metrics as JSONB
    popularity: {
      type: DataTypes.JSONB,
      defaultValue: {
        views: 0,
        orders: 0,
        rating: 0,
        reviewCount: 0
      }
    },
    featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      defaultValue: 'draft'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active' // Map to snake_case in database
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    lastUpdatedById: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'last_updated_by_id',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'products',
    timestamps: true,
    underscored: false,
    indexes: [
      { fields: ['category', 'subcategory'] },
      { fields: ['featured'] },
      { fields: ['price'] },
      { fields: ['is_active'] }, // Use database column name
      { 
        fields: ['name', 'description']
        // Note: Full-text search with gin_trgm_ops requires pg_trgm extension
        // Uncomment below if extension is installed:
        // using: 'gin',
        // operator: 'gin_trgm_ops'
      }
    ],
    hooks: {
      beforeSave: (product) => {
        // Ensure isActive matches status
        if (product.status) {
          product.isActive = product.status === 'published';
        } else if (product.isActive !== undefined && !product.status) {
          product.status = product.isActive ? 'published' : 'draft';
        }
      }
    }
  });

  // Virtual for discount percentage
  Product.prototype.getDiscountPercentage = function() {
    if (this.originalPrice && this.originalPrice > this.price) {
      return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
  };

  return Product;
};
