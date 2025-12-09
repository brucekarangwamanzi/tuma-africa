const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tuma-africa-cargo', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const superAdminData = {
      fullName: 'Super Admin',
      email: 'admin@tumaafricacargo.com',
      phone: '+1234567890',
      role: 'super_admin',
      verified: true,
      approved: true,
      isActive: true
    };

    // Check if super admin already exists
    let superAdmin = await User.findOne({ email: superAdminData.email });

    if (superAdmin) {
      console.log('Super admin already exists. Updating...');
      
      // Update existing super admin
      superAdmin.fullName = superAdminData.fullName;
      superAdmin.phone = superAdminData.phone;
      superAdmin.role = 'super_admin';
      superAdmin.verified = true;
      superAdmin.approved = true;
      superAdmin.isActive = true;
      superAdmin.passwordHash = 'admin123'; // Will be hashed by pre-save middleware
      
      await superAdmin.save();
      console.log('✅ Super admin updated successfully!');
    } else {
      console.log('Creating new super admin...');
      
      // Create new super admin
      superAdmin = new User({
        ...superAdminData,
        passwordHash: 'admin123' // Will be hashed by pre-save middleware
      });
      
      await superAdmin.save();
      console.log('✅ Super admin created successfully!');
    }

    console.log('\n📧 Super Admin Credentials:');
    console.log('Email:', superAdminData.email);
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
