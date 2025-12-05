#!/bin/bash

set -e

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/root/project/tuma-africa"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Step 1: Navigate to project directory
cd $PROJECT_DIR
echo -e "${GREEN}✓${NC} Navigated to project directory"

# Step 2: Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main || echo "Git pull failed or not a git repo"

# Step 3: Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd $BACKEND_DIR
npm install --production

# Step 4: Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd $FRONTEND_DIR
npm install

# Step 5: Build frontend
echo -e "${YELLOW}🏗️  Building frontend for production...${NC}"
npm run build

# Step 6: Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
cd $PROJECT_DIR
npx sequelize-cli db:migrate

# Step 7: Create logs directory
mkdir -p $PROJECT_DIR/logs
echo -e "${GREEN}✓${NC} Logs directory created"

# Step 8: Restart PM2
echo -e "${YELLOW}🔄 Restarting PM2 process...${NC}"
cd $PROJECT_DIR
pm2 restart tuma-africa-backend || pm2 start ecosystem.config.js

# Step 9: Save PM2 configuration
pm2 save

# Step 10: Reload Nginx
echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "=================================="
echo "🌐 Frontend: http://213.199.35.46"
echo "📡 API: http://213.199.35.46/api"
echo "📚 Docs: http://213.199.35.46/api-docs"
echo ""
echo "📊 Check PM2 status: pm2 status"
echo "📋 Check PM2 logs: pm2 logs tuma-africa-backend"

