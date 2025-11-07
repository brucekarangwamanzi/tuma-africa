#!/bin/bash

# Tuma-Africa Link Cargo Deployment Script
# This script automates the deployment process for production

set -e  # Exit on any error

echo "🚀 Starting Tuma-Africa Link Cargo Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_warning "Please copy .env.example to .env and configure your environment variables"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    print_warning "Please install Node.js version 16 or higher"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required!"
    print_warning "Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Check if MongoDB is running (optional check)
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand('ping').ok" --quiet > /dev/null 2>&1; then
        print_success "MongoDB connection verified"
    else
        print_warning "MongoDB connection failed - make sure MongoDB is running"
    fi
fi

# Install dependencies
print_status "Installing dependencies..."
npm run install-all

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Build frontend
print_status "Building frontend for production..."
cd frontend
npm run build

if [ $? -eq 0 ]; then
    print_success "Frontend build completed"
    cd ..
else
    print_error "Frontend build failed"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed globally"
    print_status "Installing PM2..."
    npm install -g pm2
fi

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'tuma-africa-cargo',
    script: './backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Stop existing PM2 process if running
print_status "Stopping existing PM2 processes..."
pm2 stop tuma-africa-cargo 2>/dev/null || true
pm2 delete tuma-africa-cargo 2>/dev/null || true

# Start application with PM2
print_status "Starting application with PM2..."
pm2 start ecosystem.config.js --env production

if [ $? -eq 0 ]; then
    print_success "Application started successfully with PM2"
else
    print_error "Failed to start application with PM2"
    exit 1
fi

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
print_status "Setting up PM2 startup script..."
pm2 startup

print_success "🎉 Deployment completed successfully!"
print_status "Application is running on port 5000"
print_status "You can monitor the application with: pm2 monit"
print_status "View logs with: pm2 logs tuma-africa-cargo"
print_status "Restart application with: pm2 restart tuma-africa-cargo"

# Display application status
echo ""
print_status "Application Status:"
pm2 status

echo ""
print_status "Next Steps:"
echo "1. Configure Nginx reverse proxy (see README.md)"
echo "2. Set up SSL certificate with Let's Encrypt"
echo "3. Configure your domain DNS settings"
echo "4. Test the application at http://your-server-ip:5000"

echo ""
print_success "Deployment script completed! 🚀"