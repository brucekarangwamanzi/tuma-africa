#!/bin/bash

set -e

echo "🔧 Fixing Frontend 500 Error..."
echo "=================================="

PROJECT_DIR="/root/project/tuma-africa"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BUILD_DIR="$FRONTEND_DIR/build"

# Step 1: Check if build exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "📦 Building frontend..."
    cd "$FRONTEND_DIR"
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        echo "⚠️  Creating .env.production..."
        cat > .env.production << EOF
REACT_APP_API_URL=http://213.199.35.46/api
REACT_APP_WS_URL=http://213.199.35.46
EOF
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing frontend dependencies..."
        npm install
    fi
    
    # Build frontend
    echo "🏗️  Building frontend for production..."
    npm run build
    
    if [ ! -d "build" ]; then
        echo "❌ Build failed! Check the output above."
        exit 1
    fi
    
    echo "✅ Frontend built successfully!"
else
    echo "✅ Build directory already exists"
fi

# Step 2: Fix permissions
echo ""
echo "🔐 Fixing permissions..."
cd "$PROJECT_DIR"
sudo chown -R root:root "$BUILD_DIR"
sudo chmod -R 755 "$BUILD_DIR"

# Ensure nginx can read the files
sudo chmod -R o+r "$BUILD_DIR"
if [ -f "$BUILD_DIR/index.html" ]; then
    sudo chmod 644 "$BUILD_DIR/index.html"
fi

echo "✅ Permissions fixed!"

# Step 3: Check Nginx config
echo ""
echo "🔍 Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/tuma-africa" ]; then
    NGINX_ROOT=$(grep -i "root" /etc/nginx/sites-available/tuma-africa | grep -v "^#" | awk '{print $2}' | tr -d ';')
    echo "   Nginx root path: $NGINX_ROOT"
    echo "   Expected path: $BUILD_DIR"
    
    if [ "$NGINX_ROOT" != "$BUILD_DIR" ]; then
        echo "⚠️  Nginx root path doesn't match build directory!"
        echo "   Update Nginx config to point to: $BUILD_DIR"
    fi
else
    echo "⚠️  Nginx config not found! Creating it..."
    
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
        proxy_pass http://localhost:5001;
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
        proxy_pass http://localhost:5001;
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
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /api/health {
        proxy_pass http://localhost:5001;
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

# Step 4: Test and reload Nginx
echo ""
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded!"
else
    echo "❌ Nginx configuration has errors!"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ Frontend 500 error should be fixed!"
echo ""
echo "🌐 Test it: curl http://213.199.35.46"
echo "📋 Check logs: sudo tail -f /var/log/nginx/error.log"

