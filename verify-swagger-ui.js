const http = require('http');

console.log('Testing Swagger UI accessibility...\n');

// Test 1: Check if server is running
http.get('http://localhost:5001/api/health', (res) => {
  console.log('✅ Server is running');
  console.log('   Health check status:', res.statusCode);
  
  // Test 2: Check Swagger UI HTML
  http.get('http://localhost:5001/api-docs/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (data.includes('Tuma-Africa API Documentation')) {
        console.log('✅ Swagger UI HTML is accessible');
      } else {
        console.log('❌ Swagger UI HTML not found');
      }
      
      // Test 3: Check Swagger JSON
      http.get('http://localhost:5001/api-docs/swagger.json', (res) => {
        let jsonData = '';
        res.on('data', chunk => jsonData += chunk);
        res.on('end', () => {
          try {
            const swagger = JSON.parse(jsonData);
            const authPaths = Object.keys(swagger.paths || {}).filter(p => p.includes('auth'));
            
            console.log('✅ Swagger JSON is accessible');
            console.log(`   Total paths: ${Object.keys(swagger.paths || {}).length}`);
            console.log(`   Authentication paths: ${authPaths.length}`);
            
            if (authPaths.length > 0) {
              console.log('\n✅ Authentication endpoints found:');
              authPaths.forEach(path => {
                const methods = Object.keys(swagger.paths[path] || {});
                console.log(`   ${methods.join(', ').toUpperCase()} ${path}`);
              });
              console.log('\n🎉 Everything is working!');
              console.log('\n👉 Open your browser and go to: http://localhost:5001/api-docs');
              console.log('👉 Look for "Authentication" in the left sidebar');
            } else {
              console.log('❌ No authentication endpoints found in Swagger JSON');
            }
          } catch (e) {
            console.log('❌ Error parsing Swagger JSON:', e.message);
          }
        });
      }).on('error', (e) => {
        console.log('❌ Cannot access Swagger JSON:', e.message);
      });
    });
  }).on('error', (e) => {
    console.log('❌ Cannot access Swagger UI:', e.message);
  });
}).on('error', (e) => {
  console.log('❌ Server is not running on port 5001');
  console.log('   Error:', e.message);
  console.log('\n👉 Please start your server: npm run server');
});

