const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Product = require('./backend/models/Product');
const AdminSettings = require('./backend/models/AdminSettings');

async function createSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tuma-africa-cargo');
    console.log('Connected to MongoDB');

    // Create sample products
    const sampleProducts = [
      {
        name: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life. Perfect for music lovers and professionals.',
        price: 45.99,
        originalPrice: 79.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=300&fit=crop'
        ],
        category: 'Electronics',
        subcategory: 'Audio',
        tags: ['wireless', 'bluetooth', 'headphones', 'audio', 'music'],
        specifications: {
          brand: 'TechSound',
          color: ['Black', 'White', 'Blue'],
          material: 'Plastic, Metal',
          weight: '250g',
          dimensions: {
            length: 18,
            width: 15,
            height: 8,
            unit: 'cm'
          }
        },
        supplier: {
          name: 'Shenzhen Audio Tech Co.',
          platform: 'alibaba',
          url: 'https://www.alibaba.com/product-detail/wireless-headphones',
          rating: 4.5,
          location: 'Shenzhen, China'
        },
        stock: {
          available: true,
          quantity: 500,
          minOrderQuantity: 10
        },
        shipping: {
          estimatedDays: { min: 7, max: 15 },
          cost: 12.50
        },
        popularity: {
          views: 1250,
          orders: 89,
          rating: 4.3,
          reviewCount: 67
        },
        featured: true,
        isActive: true
      },
      {
        name: 'Smart Fitness Watch',
        description: 'Advanced fitness tracker with heart rate monitoring, GPS, and waterproof design. Track your health and fitness goals.',
        price: 89.99,
        originalPrice: 149.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
        category: 'Electronics',
        subcategory: 'Wearables',
        tags: ['smartwatch', 'fitness', 'health', 'gps', 'waterproof'],
        specifications: {
          brand: 'FitTech',
          color: ['Black', 'Silver', 'Rose Gold'],
          material: 'Aluminum, Silicone',
          weight: '45g'
        },
        supplier: {
          name: 'Guangzhou Smart Devices Ltd.',
          platform: 'alibaba',
          rating: 4.7,
          location: 'Guangzhou, China'
        },
        stock: {
          available: true,
          quantity: 300,
          minOrderQuantity: 5
        },
        popularity: {
          views: 980,
          orders: 56,
          rating: 4.5,
          reviewCount: 43
        },
        featured: true,
        isActive: true
      },
      {
        name: 'Portable Power Bank 20000mAh',
        description: 'High-capacity portable charger with fast charging technology. Compatible with all smartphones and tablets.',
        price: 25.99,
        originalPrice: 39.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1609592806596-4d8b5b1d7d0e?w=400&h=300&fit=crop',
        category: 'Electronics',
        subcategory: 'Accessories',
        tags: ['powerbank', 'charger', 'portable', 'fast-charging'],
        specifications: {
          brand: 'PowerMax',
          color: ['Black', 'White'],
          material: 'ABS Plastic',
          weight: '400g'
        },
        supplier: {
          name: 'Dongguan Power Solutions',
          platform: '1688',
          rating: 4.2,
          location: 'Dongguan, China'
        },
        stock: {
          available: true,
          quantity: 800,
          minOrderQuantity: 20
        },
        popularity: {
          views: 2100,
          orders: 145,
          rating: 4.1,
          reviewCount: 98
        },
        featured: true,
        isActive: true
      },
      {
        name: 'LED Desk Lamp with USB Charging',
        description: 'Modern LED desk lamp with adjustable brightness, color temperature control, and built-in USB charging port.',
        price: 32.50,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        category: 'Home & Garden',
        subcategory: 'Lighting',
        tags: ['led', 'desk-lamp', 'usb-charging', 'adjustable'],
        specifications: {
          brand: 'LightPro',
          color: ['White', 'Black'],
          material: 'Aluminum, ABS',
          weight: '800g'
        },
        supplier: {
          name: 'Zhongshan Lighting Co.',
          platform: 'alibaba',
          rating: 4.4,
          location: 'Zhongshan, China'
        },
        stock: {
          available: true,
          quantity: 200,
          minOrderQuantity: 12
        },
        popularity: {
          views: 650,
          orders: 34,
          rating: 4.2,
          reviewCount: 28
        },
        featured: false,
        isActive: true
      },
      {
        name: 'Wireless Phone Charger Pad',
        description: 'Fast wireless charging pad compatible with all Qi-enabled devices. Sleek design with LED indicator.',
        price: 18.99,
        originalPrice: 29.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=300&fit=crop',
        category: 'Electronics',
        subcategory: 'Accessories',
        tags: ['wireless-charger', 'qi-charging', 'fast-charging'],
        specifications: {
          brand: 'ChargeTech',
          color: ['Black', 'White'],
          material: 'Tempered Glass, ABS',
          weight: '150g'
        },
        supplier: {
          name: 'Shenzhen Wireless Tech',
          platform: 'taobao',
          rating: 4.3,
          location: 'Shenzhen, China'
        },
        stock: {
          available: true,
          quantity: 400,
          minOrderQuantity: 15
        },
        popularity: {
          views: 890,
          orders: 67,
          rating: 4.0,
          reviewCount: 52
        },
        featured: true,
        isActive: true
      },
      {
        name: 'Bluetooth Speaker Waterproof',
        description: 'Portable Bluetooth speaker with 360-degree sound, waterproof design, and 12-hour battery life.',
        price: 35.99,
        originalPrice: 59.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop',
        category: 'Electronics',
        subcategory: 'Audio',
        tags: ['bluetooth-speaker', 'waterproof', 'portable', 'wireless'],
        specifications: {
          brand: 'SoundWave',
          color: ['Blue', 'Red', 'Black'],
          material: 'Silicone, Metal',
          weight: '500g'
        },
        supplier: {
          name: 'Guangzhou Audio Systems',
          platform: 'alibaba',
          rating: 4.6,
          location: 'Guangzhou, China'
        },
        stock: {
          available: true,
          quantity: 250,
          minOrderQuantity: 8
        },
        popularity: {
          views: 1450,
          orders: 78,
          rating: 4.4,
          reviewCount: 61
        },
        featured: true,
        isActive: true
      },
      {
        name: 'USB-C Hub Multi-Port Adapter',
        description: 'Versatile USB-C hub with HDMI, USB 3.0 ports, SD card reader, and PD charging. Perfect for laptops.',
        price: 42.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=300&fit=crop',
        category: 'Electronics',
        subcategory: 'Accessories',
        tags: ['usb-hub', 'adapter', 'hdmi', 'multi-port'],
        specifications: {
          brand: 'ConnectPro',
          color: ['Space Gray', 'Silver'],
          material: 'Aluminum',
          weight: '120g'
        },
        supplier: {
          name: 'Dongguan Tech Accessories',
          platform: '1688',
          rating: 4.5,
          location: 'Dongguan, China'
        },
        stock: {
          available: true,
          quantity: 180,
          minOrderQuantity: 10
        },
        popularity: {
          views: 720,
          orders: 45,
          rating: 4.3,
          reviewCount: 37
        },
        featured: false,
        isActive: true
      },
      {
        name: 'Smart Home Security Camera',
        description: '1080P WiFi security camera with night vision, motion detection, and mobile app control.',
        price: 65.99,
        originalPrice: 99.99,
        currency: 'USD',
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
        category: 'Electronics',
        subcategory: 'Security',
        tags: ['security-camera', 'wifi', 'smart-home', 'surveillance'],
        specifications: {
          brand: 'SecureTech',
          color: ['White', 'Black'],
          material: 'ABS Plastic, Metal',
          weight: '300g'
        },
        supplier: {
          name: 'Hangzhou Security Systems',
          platform: 'alibaba',
          rating: 4.4,
          location: 'Hangzhou, China'
        },
        stock: {
          available: true,
          quantity: 150,
          minOrderQuantity: 6
        },
        popularity: {
          views: 1100,
          orders: 52,
          rating: 4.2,
          reviewCount: 44
        },
        featured: true,
        isActive: true
      }
    ];

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample products
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${createdProducts.length} sample products`);

    // Create default admin settings if they don't exist
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings({
        heroSection: {
          title: 'Connect Africa to Asia - Your Cargo Partner',
          subtitle: 'Seamless product ordering and cargo services from top Asian suppliers to African markets',
          backgroundType: 'image',
          backgroundImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1920&h=1080&fit=crop',
          backgroundColor: '#1f2937',
          ctaButtons: [
            {
              text: 'Start Shopping',
              link: '/products',
              style: 'primary',
              isActive: true
            },
            {
              text: 'Place Custom Order',
              link: '/orders/new',
              style: 'outline',
              isActive: true
            }
          ],
          overlay: {
            enabled: true,
            opacity: 0.6,
            color: '#000000'
          }
        },
        productSection: {
          title: 'Shop Popular Products',
          subtitle: 'Discover trending products from top Asian suppliers',
          displayCount: 8,
          layout: 'grid',
          showPrices: true,
          showRatings: true
        },
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#64748b',
          accentColor: '#f59e0b',
          backgroundColor: '#ffffff',
          backgroundImage: '',
          fontFamily: 'inter',
          borderRadius: 'medium'
        },
        companyInfo: {
          name: 'Tuma-Africa Link Cargo',
          tagline: 'Bridging Africa and Asia through seamless cargo solutions',
          description: 'We specialize in connecting African customers with Asian suppliers, providing reliable cargo and product ordering services with real-time tracking and professional support.',
          logo: '',
          favicon: '',
          address: {
            street: '123 Business District',
            city: 'Nairobi',
            state: 'Nairobi County',
            country: 'Kenya',
            zipCode: '00100'
          },
          contact: {
            phone: '+254 700 123 456',
            email: 'info@tuma-africa-cargo.com',
            whatsapp: '+254 700 123 456',
            supportHours: 'Mon-Fri 8AM-6PM EAT'
          }
        },
        socialLinks: {
          facebook: 'https://facebook.com/tuma-africa-cargo',
          twitter: 'https://twitter.com/tuma_africa',
          instagram: 'https://instagram.com/tuma_africa_cargo',
          linkedin: 'https://linkedin.com/company/tuma-africa-cargo',
          whatsapp: '+254700123456'
        },
        seo: {
          metaTitle: 'Tuma-Africa Link Cargo - Connect Africa to Asia',
          metaDescription: 'Professional cargo and product ordering services connecting African customers with Asian suppliers. Fast, reliable, and secure shipping solutions.',
          keywords: ['cargo', 'shipping', 'africa', 'asia', 'logistics', 'e-commerce', 'alibaba', '1688', 'taobao']
        },
        features: {
          enableChat: true,
          enableReviews: true,
          enableWishlist: true,
          enableNotifications: true,
          maintenanceMode: false,
          registrationEnabled: true
        },
        system: {
          currency: 'USD',
          timezone: 'Africa/Nairobi',
          language: 'en',
          dateFormat: 'DD/MM/YYYY'
        }
      });

      await settings.save();
      console.log('✅ Created default admin settings');
    } else {
      console.log('✅ Admin settings already exist');
    }

    console.log('\n🎉 Sample data created successfully!');
    console.log('- Products: Available in the catalog');
    console.log('- Admin Settings: CMS configured');
    console.log('- Ready for testing!');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createSampleData();