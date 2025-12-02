const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD'
  },
  imageUrl: {
    type: String,
    required: [true, 'Product image is required']
  },
  images: [String],
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  tags: [String],
  specifications: {
    brand: String,
    model: String,
    color: [String],
    size: [String],
    material: String,
    weight: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        default: 'cm'
      }
    }
  },
  supplier: {
    name: String,
    platform: {
      type: String,
      enum: ['alibaba', '1688', 'taobao', 'other'],
      default: 'other'
    },
    url: String,
    rating: Number,
    location: String
  },
  stock: {
    available: {
      type: Boolean,
      default: true
    },
    quantity: {
      type: Number,
      default: 0
    },
    minOrderQuantity: {
      type: Number,
      default: 1
    }
  },
  shipping: {
    estimatedDays: {
      min: Number,
      max: Number
    },
    cost: Number,
    freeShippingThreshold: Number
  },
  popularity: {
    views: {
      type: Number,
      default: 0
    },
    orders: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better search performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ featured: -1, 'popularity.orders': -1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Ensure virtual fields are serialized
productSchema.set('toJSON', { virtuals: true });

// Pre-save hook to ensure isActive always matches status
productSchema.pre('save', function(next) {
  // If status is set, ensure isActive matches it
  if (this.status) {
    this.isActive = this.status === 'published';
  }
  // If isActive is set but status is not, derive status from isActive
  else if (this.isActive !== undefined && !this.status) {
    this.status = this.isActive ? 'published' : 'draft';
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);