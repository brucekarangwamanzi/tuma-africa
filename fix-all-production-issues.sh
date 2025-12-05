#!/bin/bash

set -e

echo "🔧 Fixing All Production Issues..."
echo "===================================="

PROJECT_DIR="/root/project/tuma-africa"
BUILD_DIR="$PROJECT_DIR/frontend/build"

# ============================================
# Issue 1: Fix Nginx Permissions
# ============================================
echo ""
echo "1️⃣  Fixing Nginx Permissions..."
echo "--------------------------------"

# Make parent directories traversable
echo "   Making parent directories accessible..."
sudo chmod 755 /root
sudo chmod 755 /root/project
sudo chmod 755 /root/project/tuma-africa
sudo chmod 755 /root/project/tuma-africa/frontend

# Fix build directory permissions
if [ -d "$BUILD_DIR" ]; then
    echo "   Fixing build directory permissions..."
    sudo chmod -R 755 "$BUILD_DIR"
    sudo chmod -R o+r "$BUILD_DIR"
    
    # Make sure index.html is readable
    if [ -f "$BUILD_DIR/index.html" ]; then
        sudo chmod 644 "$BUILD_DIR/index.html"
        echo "   ✅ Fixed index.html permissions"
    fi
    
    # Test access
    if sudo -u www-data test -r "$BUILD_DIR/index.html"; then
        echo "   ✅ www-data can now read files"
    else
        echo "   ⚠️  Still having permission issues, trying alternative..."
        # Add www-data to root group temporarily
        sudo chgrp -R www-data "$BUILD_DIR" 2>/dev/null || true
        sudo chmod -R g+r "$BUILD_DIR"
    fi
else
    echo "   ❌ Build directory not found! Building frontend..."
    cd "$PROJECT_DIR/frontend"
    
    # Create .env.production if needed
    if [ ! -f ".env.production" ]; then
        cat > .env.production << EOF
REACT_APP_API_URL=http://213.199.35.46/api
REACT_APP_WS_URL=http://213.199.35.46
EOF
    fi
    
    npm install
    npm run build
    
    # Fix permissions after build
    sudo chmod -R 755 build
    sudo chmod -R o+r build
fi

# ============================================
# Issue 2: Fix Backend Connection
# ============================================
echo ""
echo "2️⃣  Fixing Backend Connection..."
echo "--------------------------------"

# Check if backend is running
if ! pgrep -f "node.*backend/server.js" > /dev/null; then
    echo "   ⚠️  Backend is not running!"
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        echo "   📦 Installing PM2..."
        npm install -g pm2
    fi
    
    # Check if ecosystem.config.js exists
    if [ -f "$PROJECT_DIR/ecosystem.config.js" ]; then
        echo "   🚀 Starting backend with PM2..."
        cd "$PROJECT_DIR"
        pm2 start ecosystem.config.js || pm2 restart tuma-africa-backend
    else
        echo "   📝 Creating ecosystem.config.js..."
        cat > "$PROJECT_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'tuma-africa-backend',
    script: './backend/server.js',
    cwd: '/root/project/tuma-africa',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF
        mkdir -p "$PROJECT_DIR/logs"
        cd "$PROJECT_DIR"
        pm2 start ecosystem.config.js
    fi
    
    pm2 save
    
    # Wait a moment for backend to start
    sleep 2
    
    # Check if backend started
    if pgrep -f "node.*backend/server.js" > /dev/null; then
        echo "   ✅ Backend is now running!"
    else
        echo "   ❌ Backend failed to start. Check logs:"
        echo "      pm2 logs tuma-africa-backend"
    fi
else
    echo "   ✅ Backend is already running"
fi

# Check if backend is listening on port 5001
echo ""
echo "   Checking backend connection..."
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "   ✅ Backend is responding on port 5001"
else
    echo "   ⚠️  Backend is not responding on port 5001"
    echo "   Check backend logs: pm2 logs tuma-africa-backend"
fi

# ============================================
# Issue 3: Fix Nginx Configuration
# ============================================
echo ""
echo "3️⃣  Checking Nginx Configuration..."
echo "--------------------------------"

# Check if Nginx config exists
if [ ! -f "/etc/nginx/sites-available/tuma-africa" ]; then
    echo "   📝 Creating Nginx configuration..."
    sudo tee /etc/nginx/sites-available/tuma-africa > /dev/null << 'EOF'
server {
    listen 80;
    server_name 213.199.35.46;

    # Frontend static files
    location / {
        root /root/project/tuma-africa/frontend/build;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO WebSocket
    location /socket.io {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger API Docs
    location /api-docs {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /api/health {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/tuma-africa /etc/nginx/sites-enabled/
    
    # Remove default if exists
    if [ -f "/etc/nginx/sites-enabled/default" ]; then
        sudo rm /etc/nginx/sites-enabled/default
    fi
fi

# Fix proxy_pass to use 127.0.0.1 instead of localhost or [::1]
echo "   🔧 Fixing proxy_pass to use 127.0.0.1..."
sudo sed -i 's|proxy_pass http://localhost:5001|proxy_pass http://127.0.0.1:5001|g' /etc/nginx/sites-available/tuma-africa
sudo sed -i 's|proxy_pass http://\[::1\]:5001|proxy_pass http://127.0.0.1:5001|g' /etc/nginx/sites-available/tuma-africa

# Test and reload Nginx
echo ""
echo "   🧪 Testing Nginx configuration..."
if sudo nginx -t; then
    echo "   ✅ Nginx configuration is valid"
    echo "   🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    echo "   ✅ Nginx reloaded!"
else
    echo "   ❌ Nginx configuration has errors!"
    exit 1
fi

# ============================================
# Summary
# ============================================
echo ""
echo "===================================="
echo "✅ All fixes applied!"
echo ""
echo "🧪 Testing..."
echo "   Frontend: curl http://213.199.35.46"
echo "   Backend:  curl http://213.199.35.46/api/health"
echo ""
echo "📊 Check status:"
echo "   PM2:  pm2 status"
echo "   Nginx: sudo systemctl status nginx"
echo ""
echo "📋 View logs:"
echo "   PM2:  pm2 logs tuma-africa-backend"
echo "   Nginx: sudo tail -f /var/log/nginx/error.log"

