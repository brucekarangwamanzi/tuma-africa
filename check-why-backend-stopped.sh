#!/bin/bash

echo "🔍 Investigating Why Backend Stopped..."
echo "======================================="

PROJECT_DIR="/root/project/tuma-africa"

echo ""
echo "1️⃣  Checking PM2 process status..."
pm2 status
pm2 jlist | grep -A 15 "tuma-africa-backend" || echo "   Backend not in PM2 list"

echo ""
echo "2️⃣  Checking backend logs (last 30 lines)..."
if pm2 list | grep -q "tuma-africa-backend"; then
    echo "   PM2 logs:"
    pm2 logs tuma-africa-backend --lines 30 --nostream
else
    echo "   ⚠️  Backend not running in PM2"
    if [ -f "$PROJECT_DIR/logs/backend-error.log" ]; then
        echo "   Error log file:"
        tail -30 "$PROJECT_DIR/logs/backend-error.log"
    fi
    if [ -f "$PROJECT_DIR/logs/backend-out.log" ]; then
        echo "   Output log file:"
        tail -30 "$PROJECT_DIR/logs/backend-out.log"
    fi
fi

echo ""
echo "3️⃣  Checking if port 5001 is in use..."
if lsof -i :5001 2>/dev/null | grep -q LISTEN; then
    echo "   ✅ Port 5001 is in use:"
    lsof -i :5001
else
    echo "   ❌ Port 5001 is NOT in use (backend not listening)"
fi

echo ""
echo "4️⃣  Checking system resources..."
echo "   Memory usage:"
free -h | head -2
echo "   Disk space:"
df -h / | tail -1

echo ""
echo "5️⃣  Checking for port conflicts..."
echo "   Node processes:"
ps aux | grep -E "node|npm" | grep -v grep || echo "   No node processes found"

echo ""
echo "6️⃣  Checking PM2 error history..."
pm2 logs tuma-africa-backend --err --lines 20 --nostream 2>/dev/null || echo "   No error logs available"

echo ""
echo "======================================="
echo "💡 Common causes:"
echo "   - Out of memory"
echo "   - Port conflict"
echo "   - Database connection error"
echo "   - PM2 process crashed"
echo ""
echo "🔄 To restart: ./restart-backend.sh"

