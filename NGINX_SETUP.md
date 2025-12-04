# Nginx Setup Guide for Production Server

## Server Information
- **IP Address**: 213.199.35.46
- **Server Path**: /var/www/tuma-africa
- **Backend Port**: 5001
- **Frontend Build**: /var/www/tuma-africa/frontend/build

## Installation Steps

### 1. Install Nginx (if not already installed)
```bash
sudo apt update
sudo apt install nginx -y
```

### 2. Build Frontend
```bash
cd /var/www/tuma-africa/frontend
npm install
npm run build
```

### 3. Copy Nginx Configuration
```bash
# Copy the configuration file
sudo cp /var/www/tuma-africa/nginx-production.conf /etc/nginx/sites-available/tuma-africa

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/tuma-africa /etc/nginx/sites-enabled/

# Remove default nginx site (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### 4. Test Nginx Configuration
```bash
sudo nginx -t
```

### 5. Create Log Directory (if needed)
```bash
sudo mkdir -p /var/log/nginx
sudo chown www-data:www-data /var/log/nginx
```

### 6. Restart Nginx
```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 7. Check Nginx Status
```bash
sudo systemctl status nginx
```

## Verify Installation

### Check if Nginx is running
```bash
sudo systemctl status nginx
```

### Test from browser
- Open: `http://213.199.35.46`
- API: `http://213.199.35.46/api/health`
- Swagger: `http://213.199.35.46/api-docs`

### Check logs
```bash
# Access logs
sudo tail -f /var/log/nginx/tuma-africa-access.log

# Error logs
sudo tail -f /var/log/nginx/tuma-africa-error.log
```

## Firewall Configuration

### Allow HTTP and HTTPS
```bash
sudo ufw allow 'Nginx Full'
# Or specifically:
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## SSL Certificate Setup (Optional but Recommended)

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL Certificate (if you have a domain)
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Auto-renewal
```bash
sudo certbot renew --dry-run
```

## Troubleshooting

### Check if backend is running
```bash
curl http://localhost:5001/api/health
```

### Check nginx error logs
```bash
sudo tail -50 /var/log/nginx/error.log
```

### Reload nginx after changes
```bash
sudo nginx -s reload
```

### Check if port 80 is in use
```bash
sudo netstat -tulpn | grep :80
```

## Important Notes

1. **Frontend Build**: Make sure to build the frontend before starting nginx:
   ```bash
   cd /var/www/tuma-africa/frontend
   npm run build
   ```

2. **Backend Service**: Ensure backend is running on port 5001:
   ```bash
   cd /var/www/tuma-africa/backend
   npm start
   # Or use PM2:
   pm2 start ecosystem.config.js
   ```

3. **File Permissions**: Ensure nginx can read the frontend build:
   ```bash
   sudo chown -R www-data:www-data /var/www/tuma-africa/frontend/build
   ```

4. **SELinux** (if enabled): You may need to set proper contexts:
   ```bash
   sudo chcon -R -t httpd_sys_content_t /var/www/tuma-africa/
   ```

## Configuration File Location
- **Source**: `/var/www/tuma-africa/nginx-production.conf`
- **Nginx Config**: `/etc/nginx/sites-available/tuma-africa`
- **Enabled Link**: `/etc/nginx/sites-enabled/tuma-africa`

