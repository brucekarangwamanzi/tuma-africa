const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('Testing super admin login...\n');
    
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@tumaafricacargo.com',
      password: 'admin123'
    });

    console.log('✅ Login successful!\n');
    console.log('User:', response.data.user);
    console.log('\nAccess Token:', response.data.accessToken.substring(0, 50) + '...');
    console.log('\n🎉 Super admin credentials are working!');
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
};

testLogin();
