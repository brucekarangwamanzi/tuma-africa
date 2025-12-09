require('dotenv').config();
const { User } = require('./models');

async function testLogin() {
  try {
    console.log('Testing admin login...\n');
    
    // Check environment variables
    console.log('Environment Check:');
    console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('  JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing');
    console.log('  POSTGRES_DB:', process.env.POSTGRES_DB || 'Not set');
    console.log('');
    
    // Find user
    const user = await User.scope('withPassword').findOne({ 
      where: { email: 'admin@tumaafricacargo.com' } 
    });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('User Found:');
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Verified:', user.verified);
    console.log('  Approved:', user.approved);
    console.log('  IsActive:', user.isActive);
    console.log('');
    
    // Test password
    const passwordValid = await user.comparePassword('admin123');
    console.log('Password Test:');
    console.log('  Password "admin123" valid:', passwordValid ? '✅' : '❌');
    console.log('');
    
    if (passwordValid && user.isActive && process.env.JWT_SECRET) {
      console.log('✅ Login should work!');
      console.log('\n📝 To test via API:');
      console.log('   curl -X POST http://localhost:5001/api/auth/login \\');
      console.log('     -H "Content-Type: application/json" \\');
      console.log('     -d \'{"email":"admin@tumaafricacargo.com","password":"admin123"}\'');
      console.log('\n⚠️  Note: Restart the backend server to load new JWT_SECRET');
    } else {
      console.log('❌ Login will fail');
      if (!passwordValid) console.log('   - Password is incorrect');
      if (!user.isActive) console.log('   - User is not active');
      if (!process.env.JWT_SECRET) console.log('   - JWT_SECRET is not set');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();

