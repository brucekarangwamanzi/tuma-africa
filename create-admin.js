const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./backend/models/User');

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tuma-africa-cargo');
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@tuma-africa-cargo.com' });
    if (existingAdmin) {
      console.log('Deleting existing admin and creating new one...');
      await User.deleteOne({ email: 'admin@tuma-africa-cargo.com' });
    }

    // Create super admin user
    const superAdmin = new User({
      fullName: 'Super Administrator',
      email: 'admin@tuma-africa-cargo.com',
      phone: '+254700000000',
      passwordHash: 'admin123', // Will be hashed by pre-save middleware
      role: 'super_admin',
      verified: true,
      approved: true,
      isActive: true
    });

    await superAdmin.save();
    console.log('✅ Super admin created successfully!');
    console.log('Email: admin@tuma-africa-cargo.com');
    console.log('Password: admin123');
    console.log('Role: super_admin');

    // Create a regular admin user
    const admin = new User({
      fullName: 'Admin User',
      email: 'admin2@tuma-africa-cargo.com',
      phone: '+254700000001',
      passwordHash: 'admin123',
      role: 'admin',
      verified: true,
      approved: true,
      isActive: true
    });

    await admin.save();
    console.log('✅ Regular admin created successfully!');
    console.log('Email: admin2@tuma-africa-cargo.com');
    console.log('Password: admin123');
    console.log('Role: admin');

    // Create a test user
    const testUser = new User({
      fullName: 'Test User',
      email: 'user@test.com',
      phone: '+254700000002',
      passwordHash: 'user123',
      role: 'user',
      verified: true,
      approved: true,
      isActive: true
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('Email: user@test.com');
    console.log('Password: user123');
    console.log('Role: user');

    console.log('\n🎉 All test accounts created successfully!');
    console.log('You can now login to the application with any of these accounts.');

  } catch (error) {
    console.error('❌ Error creating admin users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createSuperAdmin();