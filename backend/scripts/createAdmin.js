const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tuma-africa-cargo');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@tuma-africa.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@tuma-africa.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      fullName: 'Admin User',
      email: 'admin@tuma-africa.com',
      phone: '+254700000001',
      passwordHash: 'admin123', // This will be hashed by the pre-save middleware
      role: 'admin',
      verified: true,
      approved: true,
      isActive: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('🔐 Admin Credentials:');
    console.log('Email: admin@tuma-africa.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('');

    // Create super admin user
    const existingSuperAdmin = await User.findOne({ email: 'superadmin@tuma-africa.com' });
    if (!existingSuperAdmin) {
      const superAdminUser = new User({
        fullName: 'Super Admin',
        email: 'superadmin@tuma-africa.com',
        phone: '+254700000002',
        passwordHash: 'superadmin123', // This will be hashed by the pre-save middleware
        role: 'super_admin',
        verified: true,
        approved: true,
        isActive: true
      });

      await superAdminUser.save();
      console.log('✅ Super Admin user created successfully!');
      console.log('');
      console.log('🔐 Super Admin Credentials:');
      console.log('Email: superadmin@tuma-africa.com');
      console.log('Password: superadmin123');
      console.log('Role: super_admin');
      console.log('');
    }

    // Create a regular test user
    const existingUser = await User.findOne({ email: 'user@tuma-africa.com' });
    if (!existingUser) {
      const testUser = new User({
        fullName: 'Test User',
        email: 'user@tuma-africa.com',
        phone: '+254700000003',
        passwordHash: 'user123', // This will be hashed by the pre-save middleware
        role: 'user',
        verified: true,
        approved: true,
        isActive: true
      });

      await testUser.save();
      console.log('✅ Test user created successfully!');
      console.log('');
      console.log('🔐 Test User Credentials:');
      console.log('Email: user@tuma-africa.com');
      console.log('Password: user123');
      console.log('Role: user');
      console.log('');
    }

    console.log('🎉 All users created successfully!');
    console.log('');
    console.log('📱 You can now login at: http://localhost:3000/login');
    console.log('🛠️  Admin Dashboard: http://localhost:3000/admin');
    console.log('⚙️  Super Admin CMS: http://localhost:3000/admin/settings');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();