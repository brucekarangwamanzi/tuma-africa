const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
require('dotenv').config();

const sampleOrders = [
  {
    productName: "iPhone 15 Pro Max 256GB",
    productLink: "https://www.apple.com/iphone-15-pro/",
    quantity: 1,
    unitPrice: 1199,
    shippingCost: 50,
    totalPrice: 1199,
    finalAmount: 1249,
    status: "pending",
    priority: "high",
    description: "Latest iPhone model with titanium design",
    specifications: {
      color: "Natural Titanium",
      size: "256GB",
      brand: "Apple",
      model: "iPhone 15 Pro Max"
    }
  },
  {
    productName: "MacBook Air M3 13-inch",
    productLink: "https://www.apple.com/macbook-air/",
    quantity: 1,
    unitPrice: 1099,
    shippingCost: 75,
    totalPrice: 1099,
    finalAmount: 1174,
    status: "processing",
    priority: "normal",
    description: "Lightweight laptop with M3 chip",
    specifications: {
      color: "Midnight",
      size: "13-inch",
      brand: "Apple",
      model: "MacBook Air M3"
    }
  },
  {
    productName: "Sony WH-1000XM5 Headphones",
    productLink: "https://www.sony.com/headphones/wh-1000xm5",
    quantity: 2,
    unitPrice: 399,
    shippingCost: 25,
    totalPrice: 798,
    finalAmount: 823,
    status: "shipped",
    priority: "normal",
    description: "Premium noise-canceling headphones",
    specifications: {
      color: "Black",
      brand: "Sony",
      model: "WH-1000XM5"
    },
    trackingInfo: {
      trackingNumber: "1Z999AA1234567890",
      carrier: "UPS",
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    }
  },
  {
    productName: "Samsung Galaxy S24 Ultra",
    productLink: "https://www.samsung.com/galaxy-s24-ultra/",
    quantity: 1,
    unitPrice: 1299,
    shippingCost: 50,
    totalPrice: 1299,
    finalAmount: 1349,
    status: "delivered",
    priority: "urgent",
    description: "Flagship Android smartphone with S Pen",
    specifications: {
      color: "Titanium Gray",
      size: "512GB",
      brand: "Samsung",
      model: "Galaxy S24 Ultra"
    },
    trackingInfo: {
      trackingNumber: "1Z999AA0987654321",
      carrier: "FedEx",
      estimatedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  },
  {
    productName: "Dell XPS 13 Laptop",
    productLink: "https://www.dell.com/xps-13/",
    quantity: 1,
    unitPrice: 999,
    shippingCost: 60,
    totalPrice: 999,
    finalAmount: 1059,
    status: "cancelled",
    priority: "low",
    description: "Compact Windows laptop for productivity",
    specifications: {
      color: "Platinum Silver",
      size: "13-inch",
      brand: "Dell",
      model: "XPS 13"
    }
  }
];

async function createOrderData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tuma-africa-cargo');
    console.log('Connected to MongoDB');

    // Find a user to assign orders to
    const user = await User.findOne({ role: 'user' });
    if (!user) {
      console.log('No user found. Please create a user first.');
      process.exit(1);
    }

    console.log(`Creating orders for user: ${user.fullName} (${user.email})`);

    // Clear existing orders for this user
    await Order.deleteMany({ userId: user._id });
    console.log('Cleared existing orders');

    // Create orders
    const orders = [];
    for (const orderData of sampleOrders) {
      const order = new Order({
        ...orderData,
        userId: user._id,
        shippingAddress: {
          fullName: user.fullName,
          phone: user.phone || '+1234567890',
          street: '123 Main Street',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001'
        },
        stageHistory: [{
          stage: orderData.status,
          timestamp: new Date(),
          notes: `Order ${orderData.status}`
        }]
      });

      await order.save();
      orders.push(order);
      console.log(`Created order: ${order.orderId} - ${order.productName}`);
    }

    console.log(`\nSuccessfully created ${orders.length} orders!`);
    console.log('\nOrder Summary:');
    orders.forEach(order => {
      console.log(`- ${order.orderId}: ${order.productName} (${order.status})`);
    });

  } catch (error) {
    console.error('Error creating order data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createOrderData();
}

module.exports = createOrderData;