#!/bin/bash

set -e

echo "🔄 Restarting Backend and Frontend..."
echo "======================================"

PROJECT_DIR="/root/project/tuma-africa"

cd "$PROJECT_DIR"

# Check if ecosystem.config.js exists
if [ -f "ecosystem.config.js" ]; then
    echo ""
    echo "📋 Current PM2 status:"
    pm2 status
    
    echo ""
    echo "🔄 Restarting all processes..."
    pm2 restart ecosystem.config.js
    
    echo ""
    echo "⏳ Waiting for processes to start..."
    sleep 3
    
    echo ""
    echo "📊 Updated PM2 status:"
    pm2 status
    
    # Test endpoints
    echo ""
    echo "🧪 Testing endpoints..."
    
    if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        echo "   ✅ Backend is responding on port 5001"
    else
        echo "   ⚠️  Backend not responding yet"
    fi
    
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "   ✅ Frontend is responding on port 3000"
    else
        echo "   ⚠️  Frontend not responding yet"
    fi
    
    # Save PM2 config
    pm2 save
    
    echo ""
    echo "======================================"
    echo "✅ Restart complete!"
    echo ""
    echo "📋 View logs:"
    echo "   pm2 logs tuma-africa-backend"
    echo "   pm2 logs tuma-africa-frontend"
else
    echo "❌ ecosystem.config.js not found!"
    echo "   Run: ./setup-pm2-both.sh first"
    exit 1
fi

