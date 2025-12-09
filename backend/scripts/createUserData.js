const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const sampleUsers = [
  {
    fullName: "John Smith",
    email: "john.smith@example.com",
    phone: "+1234567890",
    password: "password123",
    approved: false, // Pending approval
    verified: true,
    address: {
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      country: "USA",
      zipCode: "10001"
    }
  },
  {
    fullName: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1234567891",
    password: "password123",
    approved: false, // Pending approval
    verified: false,
    address: {
      street: "456 Oak Avenue",
      city: "Los Angeles",
      state: "CA",
      country: "USA",
      zipCode: "90210"
    }
  },
  {
    fullName: "Michael Brown",
    email: "michael.brown@example.com",
    phone: "+1234567892",
    password: "password123",
    approved: true, // Already approved
    verified: true,
    address: {
      street: "789 Pine Road",
      city: "Chicago",
      state: "IL",
      country: "USA",
      zipCode: "60601"
    }
  },
  {
    fullName: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "+1234567893",
    password: "password123",
    approved: false, // Pending approval
    verified: true,
    address: {
      street: "321 Elm Street",
      city: "Houston",
      state: "TX",
      country: "USA",
      zipCode: "77001"
    }
  },
  {
    fullName: "David Wilson",
    email: "david.wilson@example.com",
    phone: "+1234567894",
    password: "password123",
    approved: true, // Already approved
    verified: false,
    address: {
      street: "654 Maple Drive",
      city: "Phoenix",
      state: "AZ",
      country: "USA",
      zipCode: "85001"
    }
  },
  {
    fullName: "Lisa Anderson",
    email: "lisa.anderson@example.com",
    phone: "+1234567895",
    password: "password123",
    approved: false, // Pending approval
    verified: false,
    address: {
      street: "987 Cedar Lane",
      city: "Philadelphia",
      state: "PA",
      country: "USA",
      zipCode: "19101"
    }
  }
];

async function createUserData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tuma-africa-cargo');
    console.log('Connected to MongoDB');

    // Remove existing sample users (keep admin users)
    await User.deleteMany({ 
      email: { 
        $in: sampleUsers.map(u => u.email) 
      } 
    });
    console.log('Cleared existing sample users');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(userData.password, salt);

      const user = new User({
        ...userData,
        passwordHash,
        role: 'user',
        isActive: true,
        lastLogin: userData.approved ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null // Random login in last 7 days for approved users
      });

      // Remove password from userData before saving
      delete userData.password;

      await user.save();
      users.push(user);
      console.log(`Created user: ${user.fullName} (${user.email}) - ${user.approved ? 'Approved' : 'Pending'}`);
    }

    console.log(`\nSuccessfully created ${users.length} users!`);
    
    // Display summary
    const pendingUsers = users.filter(u => !u.approved);
    const approvedUsers = users.filter(u => u.approved);
    const verifiedUsers = users.filter(u => u.verified);
    
    console.log('\nUser Summary:');
    console.log(`- Total Users: ${users.length}`);
    console.log(`- Pending Approval: ${pendingUsers.length}`);
    console.log(`- Approved: ${approvedUsers.length}`);
    console.log(`- Verified: ${verifiedUsers.length}`);
    
    console.log('\nPending Users (Need Admin Approval):');
    pendingUsers.forEach(user => {
      console.log(`- ${user.fullName} (${user.email}) - ${user.verified ? 'Verified' : 'Unverified'}`);
    });

    console.log('\nApproved Users:');
    approvedUsers.forEach(user => {
      console.log(`- ${user.fullName} (${user.email}) - ${user.verified ? 'Verified' : 'Unverified'}`);
    });

  } catch (error) {
    console.error('Error creating user data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createUserData();
}

module.exports = createUserData;