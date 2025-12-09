const { sequelize, testConnection } = require('../config/database');
const { User, Product, AdminSettings } = require('../models');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    price: 89.99,
    originalPrice: 129.99,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400'
    ],
    category: 'Electronics',
    subcategory: 'Audio',
    tags: ['wireless', 'bluetooth', 'headphones', 'audio'],
    specifications: {
      'Battery Life': '30 hours',
      'Connectivity': 'Bluetooth 5.0',
      'Weight': '250g',
      'Color': 'Black'
    },
    isActive: true,
    featured: true,
    status: 'published',
    popularity: { orders: 45, views: 320, rating: 4.5, reviewCount: 23 }
  },
  {
    name: 'Smart Fitness Watch',
    description: 'Advanced fitness tracker with heart rate monitoring, GPS, and waterproof design.',
    price: 199.99,
    originalPrice: 249.99,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400'
    ],
    category: 'Electronics',
    subcategory: 'Wearables',
    tags: ['fitness', 'smartwatch', 'health', 'gps'],
    specifications: {
      'Display': '1.4" AMOLED',
      'Battery': '7 days',
      'Water Resistance': '50m',
      'Sensors': 'Heart Rate, GPS, Accelerometer'
    },
    isActive: true,
    featured: true,
    status: 'published',
    popularity: { orders: 32, views: 280, rating: 4.7, reviewCount: 18 }
  },
  {
    name: 'Portable Power Bank 20000mAh',
    description: 'High-capacity portable charger with fast charging and multiple USB ports.',
    price: 34.99,
    originalPrice: 49.99,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1609592806787-3d9c4d5b4e4e?w=400',
    category: 'Electronics',
    subcategory: 'Accessories',
    tags: ['powerbank', 'portable', 'charging', 'usb'],
    specifications: {
      'Capacity': '20000mAh',
      'Output': '2.4A Fast Charge',
      'Ports': '3 USB + 1 USB-C',
      'Weight': '400g'
    },
    isActive: true,
    featured: true,
    status: 'published',
    popularity: { orders: 67, views: 450, rating: 4.6, reviewCount: 31 }
  },
  {
    name: 'Wireless Phone Charger Pad',
    description: 'Qi-compatible wireless charging pad with LED indicator and fast charging support.',
    price: 24.99,
    originalPrice: 34.99,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400',
    category: 'Electronics',
    subcategory: 'Accessories',
    tags: ['wireless', 'charging', 'qi', 'phone'],
    specifications: {
      'Compatibility': 'Qi-enabled devices',
      'Output': '10W Fast Charge',
      'Design': 'Ultra-slim',
      'LED': 'Status indicator'
    },
    isActive: true,
    featured: false,
    status: 'published',
    popularity: { orders: 23, views: 180, rating: 4.3, reviewCount: 12 }
  }
];

const defaultSettings = {
  heroSection: {
    title: 'Connect Africa to Asia',
    subtitle: 'Your trusted partner for cargo and product ordering from Asian suppliers',
    backgroundType: 'color',
    backgroundColor: '#3b82f6',
    ctaButtons: [
      { text: 'Start Shopping', link: '/products', style: 'primary' },
      { text: 'Learn More', link: '/about', style: 'secondary' }
    ]
  },
  productSection: {
    title: 'Featured Products',
    subtitle: 'Discover our most popular items from trusted Asian suppliers',
    displayCount: 8,
    layout: 'grid'
  },
  companyInfo: {
    name: 'Tuma-Africa Link Cargo',
    tagline: 'Connecting Africa to Asia',
    description: 'Professional cargo and product ordering services',
    email: 'info@tuma-africa-cargo.com',
    phone: '+1-555-0123',
    address: {
      street: '123 Business Ave',
      city: 'Commerce City',
      country: 'Kenya',
      postalCode: '12345'
    }
  },
  theme: {
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#1f2937'
  }
};

async function seedDatabase() {
  try {
    // Test database connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    console.log('✅ Connected to PostgreSQL');

    // Create or get super admin user
    let admin = await User.findOne({ where: { email: 'admin@tumaafricacargo.com' } });
    
    if (!admin) {
      console.log('Creating super admin user...');
      const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      admin = await User.create({
        fullName: 'Super Admin',
        email: 'admin@tumaafricacargo.com',
        phone: '+1234567890',
        passwordHash: hashedPassword,
        role: 'super_admin',
        verified: true,
        approved: true,
        isActive: true
      });
      console.log('✅ Super admin created');
    } else {
      console.log('✅ Super admin already exists');
    }

    // Clear existing products (optional - comment out if you want to keep existing)
    const productCount = await Product.count();
    if (productCount > 0) {
      console.log(`Clearing ${productCount} existing products...`);
      await Product.destroy({ where: {} });
      console.log('✅ Cleared existing products');
    }

    // Create sample products
    console.log('Creating sample products...');
    const createdProducts = [];
    for (const productData of sampleProducts) {
      const product = await Product.create({
        ...productData,
        createdById: admin.id,
        lastUpdatedById: admin.id
      });
      createdProducts.push(product);
      console.log(`  ✓ ${product.name} - $${product.price}`);
    }
    console.log(`✅ Created ${createdProducts.length} products`);

    // Create or update admin settings
    let adminSettings = await AdminSettings.findOne();
    if (!adminSettings) {
      console.log('Creating admin settings...');
      adminSettings = await AdminSettings.create({
        settings: defaultSettings,
        lastUpdatedById: admin.id
      });
      console.log('✅ Admin settings created');
    } else {
      console.log('Updating admin settings...');
      adminSettings.settings = defaultSettings;
      adminSettings.lastUpdatedById = admin.id;
      await adminSettings.save();
      console.log('✅ Admin settings updated');
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📧 Super Admin Credentials:');
    console.log('   Email: admin@tumaafricacargo.com');
    console.log('   Password: admin123');
    console.log('\n⚠️  Please change the password after first login!\n');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    console.error(error.stack);
    await sequelize.close();
    process.exit(1);
  }
}

seedDatabase();

