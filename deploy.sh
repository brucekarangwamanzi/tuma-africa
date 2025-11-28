#!/bin/bash

echo "🚀 Tuma Africa Cargo - Deployment Script"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install git first."
    exit 1
fi

print_success "Git is installed"

# Check if node is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_success "Node.js is installed ($(node --version))"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm is installed ($(npm --version))"

echo ""
echo "Select deployment option:"
echo "1) Deploy to VPS with PM2 (Full Control)"
echo "2) Build for Production (Local)"
echo "3) Setup Ngrok (Quick Public URL)"
echo "4) Deploy to Render (Cloud - Manual)"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        print_info "📦 Deploying to VPS with PM2..."
        
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            print_warning "PM2 is not installed globally"
            print_info "Installing PM2..."
            npm install -g pm2
        fi

        # Install dependencies
        print_info "Installing dependencies..."
        npm install
        cd backend && npm install && cd ..
        cd frontend && npm install && cd ..

        # Build frontend
        print_info "Building frontend for production..."
        cd frontend
        npm run build
        cd ..

        # Create PM2 ecosystem file
        print_info "Creating PM2 ecosystem configuration..."
        cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tuma-africa-backend',
    script: './backend/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/backend-err.log',
    out_file: './logs/backend-out.log',
    time: true,
    max_memory_restart: '500M'
  }]
};
EOF

        # Create logs directory
        mkdir -p logs

        # Stop existing PM2 processes
        print_info "Stopping existing PM2 processes..."
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true

        # Start application with PM2
        print_info "Starting application with PM2..."
        pm2 start ecosystem.config.js

        # Save PM2 configuration
        pm2 save

        # Setup PM2 startup script
        print_info "Setting up PM2 startup script..."
        pm2 startup

        print_success "🎉 Deployment completed successfully!"
        echo ""
        print_info "Application Status:"
        pm2 status
        echo ""
        print_info "Useful Commands:"
        echo "  pm2 status              - Check status"
        echo "  pm2 logs                - View logs"
        echo "  pm2 restart all         - Restart app"
        echo "  pm2 monit               - Monitor resources"
        echo ""
        print_info "Access your app:"
        echo "  Local: http://localhost:5001"
        echo "  Network: http://$(hostname -I | awk '{print $1}'):5001"
        ;;

    2)
        echo ""
        print_info "📦 Building for production..."
        
        # Install dependencies
        print_info "Installing dependencies..."
        npm install
        cd backend && npm install && cd ..
        cd frontend && npm install && cd ..

        # Build frontend
        print_info "Building frontend..."
        cd frontend
        npm run build
        cd ..

        print_success "Build completed!"
        print_info "Frontend build is in: frontend/build"
        print_info "To serve: cd frontend/build && npx serve -s ."
        ;;

    3)
        echo ""
        print_info "🌐 Setting up Ngrok..."
        
        # Check if ngrok is installed
        if ! command -v ngrok &> /dev/null; then
            print_warning "Ngrok is not installed"
            print_info "Installing ngrok..."
            npm install -g ngrok
        fi

        print_info "Starting servers..."
        
        # Start backend in background
        cd backend
        npm start &
        BACKEND_PID=$!
        cd ..

        sleep 3

        # Start ngrok
        print_success "Backend started!"
        print_info "Starting ngrok tunnel..."
        print_info "Your public URL will appear below:"
        echo ""
        ngrok http 5001

        # Cleanup on exit
        kill $BACKEND_PID 2>/dev/null
        ;;

    4)
        echo ""
        print_info "📋 Render Deployment Instructions"
        echo ""
        echo "1. Push your code to GitHub"
        echo "2. Go to https://render.com and sign up"
        echo "3. Click 'New +' → 'Web Service'"
        echo "4. Connect your GitHub repository"
        echo "5. Configure:"
        echo "   - Name: tuma-africa-cargo"
        echo "   - Environment: Node"
        echo "   - Build Command: cd backend && npm install"
        echo "   - Start Command: cd backend && node server.js"
        echo "6. Add Environment Variables:"
        echo "   - NODE_ENV=production"
        echo "   - PORT=5001"
        echo "   - MONGODB_URI=your_mongodb_uri"
        echo "   - JWT_SECRET=your_secret"
        echo "7. Click 'Create Web Service'"
        echo ""
        print_info "For detailed instructions, see DEPLOYMENT_OPTIONS.md"
        ;;

    5)
        echo ""
        print_info "Exiting..."
        exit 0
        ;;

    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_success "Deployment script completed! 🚀"