/**
 * Test script for creating a product via API
 * 
 * Usage:
 *   node test-create-product.js
 * 
 * Make sure your server is running on http://localhost:5001
 */

const http = require('http');

const API_BASE = 'http://localhost:5001/api';

// Test credentials (update these with your Super Admin credentials)
const TEST_CREDENTIALS = {
  email: 'superadmin@example.com',  // Change this
  password: 'your-password'           // Change this
};

// Test product data
const TEST_PRODUCT = {
  name: "Test Product - " + new Date().toISOString(),
  description: "This is a test product created via API test script",
  price: 99.99,
  originalPrice: 129.99,
  imageUrl: "https://via.placeholder.com/500",
  category: "Test Category",
  subcategory: "Test Subcategory",
  featured: true,
  status: "published",
  tags: ["test", "api", "automated"]
};

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testCreateProduct() {
  console.log('🧪 Testing Create Product API\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Logging in...');
    console.log(`   Email: ${TEST_CREDENTIALS.email}`);
    
    const loginResponse = await makeRequest('POST', '/auth/login', TEST_CREDENTIALS);
    
    if (loginResponse.status !== 200) {
      console.error('❌ Login failed!');
      console.error('   Status:', loginResponse.status);
      console.error('   Response:', loginResponse.data);
      console.log('\n💡 Make sure:');
      console.log('   1. Server is running on http://localhost:5001');
      console.log('   2. Super Admin credentials are correct');
      console.log('   3. Update TEST_CREDENTIALS in this script');
      return;
    }

    const token = loginResponse.data.accessToken;
    console.log('✅ Login successful!');
    console.log('   Token:', token.substring(0, 20) + '...');

    // Step 2: Create Product
    console.log('\n📦 Step 2: Creating product...');
    console.log('   Product:', TEST_PRODUCT.name);
    
    const createResponse = await makeRequest('POST', '/products', TEST_PRODUCT, token);
    
    if (createResponse.status === 201) {
      console.log('✅ Product created successfully!');
      console.log('\n📋 Product Details:');
      console.log('   ID:', createResponse.data.product._id);
      console.log('   Name:', createResponse.data.product.name);
      console.log('   Price: $' + createResponse.data.product.price);
      console.log('   Status:', createResponse.data.product.status);
      console.log('   Category:', createResponse.data.product.category);
      console.log('\n🎉 Test completed successfully!');
    } else if (createResponse.status === 403) {
      console.error('❌ Access denied!');
      console.error('   Response:', createResponse.data);
      console.log('\n💡 You need Super Admin role to create products.');
      console.log('   Check your user role in the database.');
    } else if (createResponse.status === 401) {
      console.error('❌ Unauthorized!');
      console.error('   Response:', createResponse.data);
      console.log('\n💡 Token might be invalid or expired.');
    } else if (createResponse.status === 400) {
      console.error('❌ Validation error!');
      console.error('   Response:', createResponse.data);
      console.log('\n💡 Check the product data format.');
    } else {
      console.error('❌ Unexpected error!');
      console.error('   Status:', createResponse.status);
      console.error('   Response:', createResponse.data);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Make sure your server is running:');
    console.log('   npm run server');
  }
}

// Run the test
testCreateProduct();

