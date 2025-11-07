const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return 'TMA-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  productLink: {
    type: String,
    required: [true, 'Product link is required'],
    trim: true
  },
  productImage: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  finalAmount: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'approved', 'purchased', 'warehouse', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'medium', 'high', 'urgent'],
    default: 'normal'
  },
  description: {
    type: String,
    trim: true
  },
  specifications: {
    color: String,
    size: String,
    material: String,
    brand: String,
    model: String,
    other: String
  },
  shippingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  trackingInfo: {
    trackingNumber: String,
    carrier: String,
    estimatedDelivery: Date,
    trackingUrl: String
  },
  stageHistory: [{
    stage: {
      type: String,
      enum: ['pending', 'processing', 'approved', 'purchased', 'warehouse', 'shipped', 'delivered', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    attachments: [String]
  }],
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    text: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [String],
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: String,
  isUrgent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add stage to history when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.stageHistory.push({
      stage: this.status,
      timestamp: new Date(),
      updatedBy: this.assignedEmployee
    });
  }
  next();
});

// Calculate final amount
orderSchema.pre('save', function(next) {
  if (this.isModified('totalPrice') || this.isModified('shippingCost')) {
    this.finalAmount = (this.totalPrice || 0) + (this.shippingCost || 0);
  }
  next();
});

// Indexes for better performance
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);