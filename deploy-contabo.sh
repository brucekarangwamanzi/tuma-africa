#!/bin/bash

# Complete Contabo VPS Deployment Script
# Run this on your Contabo VPS server

set -e

echo "🚀 Tuma Africa - Contabo VPS Deployment"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

# Variables
APP_DIR="/var/www/tuma-africa"
REPO_URL="https://github.com/brucekarangwamanzi/tuma-africa.git"

# Step 1: Initial Setup
echo -e "${BLUE}📦 Step 1: Installing system dependencies...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential

# Step 2: Install Node.js
echo -e "${BLUE}📦 Step 2: Installing Node.js 18.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi
echo -e "${GREEN}✅ Node.js $(node --version) installed${NC}"

# Step 3: Install PM2
echo -e "${BLUE}📦 Step 3: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
echo -e "${GREEN}✅ PM2 installed${NC}"

# Step 4: Install Nginx
echo -e "${BLUE}📦 Step 4: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
fi
echo -e "${GREEN}✅ Nginx installed${NC}"

# Step 5: Install Certbot
echo -e "${BLUE}📦 Step 5: Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
fi
echo -e "${GREEN}✅ Certbot installed${NC}"

# Step 6: Setup Firewall
echo -e "${BLUE}📦 Step 6: Configuring firewall...${NC}"
if ! command -v ufw &> /dev/null; then
    apt install -y ufw
fi
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✅ Firewall configured${NC}"

# Step 7: Create Application Directory
echo -e "${BLUE}📦 Step 7: Creating application directory...${NC}"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/logs
cd $APP_DIR

# Step 8: Clone Repository
echo -e "${BLUE}📦 Step 8: Cloning repository...${NC}"
if [ ! -d "$APP_DIR/.git" ]; then
    git clone $REPO_URL .
else
    echo -e "${YELLOW}⚠️  Repository already exists, pulling latest...${NC}"
    git pull origin main
fi
echo -e "${GREEN}✅ Repository cloned${NC}"

# Step 9: Install Dependencies
echo -e "${BLUE}📦 Step 9: Installing dependencies...${NC}"
npm install
cd frontend
npm install
cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 10: Build Frontend
echo -e "${BLUE}📦 Step 10: Building frontend...${NC}"
cd frontend
npm run build
cd ..
echo -e "${GREEN}✅ Frontend built${NC}"

# Step 11: Setup PM2 Startup
echo -e "${BLUE}📦 Step 11: Setting up PM2 startup...${NC}"
pm2 startup systemd | grep "sudo" | bash || true
echo -e "${GREEN}✅ PM2 startup configured${NC}"

# Step 12: Check for environment files
echo -e "${YELLOW}⚠️  Step 12: Environment configuration required${NC}"
echo ""
echo "You need to configure environment variables:"
echo "1. Backend: $APP_DIR/backend/.env"
echo "2. Frontend: $APP_DIR/frontend/.env.production"
echo ""
echo "See CONTABO_ENV_TEMPLATE.txt for template"
echo ""

# Ask if user wants to create env files
read -p "Do you want to create .env files now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create backend .env
    if [ ! -f "$APP_DIR/backend/.env" ]; then
        echo "Creating backend/.env..."
        cat > $APP_DIR/backend/.env << 'EOF'
# Server
PORT=5001
NODE_ENV=production
HOST=0.0.0.0

# Database - REPLACE WITH YOUR MONGODB URI
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# JWT Secrets
JWT_SECRET=crKbcgas8cuVURJR4f3xEukxsQ1aETGxQ6NYCrmME6B+7nnV1xHi4l/jG9/TE+BF
JWT_REFRESH_SECRET=clgq5bvDhJjfra/GK/fA4BDRPiktR9bs7nQk0TzFJedhZHUOgfdvJ1EuKPf9gH3H
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=500

# CORS - REPLACE WITH YOUR DOMAIN
FRONTEND_URL=https://yourdomain.com

# Email - REPLACE WITH YOUR CREDENTIALS
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password
EOF
        echo -e "${GREEN}✅ Backend .env created${NC}"
        echo -e "${YELLOW}⚠️  Please edit $APP_DIR/backend/.env with your values${NC}"
    fi

    # Create frontend .env.production
    if [ ! -f "$APP_DIR/frontend/.env.production" ]; then
        echo "Creating frontend/.env.production..."
        cat > $APP_DIR/frontend/.env.production << 'EOF'
# Frontend Environment - REPLACE WITH YOUR DOMAIN
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=https://yourdomain.com
EOF
        echo -e "${GREEN}✅ Frontend .env.production created${NC}"
        echo -e "${YELLOW}⚠️  Please edit $APP_DIR/frontend/.env.production with your domain${NC}"
    fi
fi

# Step 13: Start Application with PM2
echo -e "${BLUE}📦 Step 13: Starting application with PM2...${NC}"
if [ -f "$APP_DIR/ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}✅ Application started with PM2${NC}"
else
    echo -e "${RED}❌ ecosystem.config.js not found${NC}"
    echo "Starting manually..."
    cd $APP_DIR
    pm2 start backend/server.js --name tuma-africa-backend
    pm2 save
fi

# Step 14: Configure Nginx
echo -e "${BLUE}📦 Step 14: Configuring Nginx...${NC}"
if [ -f "$APP_DIR/nginx-contabo.conf" ]; then
    echo -e "${YELLOW}⚠️  Nginx configuration file found${NC}"
    echo "You need to:"
    echo "1. Edit nginx-contabo.conf and replace 'yourdomain.com' with your domain"
    echo "2. Copy to /etc/nginx/sites-available/tuma-africa"
    echo "3. Create symlink: ln -s /etc/nginx/sites-available/tuma-africa /etc/nginx/sites-enabled/"
    echo "4. Test: nginx -t"
    echo "5. Reload: systemctl reload nginx"
else
    echo -e "${RED}❌ nginx-contabo.conf not found${NC}"
fi

# Step 15: Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Script Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Edit environment files:"
echo "   - nano $APP_DIR/backend/.env"
echo "   - nano $APP_DIR/frontend/.env.production"
echo ""
echo "2. Rebuild frontend (after editing .env.production):"
echo "   cd $APP_DIR/frontend && npm run build && cd .."
echo ""
echo "3. Configure Nginx:"
echo "   nano $APP_DIR/nginx-contabo.conf  # Edit domain"
echo "   cp $APP_DIR/nginx-contabo.conf /etc/nginx/sites-available/tuma-africa"
echo "   ln -s /etc/nginx/sites-available/tuma-africa /etc/nginx/sites-enabled/"
echo "   nginx -t && systemctl reload nginx"
echo ""
echo "4. Setup SSL:"
echo "   certbot --nginx -d yourdomain.com -d www.yourdomain.com"
echo ""
echo "5. Restart application:"
echo "   pm2 restart tuma-africa-backend"
echo ""
echo "Check status:"
echo "   pm2 status"
echo "   systemctl status nginx"
echo ""

