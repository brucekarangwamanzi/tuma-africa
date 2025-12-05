#!/bin/bash

set -e

echo "📦 Moving Project to /var/www (Better for Production)..."
echo "========================================================="

OLD_DIR="/root/project/tuma-africa"
NEW_DIR="/var/www/tuma-africa"

echo ""
echo "⚠️  This will:"
echo "   1. Move project from $OLD_DIR to $NEW_DIR"
echo "   2. Update Nginx configuration"
echo "   3. Restart services"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

# Step 1: Stop PM2 if running
echo ""
echo "🛑 Stopping PM2..."
pm2 stop tuma-africa-backend 2>/dev/null || true

# Step 2: Create /var/www directory
echo ""
echo "📁 Creating /var/www/tuma-africa..."
sudo mkdir -p /var/www
sudo chown -R root:root /var/www

# Step 3: Move project
echo ""
echo "📦 Moving project..."
if [ -d "$OLD_DIR" ]; then
    sudo cp -r "$OLD_DIR" "$NEW_DIR"
    sudo chown -R root:root "$NEW_DIR"
    echo "✅ Project copied to $NEW_DIR"
else
    echo "❌ Source directory not found: $OLD_DIR"
    exit 1
fi

# Step 4: Fix permissions
echo ""
echo "🔐 Fixing permissions..."
sudo chown -R root:www-data "$NEW_DIR"
sudo chmod -R 755 "$NEW_DIR"
sudo chmod -R g+w "$NEW_DIR/frontend/build" 2>/dev/null || true

# Step 5: Update Nginx config
echo ""
echo "📝 Updating Nginx configuration..."
sudo sed -i "s|/root/project/tuma-africa|/var/www/tuma-africa|g" /etc/nginx/sites-available/tuma-africa

# Step 6: Update PM2 config if exists
if [ -f "$NEW_DIR/ecosystem.config.js" ]; then
    echo ""
    echo "📝 Updating PM2 configuration..."
    sed -i "s|/root/project/tuma-africa|/var/www/tuma-africa|g" "$NEW_DIR/ecosystem.config.js"
fi

# Step 7: Test and reload Nginx
echo ""
echo "🧪 Testing Nginx..."
sudo nginx -t
sudo systemctl reload nginx

# Step 8: Restart PM2 with new path
echo ""
echo "🔄 Restarting PM2..."
cd "$NEW_DIR"
pm2 delete tuma-africa-backend 2>/dev/null || true
pm2 start ecosystem.config.js || pm2 start backend/server.js --name tuma-africa-backend
pm2 save

echo ""
echo "========================================================="
echo "✅ Project moved to /var/www/tuma-africa"
echo ""
echo "📝 Next steps:"
echo "   1. Update your .env files if they have hardcoded paths"
echo "   2. Test: curl http://213.199.35.46"
echo "   3. You can remove old directory: sudo rm -rf $OLD_DIR"
echo ""
echo "🌐 New project location: $NEW_DIR"

