#!/bin/bash

set -e

echo "🔄 Restarting Backend..."
echo "========================"

PROJECT_DIR="/root/project/tuma-africa"

cd "$PROJECT_DIR"

# Check PM2 status
echo ""
echo "1️⃣  Checking PM2 status..."
pm2 status

# Check if backend process exists
if pm2 list | grep -q "tuma-africa-backend"; then
    echo ""
    echo "2️⃣  Backend process found in PM2"
    echo "   Checking if it's running..."
    
    # Get status
    STATUS=$(pm2 jlist | grep -A 10 "tuma-africa-backend" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$STATUS" != "online" ]; then
        echo "   ⚠️  Backend is not online (status: $STATUS)"
        echo "   📋 Recent logs:"
        pm2 logs tuma-africa-backend --lines 10 --nostream
        echo ""
        echo "   🔄 Restarting backend..."
        pm2 restart tuma-africa-backend
    else
        echo "   ✅ Backend is online"
        echo "   🔄 Restarting anyway to ensure it's fresh..."
        pm2 restart tuma-africa-backend
    fi
else
    echo ""
    echo "2️⃣  Backend process NOT found in PM2"
    echo "   🚀 Starting backend..."
    
    # Check if ecosystem.config.js exists
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        echo "   ⚠️  ecosystem.config.js not found, starting manually..."
        pm2 start backend/server.js --name tuma-africa-backend --cwd "$PROJECT_DIR"
    fi
fi

# Wait a moment
sleep 2

# Check if backend started successfully
echo ""
echo "3️⃣  Verifying backend is running..."
if pm2 list | grep -q "tuma-africa-backend.*online"; then
    echo "   ✅ Backend is now running!"
    
    # Test health endpoint
    echo ""
    echo "4️⃣  Testing health endpoint..."
    sleep 1
    if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        echo "   ✅ Health endpoint responding"
        echo "   Response:"
        curl -s http://localhost:5001/api/health | head -3
    else
        echo "   ⚠️  Health endpoint not responding yet (may need a moment)"
    fi
else
    echo "   ❌ Backend failed to start"
    echo "   📋 Error logs:"
    pm2 logs tuma-africa-backend --lines 20 --nostream
    exit 1
fi

# Save PM2 configuration
pm2 save

echo ""
echo "========================"
echo "✅ Backend restart complete!"
echo ""
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs tuma-africa-backend"
echo "🌐 Test API: curl http://213.199.35.46/api/health"

