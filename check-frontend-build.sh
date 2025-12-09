#!/bin/bash

echo "🔍 Checking Frontend Build Status..."
echo "=================================="

PROJECT_DIR="/root/project/tuma-africa"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BUILD_DIR="$FRONTEND_DIR/build"

echo ""
echo "1. Checking if build directory exists:"
if [ -d "$BUILD_DIR" ]; then
    echo "   ✅ Build directory exists: $BUILD_DIR"
    echo "   📁 Contents:"
    ls -la "$BUILD_DIR" | head -10
    echo ""
    echo "   📊 Size:"
    du -sh "$BUILD_DIR"
else
    echo "   ❌ Build directory NOT found: $BUILD_DIR"
    echo "   💡 You need to build the frontend first!"
fi

echo ""
echo "2. Checking Nginx configuration:"
if [ -f "/etc/nginx/sites-available/tuma-africa" ]; then
    echo "   ✅ Nginx config found"
    echo "   📄 Root path in config:"
    grep -i "root" /etc/nginx/sites-available/tuma-africa | grep -v "^#" | head -3
else
    echo "   ❌ Nginx config not found at /etc/nginx/sites-available/tuma-africa"
fi

echo ""
echo "3. Checking Nginx error log (last 10 lines):"
if [ -f "/var/log/nginx/error.log" ]; then
    sudo tail -10 /var/log/nginx/error.log
else
    echo "   ⚠️  Error log not found"
fi

echo ""
echo "4. Checking directory permissions:"
if [ -d "$BUILD_DIR" ]; then
    ls -ld "$BUILD_DIR"
    echo ""
    echo "   Checking if nginx user can access:"
    sudo -u www-data test -r "$BUILD_DIR/index.html" && echo "   ✅ Nginx can read index.html" || echo "   ❌ Nginx CANNOT read index.html"
fi

echo ""
echo "=================================="

