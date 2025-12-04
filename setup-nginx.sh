#!/bin/bash

# Nginx Setup Script for Tuma-Africa Production Server
# IP: 213.199.35.46
# Run this script as root or with sudo

set -e

echo "=========================================="
echo "🚀 Setting up Nginx for Tuma-Africa"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

PROJECT_DIR="/var/www/tuma-africa"
NGINX_CONFIG="/etc/nginx/sites-available/tuma-africa"
NGINX_ENABLED="/etc/nginx/sites-enabled/tuma-africa"

echo -e "${YELLOW}Step 1: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt update
    apt install nginx -y
    echo -e "${GREEN}✅ Nginx installed${NC}"
else
    echo -e "${GREEN}✅ Nginx already installed${NC}"
fi

echo -e "${YELLOW}Step 2: Building frontend...${NC}"
if [ -d "$PROJECT_DIR/frontend" ]; then
    cd "$PROJECT_DIR/frontend"
    if [ ! -d "build" ] || [ "build/index.html" -ot "package.json" ]; then
        echo "Building frontend..."
        npm install
        npm run build
        echo -e "${GREEN}✅ Frontend built${NC}"
    else
        echo -e "${GREEN}✅ Frontend build already exists${NC}"
    fi
else
    echo -e "${RED}❌ Frontend directory not found at $PROJECT_DIR/frontend${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 3: Setting file permissions...${NC}"
chown -R www-data:www-data "$PROJECT_DIR/frontend/build"
chmod -R 755 "$PROJECT_DIR/frontend/build"
echo -e "${GREEN}✅ Permissions set${NC}"

echo -e "${YELLOW}Step 4: Copying Nginx configuration...${NC}"
if [ -f "$PROJECT_DIR/nginx-production.conf" ]; then
    cp "$PROJECT_DIR/nginx-production.conf" "$NGINX_CONFIG"
    echo -e "${GREEN}✅ Configuration copied${NC}"
else
    echo -e "${RED}❌ nginx-production.conf not found at $PROJECT_DIR/nginx-production.conf${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 5: Creating symbolic link...${NC}"
if [ -L "$NGINX_ENABLED" ]; then
    rm "$NGINX_ENABLED"
fi
ln -s "$NGINX_CONFIG" "$NGINX_ENABLED"
echo -e "${GREEN}✅ Symbolic link created${NC}"

echo -e "${YELLOW}Step 6: Removing default nginx site (optional)...${NC}"
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
    echo -e "${GREEN}✅ Default site removed${NC}"
fi

echo -e "${YELLOW}Step 7: Creating log directory...${NC}"
mkdir -p /var/log/nginx
chown www-data:www-data /var/log/nginx
echo -e "${GREEN}✅ Log directory created${NC}"

echo -e "${YELLOW}Step 8: Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 9: Restarting Nginx...${NC}"
systemctl restart nginx
systemctl enable nginx
echo -e "${GREEN}✅ Nginx restarted and enabled${NC}"

echo -e "${YELLOW}Step 10: Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    echo -e "${GREEN}✅ Firewall configured${NC}"
else
    echo -e "${YELLOW}⚠️  UFW not found, configure firewall manually${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Nginx setup completed!${NC}"
echo "=========================================="
echo ""
echo "📋 Next steps:"
echo "1. Ensure backend is running on port 5001:"
echo "   cd $PROJECT_DIR/backend && npm start"
echo ""
echo "2. Test your setup:"
echo "   curl http://213.199.35.46/api/health"
echo ""
echo "3. Check Nginx status:"
echo "   systemctl status nginx"
echo ""
echo "4. View logs:"
echo "   tail -f /var/log/nginx/tuma-africa-access.log"
echo ""
echo "🌐 Your application should be available at:"
echo "   http://213.199.35.46"
echo ""

