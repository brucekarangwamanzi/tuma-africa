#!/bin/bash

# Quick Fix Script for 401 Login Error on Production
# Run this on your production server: 213.199.35.46

set -e

PROJECT_DIR="/var/www/tuma-africa"

echo "=========================================="
echo "🔧 Fixing Production Login Issue"
echo "=========================================="

# Update backend .env
echo "📝 Updating backend .env..."
cd "$PROJECT_DIR/backend"
if grep -q "FRONTEND_URL" .env; then
    sed -i 's|FRONTEND_URL=.*|FRONTEND_URL=http://213.199.35.46|' .env
else
    echo "FRONTEND_URL=http://213.199.35.46" >> .env
fi
echo "✅ Backend .env updated"

# Create frontend .env.production
echo "📝 Creating frontend .env.production..."
cd "$PROJECT_DIR/frontend"
cat > .env.production << 'EOF'
REACT_APP_API_URL=http://213.199.35.46/api
REACT_APP_WS_URL=http://213.199.35.46
EOF
echo "✅ Frontend .env.production created"

# Rebuild frontend
echo "🏗️  Rebuilding frontend..."
npm run build
echo "✅ Frontend rebuilt"

# Restart backend (check if PM2 is used)
echo "🔄 Restarting backend..."
if command -v pm2 &> /dev/null && pm2 list | grep -q "tuma"; then
    pm2 restart all
    echo "✅ Backend restarted (PM2)"
else
    echo "⚠️  PM2 not found. Please restart backend manually:"
    echo "   cd $PROJECT_DIR/backend && npm start"
fi

# Restart nginx
echo "🔄 Restarting nginx..."
if command -v systemctl &> /dev/null; then
    sudo systemctl restart nginx
    echo "✅ Nginx restarted"
else
    echo "⚠️  Systemctl not found. Please restart nginx manually"
fi

echo ""
echo "=========================================="
echo "✅ Fix Applied!"
echo "=========================================="
echo ""
echo "📋 Next steps:"
echo "1. Test login: http://213.199.35.46"
echo "2. Check backend logs if issues persist"
echo "3. Verify CORS headers in browser console"
echo ""

