#!/bin/bash

set -e

echo "🔐 Fixing Nginx Permissions..."
echo "=================================="

PROJECT_DIR="/root/project/tuma-africa"
BUILD_DIR="$PROJECT_DIR/frontend/build"

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found: $BUILD_DIR"
    echo "💡 Run 'cd frontend && npm run build' first"
    exit 1
fi

echo "📁 Build directory found: $BUILD_DIR"
echo ""

# Option 1: Fix permissions (Recommended)
echo "Option 1: Fixing permissions for www-data user..."
echo "--------------------------------------------------"

# Make sure the entire path is accessible
# Set execute permission on all parent directories so www-data can traverse
sudo chmod 755 /root
sudo chmod 755 /root/project
sudo chmod 755 /root/project/tuma-africa
sudo chmod 755 /root/project/tuma-africa/frontend

# Set permissions on build directory
sudo chmod -R 755 "$BUILD_DIR"
sudo chmod -R o+r "$BUILD_DIR"

# Ensure index.html is readable
if [ -f "$BUILD_DIR/index.html" ]; then
    sudo chmod 644 "$BUILD_DIR/index.html"
    echo "✅ Fixed permissions on index.html"
fi

# Test if www-data can access
echo ""
echo "🧪 Testing if www-data can access files..."
if sudo -u www-data test -r "$BUILD_DIR/index.html"; then
    echo "✅ www-data can read index.html"
else
    echo "❌ www-data still cannot read files"
    echo ""
    echo "Trying alternative approach..."
    
    # Add www-data to root group (if needed)
    sudo usermod -a -G root www-data || true
    
    # Set group ownership
    sudo chgrp -R www-data "$BUILD_DIR"
    sudo chmod -R g+r "$BUILD_DIR"
    sudo chmod g+x "$BUILD_DIR"
    
    # Also fix parent directories
    sudo chgrp www-data /root/project/tuma-africa/frontend
    sudo chmod g+x /root/project/tuma-africa/frontend
fi

echo ""
echo "=================================="
echo "✅ Permissions fixed!"
echo ""
echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "🧪 Test it now:"
echo "   curl http://213.199.35.46"
echo ""
echo "📋 If still not working, check:"
echo "   sudo tail -f /var/log/nginx/error.log"

