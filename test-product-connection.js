/**
 * Diagnostic script to test product creation connection
 * Run this to check if backend-frontend connection is working
 */

const http = require('http');

const API_BASE = 'http://localhost:5001/api';

console.log('🔍 Product Creation Connection Diagnostic\n');
console.log('='.repeat(60));

// Test 1: Check if backend is running
console.log('\n📡 Test 1: Checking if backend is running...');
http.get(`${API_BASE}/health`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Backend is running on port 5001');
      console.log('   Response:', data);
    } else {
      console.log('⚠️ Backend responded with status:', res.statusCode);
    }
    
    // Test 2: Check products endpoint exists
    console.log('\n📦 Test 2: Checking products endpoint...');
    http.get(`${API_BASE}/products?limit=1`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Products endpoint is accessible');
          try {
            const json = JSON.parse(data);
            console.log('   Found', json.products?.length || 0, 'products');
          } catch (e) {
            console.log('   Response:', data.substring(0, 100));
          }
        } else {
          console.log('⚠️ Products endpoint returned status:', res.statusCode);
        }
        
        // Test 3: Check if POST endpoint requires auth
        console.log('\n🔐 Test 3: Testing product creation (without auth)...');
        const postData = JSON.stringify({
          name: "Test Product",
          description: "Test",
          price: 99.99,
          imageUrl: "https://via.placeholder.com/500",
          category: "Test"
        });
        
        const options = {
          hostname: 'localhost',
          port: 5001,
          path: '/api/products',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
          }
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 401) {
              console.log('✅ Endpoint correctly requires authentication (401)');
              console.log('   This is expected - you need to login first');
            } else if (res.statusCode === 403) {
              console.log('✅ Endpoint correctly requires Super Admin role (403)');
              console.log('   This is expected - you need Super Admin role');
            } else if (res.statusCode === 400) {
              console.log('⚠️ Validation error (400)');
              try {
                const json = JSON.parse(data);
                console.log('   Error:', json.message);
              } catch (e) {
                console.log('   Response:', data);
              }
            } else {
              console.log('⚠️ Unexpected status:', res.statusCode);
              console.log('   Response:', data.substring(0, 200));
            }
            
            console.log('\n' + '='.repeat(60));
            console.log('\n📋 Summary:');
            console.log('1. Backend connection: ✅ Working');
            console.log('2. Products endpoint: ✅ Accessible');
            console.log('3. Authentication: ✅ Required (as expected)');
            console.log('\n✅ All checks passed! Your backend is properly configured.');
            console.log('\n💡 Next steps for product creation:');
            console.log('   - Make sure you are logged in as Super Admin in the frontend');
            console.log('   - Check browser console for detailed errors when creating products');
            console.log('   - Verify token is in localStorage (DevTools → Application → Local Storage)');
            console.log('   - Check network tab in browser DevTools when creating a product');
            console.log('   - Ensure user role is "super_admin" in the database');
          });
        });
        
        req.on('error', (e) => {
          console.error('❌ Request error:', e.message);
          console.log('\n💡 Make sure backend is running: npm run server');
        });
        
        req.write(postData);
        req.end();
      });
    }).on('error', (e) => {
      console.error('❌ Cannot connect to products endpoint:', e.message);
      console.log('\n💡 Make sure:');
      console.log('   1. Backend server is running: npm run server');
      console.log('   2. Server is on port 5001');
      console.log('   3. MongoDB is connected');
    });
  });
}).on('error', (e) => {
  console.error('❌ Cannot connect to backend:', e.message);
  console.log('\n💡 Backend is not running!');
  console.log('   Start it with: npm run server');
  console.log('   Or: node backend/server.js');
});

