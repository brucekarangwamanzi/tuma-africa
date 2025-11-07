const mongoose = require('mongoose');
const Product = require('../models/Product');
const User = require('../models/User');
require('dotenv').config();

const sampleProducts = [
  {
    name: "iPhone 15 Pro Max",
    description: "The most advanced iPhone ever with titanium design, A17 Pro chip, and professional camera system. Features a 6.7-inch Super Retina XDR display with ProMotion technology.",
    price: 1199,
    originalPrice: 1299,
    imageUrl: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845702774",
    images: [
      "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-bluetitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845699311",
      "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-whitetitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692845705473"
    ],
    category: "Electronics",
    subcategory: "Smartphones",
    tags: ["iPhone", "Apple", "Smartphone", "5G", "Pro"],
    specifications: {
      brand: "Apple",
      model: "iPhone 15 Pro Max",
      color: ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"],
      size: ["256GB", "512GB", "1TB"],
      material: "Titanium",
      weight: "221g",
      dimensions: {
        length: 159.9,
        width: 76.7,
        height: 8.25,
        unit: "mm"
      }
    },
    supplier: {
      name: "Apple Inc.",
      platform: "other",
      url: "https://www.apple.com",
      rating: 5,
      location: "Cupertino, CA"
    },
    stock: {
      available: true,
      quantity: 50,
      minOrderQuantity: 1
    },
    shipping: {
      estimatedDays: { min: 3, max: 7 },
      cost: 0,
      freeShippingThreshold: 100
    },
    featured: true,
    isActive: true
  },
  {
    name: "MacBook Air M3 13-inch",
    description: "Supercharged by the M3 chip, the redesigned MacBook Air is more portable than ever and delivers exceptional performance in an ultralight design.",
    price: 1099,
    originalPrice: 1199,
    imageUrl: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653084303665",
    images: [
      "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-starlight-select-20220606?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653084303665",
      "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-silver-select-20220606?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653084303665"
    ],
    category: "Electronics",
    subcategory: "Laptops",
    tags: ["MacBook", "Apple", "Laptop", "M3", "Ultrabook"],
    specifications: {
      brand: "Apple",
      model: "MacBook Air M3",
      color: ["Midnight", "Starlight", "Silver", "Space Gray"],
      size: ["256GB", "512GB", "1TB", "2TB"],
      material: "Aluminum",
      weight: "1.24kg",
      dimensions: {
        length: 304.1,
        width: 215,
        height: 11.3,
        unit: "mm"
      }
    },
    supplier: {
      name: "Apple Inc.",
      platform: "other",
      url: "https://www.apple.com",
      rating: 5,
      location: "Cupertino, CA"
    },
    stock: {
      available: true,
      quantity: 25,
      minOrderQuantity: 1
    },
    shipping: {
      estimatedDays: { min: 5, max: 10 },
      cost: 50,
      freeShippingThreshold: 1000
    },
    featured: true,
    isActive: true
  },
  {
    name: "Sony WH-1000XM5 Wireless Headphones",
    description: "Industry-leading noise canceling with Dual Noise Sensor technology. Next-level music with Edge-AI, for the ultimate listening experience.",
    price: 399,
    originalPrice: 449,
    imageUrl: "https://picsum.photos/400/400?random=1",
    images: [
      "https://picsum.photos/400/400?random=2",
      "https://picsum.photos/400/400?random=3"
    ],
    category: "Electronics",
    subcategory: "Audio",
    tags: ["Sony", "Headphones", "Wireless", "Noise Canceling", "Bluetooth"],
    specifications: {
      brand: "Sony",
      model: "WH-1000XM5",
      color: ["Black", "Silver"],
      material: "Plastic/Metal",
      weight: "250g"
    },
    supplier: {
      name: "Sony Corporation",
      platform: "other",
      url: "https://www.sony.com",
      rating: 4.8,
      location: "Tokyo, Japan"
    },
    stock: {
      available: true,
      quantity: 100,
      minOrderQuantity: 1
    },
    shipping: {
      estimatedDays: { min: 2, max: 5 },
      cost: 25,
      freeShippingThreshold: 300
    },
    featured: false,
    isActive: true
  },
  {
    name: "Samsung Galaxy S24 Ultra",
    description: "Meet Galaxy S24 Ultra, the ultimate form of Galaxy Ultra with all the Galaxy AI features plus the iconic S Pen, the most megapixels in a smartphone and 100x Space Zoom.",
    price: 1299,
    imageUrl: "https://picsum.photos/400/400?random=4",
    images: [
      "https://picsum.photos/400/400?random=5",
      "https://picsum.photos/400/400?random=6"
    ],
    category: "Electronics",
    subcategory: "Smartphones",
    tags: ["Samsung", "Galaxy", "Android", "S Pen", "5G"],
    specifications: {
      brand: "Samsung",
      model: "Galaxy S24 Ultra",
      color: ["Titanium Black", "Titanium Gray", "Titanium Violet", "Titanium Yellow"],
      size: ["256GB", "512GB", "1TB"],
      material: "Titanium",
      weight: "232g",
      dimensions: {
        length: 162.3,
        width: 79,
        height: 8.6,
        unit: "mm"
      }
    },
    supplier: {
      name: "Samsung Electronics",
      platform: "other",
      url: "https://www.samsung.com",
      rating: 4.7,
      location: "Seoul, South Korea"
    },
    stock: {
      available: true,
      quantity: 75,
      minOrderQuantity: 1
    },
    shipping: {
      estimatedDays: { min: 3, max: 7 },
      cost: 30,
      freeShippingThreshold: 500
    },
    featured: true,
    isActive: true
  },
  {
    name: "Nike Air Max 270",
    description: "Nike's biggest heel Air unit yet delivers unrivaled, all-day comfort. The sleek, running-inspired design roots you to everything Nike while revolutionizing your look.",
    price: 150,
    originalPrice: 180,
    imageUrl: "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/awjogtdnqxniqqk0wpgf/air-max-270-mens-shoes-KkLcGR.png",
    images: [
      "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/i1-665455a5-45de-40fb-945f-c1852b82400d/air-max-270-mens-shoes-KkLcGR.png",
      "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/8439f823-86cf-4086-81d5-efc2ed1d24ad/air-max-270-mens-shoes-KkLcGR.png"
    ],
    category: "Fashion",
    subcategory: "Shoes",
    tags: ["Nike", "Air Max", "Sneakers", "Running", "Casual"],
    specifications: {
      brand: "Nike",
      model: "Air Max 270",
      color: ["Black/White", "White/Black", "Navy/White", "Red/Black"],
      size: ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"],
      material: "Mesh/Synthetic"
    },
    supplier: {
      name: "Nike Inc.",
      platform: "other",
      url: "https://www.nike.com",
      rating: 4.6,
      location: "Beaverton, OR"
    },
    stock: {
      available: true,
      quantity: 200,
      minOrderQuantity: 1
    },
    shipping: {
      estimatedDays: { min: 3, max: 7 },
      cost: 15,
      freeShippingThreshold: 100
    },
    featured: false,
    isActive: true
  },
  {
    name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
    description: "7 appliances in 1: Pressure Cooker, Slow Cooker, Rice Cooker, Yogurt Maker, Steamer, Sauté Pan, and Food Warmer. 14 One-Touch Smart Programs.",
    price: 79,
    originalPrice: 99,
    imageUrl: "https://picsum.photos/400/400?random=7",
    images: [
      "https://picsum.photos/400/400?random=8",
      "https://picsum.photos/400/400?random=9"
    ],
    category: "Home & Garden",
    subcategory: "Kitchen Appliances",
    tags: ["Instant Pot", "Pressure Cooker", "Kitchen", "Cooking", "Multi-Cooker"],
    specifications: {
      brand: "Instant Pot",
      model: "Duo 7-in-1",
      color: ["Stainless Steel"],
      size: ["3 Qt", "6 Qt", "8 Qt"],
      material: "Stainless Steel",
      weight: "5.8kg",
      dimensions: {
        length: 325,
        width: 318,
        height: 325,
        unit: "mm"
      }
    },
    supplier: {
      name: "Instant Brands",
      platform: "other",
      url: "https://www.instantpot.com",
      rating: 4.5,
      location: "Chicago, IL"
    },
    stock: {
      available: true,
      quantity: 150,
      minOrderQuantity: 1
    },
    shipping: {
      estimatedDays: { min: 2, max: 5 },
      cost: 20,
      freeShippingThreshold: 75
    },
    featured: false,
    isActive: true
  }
];

async function createProductData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tuma-africa-cargo');
    console.log('Connected to MongoDB');

    // Find an admin user to assign as creator
    const admin = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    if (!admin) {
      console.log('No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    console.log(`Creating products with admin: ${admin.fullName} (${admin.email})`);

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Create products
    const products = [];
    for (const productData of sampleProducts) {
      const product = new Product({
        ...productData,
        createdBy: admin._id,
        lastUpdatedBy: admin._id,
        popularity: {
          views: Math.floor(Math.random() * 1000) + 100,
          orders: Math.floor(Math.random() * 50) + 5,
          rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
          reviewCount: Math.floor(Math.random() * 100) + 10
        }
      });

      await product.save();
      products.push(product);
      console.log(`Created product: ${product.name} - $${product.price}`);
    }

    console.log(`\nSuccessfully created ${products.length} products!`);
    console.log('\nProduct Summary:');
    products.forEach(product => {
      console.log(`- ${product.name} (${product.category}) - $${product.price} ${product.featured ? '⭐' : ''}`);
    });

    // Display category breakdown
    const categories = {};
    products.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });

    console.log('\nCategory Breakdown:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`- ${category}: ${count} products`);
    });

  } catch (error) {
    console.error('Error creating product data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createProductData();
}

module.exports = createProductData;