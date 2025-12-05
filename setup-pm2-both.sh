#!/bin/bash

set -e

echo "🚀 Setting Up PM2 for Backend and Frontend..."
echo "=============================================="

PROJECT_DIR="/root/project/tuma-africa"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"

# Step 1: Install serve package globally (for frontend)
echo ""
echo "1️⃣  Installing serve package for frontend..."
if ! command -v serve &> /dev/null; then
    echo "   Installing serve globally..."
    npm install -g serve
else
    echo "   ✅ serve is already installed"
fi

# Step 2: Ensure frontend is built
echo ""
echo "2️⃣  Checking frontend build..."
if [ ! -d "$FRONTEND_DIR/build" ]; then
    echo "   ⚠️  Frontend build not found. Building..."
    cd "$FRONTEND_DIR"
    
    # Create .env.production if needed
    if [ ! -f ".env.production" ]; then
        echo "   Creating .env.production..."
        cat > .env.production << EOF
REACT_APP_API_URL=http://213.199.35.46/api
REACT_APP_WS_URL=http://213.199.35.46
EOF
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "   Installing frontend dependencies..."
        npm install
    fi
    
    # Build frontend
    echo "   Building frontend..."
    npm run build
    
    if [ ! -d "build" ]; then
        echo "   ❌ Build failed!"
        exit 1
    fi
    
    echo "   ✅ Frontend built successfully"
else
    echo "   ✅ Frontend build exists"
fi

# Step 3: Create logs directory
echo ""
echo "3️⃣  Creating logs directory..."
mkdir -p "$PROJECT_DIR/logs"
echo "   ✅ Logs directory created"

# Step 4: Stop existing PM2 processes
echo ""
echo "4️⃣  Stopping existing PM2 processes..."
pm2 stop tuma-africa-backend 2>/dev/null || true
pm2 stop tuma-africa-frontend 2>/dev/null || true
pm2 delete tuma-africa-backend 2>/dev/null || true
pm2 delete tuma-africa-frontend 2>/dev/null || true

# Step 5: Start both processes with PM2
echo ""
echo "5️⃣  Starting backend and frontend with PM2..."
cd "$PROJECT_DIR"

if [ -f "ecosystem.config.js" ]; then
    echo "   Starting with ecosystem.config.js..."
    pm2 start ecosystem.config.js
else
    echo "   ⚠️  ecosystem.config.js not found, starting manually..."
    
    # Start backend
    pm2 start "$BACKEND_DIR/server.js" \
        --name tuma-africa-backend \
        --cwd "$PROJECT_DIR" \
        --env NODE_ENV=production \
        --error "$PROJECT_DIR/logs/backend-error.log" \
        --out "$PROJECT_DIR/logs/backend-out.log" \
        --log-date-format "YYYY-MM-DD HH:mm:ss Z" \
        --merge-logs \
        --autorestart \
        --max-memory-restart 1G
    
    # Start frontend
    cd "$FRONTEND_DIR"
    pm2 start "npx serve -s build -l 3000" \
        --name tuma-africa-frontend \
        --cwd "$FRONTEND_DIR" \
        --env NODE_ENV=production \
        --error "$PROJECT_DIR/logs/frontend-error.log" \
        --out "$PROJECT_DIR/logs/frontend-out.log" \
        --log-date-format "YYYY-MM-DD HH:mm:ss Z" \
        --merge-logs \
        --autorestart \
        --max-memory-restart 500M
fi

# Step 6: Save PM2 configuration
echo ""
echo "6️⃣  Saving PM2 configuration..."
pm2 save

# Step 7: Setup PM2 startup (if not already done)
echo ""
echo "7️⃣  Setting up PM2 startup..."
if ! pm2 startup | grep -q "already"; then
    echo "   Follow the instructions above to enable PM2 on boot"
else
    echo "   ✅ PM2 startup already configured"
fi

# Step 8: Wait and verify
echo ""
echo "8️⃣  Verifying processes..."
sleep 3

pm2 status

echo ""
echo "=============================================="
echo "✅ PM2 Setup Complete!"
echo ""
echo "📊 Check status:"
echo "   pm2 status"
echo ""
echo "📋 View logs:"
echo "   pm2 logs tuma-africa-backend"
echo "   pm2 logs tuma-africa-frontend"
echo ""
echo "🔄 Restart processes:"
echo "   pm2 restart all"
echo "   pm2 restart tuma-africa-backend"
echo "   pm2 restart tuma-africa-frontend"
echo ""
echo "🧪 Test endpoints:"
echo "   Backend:  curl http://localhost:5001/api/health"
echo "   Frontend: curl http://localhost:3000"
echo "   Through Nginx: curl http://213.199.35.46"

