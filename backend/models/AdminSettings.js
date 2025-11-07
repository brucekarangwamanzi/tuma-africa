const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  // Hero Section Configuration
  heroSection: {
    title: {
      type: String,
      default: 'Connect Africa to Asia - Your Cargo Partner'
    },
    subtitle: {
      type: String,
      default: 'Seamless product ordering and cargo services from top Asian suppliers to African markets'
    },
    backgroundType: {
      type: String,
      enum: ['image', 'video', 'color'],
      default: 'image'
    },
    backgroundImage: {
      type: String,
      default: ''
    },
    backgroundVideo: {
      type: String,
      default: ''
    },
    backgroundColor: {
      type: String,
      default: '#1f2937'
    },
    ctaButtons: [{
      text: {
        type: String,
        default: 'Start Shopping'
      },
      link: {
        type: String,
        default: '/products'
      },
      style: {
        type: String,
        enum: ['primary', 'secondary', 'outline'],
        default: 'primary'
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    overlay: {
      enabled: {
        type: Boolean,
        default: true
      },
      opacity: {
        type: Number,
        default: 0.5,
        min: 0,
        max: 1
      },
      color: {
        type: String,
        default: '#000000'
      }
    }
  },

  // Advertisements Configuration
  advertisements: [{
    id: {
      type: String,
      required: false
    },
    title: {
      type: String,
      required: false
    },
    description: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    linkUrl: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    position: {
      type: String,
      enum: ['banner', 'sidebar', 'footer', 'popup', 'inline'],
      default: 'banner'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    targetAudience: {
      type: String,
      default: ''
    },
    clickCount: {
      type: Number,
      default: 0
    },
    impressionCount: {
      type: Number,
      default: 0
    }
  }],

  // Products Section Configuration
  productSection: {
    title: {
      type: String,
      default: 'Shop Popular Products'
    },
    subtitle: {
      type: String,
      default: 'Discover trending products from top Asian suppliers'
    },
    displayCount: {
      type: Number,
      default: 8,
      min: 4,
      max: 20
    },
    layout: {
      type: String,
      enum: ['grid', 'carousel', 'masonry'],
      default: 'grid'
    },
    showPrices: {
      type: Boolean,
      default: true
    },
    showRatings: {
      type: Boolean,
      default: true
    }
  },

  // Global Theme Configuration
  theme: {
    primaryColor: {
      type: String,
      default: '#3b82f6'
    },
    secondaryColor: {
      type: String,
      default: '#64748b'
    },
    accentColor: {
      type: String,
      default: '#f59e0b'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    backgroundImage: {
      type: String,
      default: ''
    },
    fontFamily: {
      type: String,
      enum: ['inter', 'roboto', 'poppins', 'montserrat'],
      default: 'inter'
    },
    borderRadius: {
      type: String,
      enum: ['none', 'small', 'medium', 'large'],
      default: 'medium'
    }
  },

  // Company Information
  companyInfo: {
    name: {
      type: String,
      default: 'Tuma-Africa Link Cargo'
    },
    tagline: {
      type: String,
      default: 'Bridging Africa and Asia through seamless cargo solutions'
    },
    description: {
      type: String,
      default: 'We specialize in connecting African customers with Asian suppliers, providing reliable cargo and product ordering services.'
    },
    logo: {
      type: String,
      default: ''
    },
    favicon: {
      type: String,
      default: ''
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    contact: {
      phone: String,
      email: String,
      whatsapp: String,
      supportHours: {
        type: String,
        default: 'Mon-Fri 9AM-6PM EAT'
      }
    }
  },

  // Social Media Links
  socialLinks: {
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String,
    youtube: String,
    tiktok: String,
    whatsapp: String,
    telegram: String
  },

  // SEO Configuration
  seo: {
    metaTitle: {
      type: String,
      default: 'Tuma-Africa Link Cargo - Connect Africa to Asia'
    },
    metaDescription: {
      type: String,
      default: 'Professional cargo and product ordering services connecting African customers with Asian suppliers. Fast, reliable, and secure.'
    },
    keywords: [String],
    ogImage: String,
    structuredData: mongoose.Schema.Types.Mixed
  },

  // Legal Pages
  legalPages: {
    termsAndConditions: {
      type: String,
      default: ''
    },
    privacyPolicy: {
      type: String,
      default: ''
    },
    shippingPolicy: {
      type: String,
      default: ''
    },
    returnPolicy: {
      type: String,
      default: ''
    },
    aboutUs: {
      type: String,
      default: ''
    }
  },

  // Feature Flags
  features: {
    enableChat: {
      type: Boolean,
      default: true
    },
    enableReviews: {
      type: Boolean,
      default: true
    },
    enableWishlist: {
      type: Boolean,
      default: true
    },
    enableNotifications: {
      type: Boolean,
      default: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    registrationEnabled: {
      type: Boolean,
      default: true
    }
  },

  // Email Templates
  emailTemplates: {
    welcome: {
      subject: String,
      body: String
    },
    orderConfirmation: {
      subject: String,
      body: String
    },
    orderUpdate: {
      subject: String,
      body: String
    },
    passwordReset: {
      subject: String,
      body: String
    }
  },

  // System Configuration
  system: {
    currency: {
      type: String,
      default: 'USD'
    },
    timezone: {
      type: String,
      default: 'Africa/Nairobi'
    },
    language: {
      type: String,
      default: 'en'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    }
  },

  // Last updated information
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
adminSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('AdminSettings', adminSettingsSchema);