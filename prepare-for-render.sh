#!/bin/bash

echo "🚀 Preparing for Render Deployment"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_error "Git repository not initialized"
    exit 1
fi

print_success "Git repository found"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes"
    echo ""
    git status -s
    echo ""
    read -p "Do you want to commit these changes? (y/n): " commit_choice
    
    if [ "$commit_choice" = "y" ]; then
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
        print_success "Changes committed"
    fi
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    print_error "No remote origin configured"
    print_info "Please add your GitHub repository:"
    echo "  git remote add origin https://github.com/yourusername/your-repo.git"
    exit 1
fi

print_success "Remote origin configured"

# Push to GitHub
print_info "Pushing to GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    print_success "Code pushed to GitHub"
else
    print_error "Failed to push to GitHub"
    exit 1
fi

echo ""
print_success "✅ Repository is ready for Render deployment!"
echo ""
print_info "Next Steps:"
echo ""
echo "1. Setup MongoDB Atlas (if not done):"
echo "   - Go to https://www.mongodb.com/cloud/atlas"
echo "   - Create free cluster"
echo "   - Get connection string"
echo ""
echo "2. Deploy to Render:"
echo "   - Go to https://render.com"
echo "   - Sign up with GitHub"
echo "   - Follow RENDER_DEPLOYMENT_GUIDE.md"
echo ""
echo "3. Quick Reference:"
echo "   - Deployment Guide: RENDER_DEPLOYMENT_GUIDE.md"
echo "   - Checklist: DEPLOYMENT_CHECKLIST.md"
echo ""
print_success "Your code is ready! Follow the deployment guide to go live! 🚀"
