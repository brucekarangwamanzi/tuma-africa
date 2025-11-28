# 🖥️ Contabo VPS Deployment Guide

Complete guide for deploying Tuma Africa to Contabo VPS.

## 📋 Prerequisites

- Contabo VPS with Ubuntu 20.04/22.04
- SSH access to your server
- Domain name pointed to your server IP
- Root or sudo access

---

## 🚀 Step 1: Initial Server Setup

### 1.1 Connect to Your Server

```bash
ssh root@your-server-ip
# or
ssh your-username@your-server-ip
```

### 1.2 Update System

```bash
apt update && apt upgrade -y
```

### 1.3 Install Essential Tools

```bash
apt install -y curl wget git build-essential
```

---

## 🔧 Step 2: Install Node.js

### Option A: Using NodeSource (Recommended)

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Option B: Using NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

---

## 🗄️ Step 3: Install MongoDB

### Option A: MongoDB Atlas (Recommended for Production)

Use MongoDB Atlas cloud database - no installation needed!
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get connection string

### Option B: Install MongoDB on Server

```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

# Check status
systemctl status mongod
```

---

## 🌐 Step 4: Install Nginx

```bash
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Check status
systemctl status nginx
```

---

## 📦 Step 5: Install PM2 (Process Manager)

```bash
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the command it outputs
```

---

## 🔐 Step 6: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
certbot renew --dry-run
```

---

## 📥 Step 7: Deploy Application

### 7.1 Create Application Directory

```bash
mkdir -p /var/www/tuma-africa
cd /var/www/tuma-africa
```

### 7.2 Clone Repository

```bash
# Option A: Clone from GitHub
git clone https://github.com/brucekarangwamanzi/tuma-africa.git .

# Option B: Upload files via SCP
# From your local machine:
# scp -r /path/to/inn/* root@your-server-ip:/var/www/tuma-africa/
```

### 7.3 Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 7.4 Build Frontend

```bash
cd frontend
npm run build
cd ..
```

---

## ⚙️ Step 8: Configure Environment Variables

### 8.1 Create Backend .env File

```bash
nano /var/www/tuma-africa/backend/.env
```

Add the following (replace with your values):

```env
# Server
PORT=5001
NODE_ENV=production
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
# OR for local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/tuma-africa-cargo

# JWT
JWT_SECRET=crKbcgas8cuVURJR4f3xEukxsQ1aETGxQ6NYCrmME6B+7nnV1xHi4l/jG9/TE+BF
JWT_REFRESH_SECRET=clgq5bvDhJjfra/GK/fA4BDRPiktR9bs7nQk0TzFJedhZHUOgfdvJ1EuKPf9gH3H
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=500

# CORS
FRONTEND_URL=https://yourdomain.com

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Save and exit (Ctrl+X, Y, Enter)

### 8.2 Create Frontend .env File

```bash
nano /var/www/tuma-africa/frontend/.env.production
```

Add:

```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_WS_URL=https://yourdomain.com
```

---

## 🔄 Step 9: Configure PM2

### 9.1 Create PM2 Ecosystem File

```bash
nano /var/www/tuma-africa/ecosystem.config.js
```

Add (see `ecosystem.config.js` file in repo):

```javascript
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
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

### 9.2 Create Logs Directory

```bash
mkdir -p /var/www/tuma-africa/logs
```

### 9.3 Start Application with PM2

```bash
cd /var/www/tuma-africa
pm2 start ecosystem.config.js
pm2 save
```

### 9.4 Check PM2 Status

```bash
pm2 status
pm2 logs tuma-africa-backend
```

---

## 🌐 Step 10: Configure Nginx

### 10.1 Update Nginx Configuration

```bash
nano /etc/nginx/sites-available/tuma-africa
```

Copy the configuration from `nginx.conf` in the repo, updating:
- `server_name` with your domain
- Paths if needed

### 10.2 Enable Site

```bash
# Create symlink
ln -s /etc/nginx/sites-available/tuma-africa /etc/nginx/sites-enabled/

# Remove default site (optional)
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 🔥 Step 11: Configure Firewall

```bash
# Install UFW if not installed
apt install -y ufw

# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## ✅ Step 12: Verify Deployment

### 12.1 Check Services

```bash
# Check PM2
pm2 status

# Check Nginx
systemctl status nginx

# Check MongoDB (if installed locally)
systemctl status mongod
```

### 12.2 Test Endpoints

```bash
# Health check
curl http://localhost:5001/api/health

# Test from browser
# https://yourdomain.com/api/health
```

### 12.3 Check Logs

```bash
# PM2 logs
pm2 logs tuma-africa-backend

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## 🔄 Step 13: Setup Auto-Deployment (Optional)

### 13.1 GitHub Webhook Script

Create deployment script:

```bash
nano /var/www/tuma-africa/deploy.sh
```

Add:

```bash
#!/bin/bash
cd /var/www/tuma-africa
git pull origin main
npm install
cd frontend
npm install
npm run build
cd ..
pm2 restart tuma-africa-backend
```

Make executable:

```bash
chmod +x /var/www/tuma-africa/deploy.sh
```

---

## 🛠️ Useful Commands

### PM2 Commands

```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all          # Restart all apps
pm2 restart tuma-africa-backend  # Restart specific app
pm2 stop all            # Stop all apps
pm2 delete all          # Delete all apps
pm2 monit               # Monitor resources
```

### Nginx Commands

```bash
nginx -t                # Test configuration
systemctl reload nginx  # Reload configuration
systemctl restart nginx # Restart Nginx
systemctl status nginx  # Check status
```

### Application Commands

```bash
# View logs
tail -f /var/www/tuma-africa/logs/backend-out.log
tail -f /var/www/tuma-africa/logs/backend-error.log

# Restart application
cd /var/www/tuma-africa
pm2 restart tuma-africa-backend

# Rebuild frontend
cd /var/www/tuma-africa/frontend
npm run build
```

---

## 🔒 Security Best Practices

1. **Keep system updated:**
   ```bash
   apt update && apt upgrade -y
   ```

2. **Use strong passwords:**
   - MongoDB credentials
   - JWT secrets
   - Server SSH keys

3. **Configure fail2ban:**
   ```bash
   apt install -y fail2ban
   systemctl enable fail2ban
   systemctl start fail2ban
   ```

4. **Regular backups:**
   - Database backups
   - Application files
   - Environment variables

5. **Monitor logs:**
   - Check PM2 logs regularly
   - Monitor Nginx access/error logs
   - Set up log rotation

---

## 🆘 Troubleshooting

### Application not starting?

```bash
# Check PM2 logs
pm2 logs tuma-africa-backend

# Check if port is in use
netstat -tulpn | grep 5001

# Restart PM2
pm2 restart tuma-africa-backend
```

### Nginx 502 Bad Gateway?

```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs tuma-africa-backend

# Test backend directly
curl http://localhost:5001/api/health
```

### SSL Certificate Issues?

```bash
# Renew certificate
certbot renew

# Check certificate status
certbot certificates
```

### MongoDB Connection Issues?

```bash
# Test connection
mongosh "your-connection-string"

# Check MongoDB status (if local)
systemctl status mongod
```

---

## 📝 Maintenance

### Update Application

```bash
cd /var/www/tuma-africa
git pull origin main
npm install
cd frontend
npm install
npm run build
cd ..
pm2 restart tuma-africa-backend
```

### Backup Database

```bash
# MongoDB Atlas: Use Atlas backup feature
# Local MongoDB:
mongodump --uri="mongodb://localhost:27017/tuma-africa-cargo" --out=/backup/$(date +%Y%m%d)
```

---

## ✅ Deployment Checklist

- [ ] Server setup complete
- [ ] Node.js installed
- [ ] MongoDB configured (Atlas or local)
- [ ] Nginx installed and configured
- [ ] PM2 installed and configured
- [ ] SSL certificate installed
- [ ] Application cloned and built
- [ ] Environment variables set
- [ ] PM2 process running
- [ ] Nginx serving application
- [ ] Firewall configured
- [ ] Health endpoint working
- [ ] Frontend accessible
- [ ] Backend API working
- [ ] WebSocket connection working

---

**Your application should now be live at:** `https://yourdomain.com`

**Need help?** Check logs and troubleshooting section above.

