const { User } = require('../models');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('🔄 Creating admin users...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@tuma-africa.com' }
    });

    if (!existingAdmin) {
      // Create admin user
      // Note: passwordHash will be automatically hashed by the User model's beforeCreate hook
      const admin = await User.create({
        fullName: 'Admin User',
        email: 'admin@tuma-africa.com',
        phone: '+254700000001',
        passwordHash: 'admin123', // Will be hashed by beforeCreate hook
        role: 'admin',
        verified: true,
        approved: true,
        isActive: true,
        currency: 'USD'
      });
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@tuma-africa.com');
      console.log('🔑 Password: admin123');
      console.log('👤 Role: admin');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({
      where: { email: 'superadmin@tuma-africa.com' }
    });

    if (!existingSuperAdmin) {
      // Create super admin user
      const superAdmin = await User.create({
        fullName: 'Super Admin',
        email: 'superadmin@tuma-africa.com',
        phone: '+254700000002',
        passwordHash: 'superadmin123', // Will be hashed by beforeCreate hook
        role: 'super_admin',
        verified: true,
        approved: true,
        isActive: true,
        currency: 'USD'
      });
      console.log('✅ Super Admin user created successfully!');
      console.log('📧 Email: superadmin@tuma-africa.com');
      console.log('🔑 Password: superadmin123');
      console.log('👤 Role: super_admin');
      return superAdmin;
    } else {
      console.log('✅ Super Admin user already exists');
      return existingSuperAdmin;
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  const { sequelize } = require('../config/database');
  
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connected');
      await createAdminUser();
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { createAdminUser };

