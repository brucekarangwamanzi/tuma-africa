#!/bin/bash

echo "🔍 Checking Backend Access..."
echo "=============================="

echo ""
echo "1️⃣  Testing backend locally (should work):"
echo "-------------------------------------------"
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is running and accessible locally"
    echo "   Response:"
    curl -s http://localhost:5001/api/health | head -5
else
    echo "   ❌ Backend is NOT accessible locally"
    echo "   Check if PM2 is running: pm2 status"
fi

echo ""
echo "2️⃣  Testing backend through Nginx (should work):"
echo "-------------------------------------------------"
if curl -s http://213.199.35.46/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is accessible through Nginx"
    echo "   Response:"
    curl -s http://213.199.35.46/api/health | head -5
else
    echo "   ❌ Backend is NOT accessible through Nginx"
    echo "   Check Nginx config and logs"
fi

echo ""
echo "3️⃣  Testing backend directly on port 5001 (should FAIL for security):"
echo "---------------------------------------------------------------------"
if curl -s --connect-timeout 2 http://213.199.35.46:5001/api/health > /dev/null 2>&1; then
    echo "   ⚠️  WARNING: Port 5001 is exposed to the internet!"
    echo "   This is a security risk. Close this port in firewall."
else
    echo "   ✅ Port 5001 is NOT exposed (good for security)"
    echo "   Backend should only be accessed through Nginx on port 80"
fi

echo ""
echo "4️⃣  Checking firewall status:"
echo "-----------------------------"
if command -v ufw &> /dev/null; then
    echo "   UFW status:"
    sudo ufw status | grep -E "(5001|80|443)" || echo "   No rules found for these ports"
else
    echo "   UFW not installed"
fi

echo ""
echo "=============================="
echo "📝 Summary:"
echo "   - Backend should be accessed via: http://213.199.35.46/api"
echo "   - NOT via: http://213.199.35.46:5001 (security risk)"
echo "   - Local testing: http://localhost:5001/api"

