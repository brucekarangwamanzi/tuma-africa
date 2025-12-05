# 🚀 Production Deployment Guide

## Server Information
- **IP Address:** 213.199.35.46
- **SSH:** `ssh root@213.199.35.46`
- **Project Path:** `/root/project/tuma-africa`

---

## 📋 Prerequisites

1. **PostgreSQL** installed and running
2. **Node.js** and **npm** installed
3. **Nginx** installed
4. **PM2** installed globally
5. **Git** installed (if using git)

---

## 🔧 Step-by-Step Deployment

### Step 1: Connect to Server

```bash
ssh root@213.199.35.46
```

### Step 2: Navigate to Project Directory

```bash
cd /root/project/tuma-africa
```

### Step 3: Create Environment Files

#### Backend `.env` File

```bash
nano backend/.env
```

Paste this content (update passwords and secrets):

```env
# ============================================
# Server Configuration
# ============================================
NODE_ENV=production
PORT=5001
HOST=0.0.0.0

# ============================================
# PostgreSQL Database Configuration
# ============================================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=tuma_africa_cargo
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

# ============================================
# JWT Authentication
# ============================================
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-change-this
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# ============================================
# Security
# ============================================
BCRYPT_ROUNDS=12

# ============================================
# Rate Limiting
# ============================================
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=500

# ============================================
# CORS & Frontend
# ============================================
FRONTEND_URL=http://213.199.35.46

# ============================================
# Email Configuration (Optional)
# ============================================
# EMAIL_USER=your-email@gmail.com
# EMAIL_APP_PASSWORD=your-gmail-app-password
# EMAIL_FROM_NAME=Tuma-Africa Link Cargo

# ============================================
# API URL
# ============================================
API_URL=http://213.199.35.46/api
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

#### Frontend `.env.production` File

```bash
nano frontend/.env.production
```

Paste this content:

```env
REACT_APP_API_URL=http://213.199.35.46/api
REACT_APP_WS_URL=http://213.199.35.46
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Step 4: Install PM2 (if not installed)

```bash
npm install -g pm2
```

### Step 5: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install --production
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..
```

### Step 6: Build Frontend

```bash
cd frontend
npm run build
cd ..
```

### Step 7: Run Database Migrations

```bash
npx sequelize-cli db:migrate
```

### Step 8: Create Logs Directory

```bash
mkdir -p logs
```

### Step 9: Start Application with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions shown
```

### Step 10: Install and Configure Nginx

#### Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
```

#### Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/tuma-africa
```

Copy the content from `nginx.conf` file in the project root, or paste:

```nginx
server {
    listen 80;
    server_name 213.199.35.46;

    location / {
        root /root/project/tuma-africa/frontend/build;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

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

    location /api-docs {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/health {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

Save and exit.

#### Enable Nginx Site

```bash
sudo ln -s /etc/nginx/sites-available/tuma-africa /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default site (optional)
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Reload Nginx
```

### Step 11: Configure Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw enable
```

---

## ✅ Verification

### Check PM2 Status

```bash
pm2 status
pm2 logs tuma-africa-backend
```

### Check Nginx Status

```bash
sudo systemctl status nginx
```

### Test Endpoints

```bash
# Health check
curl http://213.199.35.46/api/health

# Frontend
curl http://213.199.35.46
```

---

## 🌐 Access Your Application

- **Frontend:** http://213.199.35.46
- **API:** http://213.199.35.46/api
- **API Docs:** http://213.199.35.46/api-docs
- **Health Check:** http://213.199.35.46/api/health

---

## 🔄 Updating/Deploying Changes

### Option 1: Use Deployment Script

```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

### Option 2: Manual Update

```bash
cd /root/project/tuma-africa
git pull origin main
cd frontend
npm install
npm run build
cd ..
cd backend
npm install --production
cd ..
npx sequelize-cli db:migrate
pm2 restart tuma-africa-backend
sudo systemctl reload nginx
```

---

## 📊 Useful Commands

### PM2 Commands

```bash
pm2 status                    # Check status
pm2 logs tuma-africa-backend  # View logs
pm2 restart tuma-africa-backend  # Restart
pm2 stop tuma-africa-backend     # Stop
pm2 delete tuma-africa-backend   # Remove
```

### Nginx Commands

```bash
sudo nginx -t              # Test configuration
sudo systemctl reload nginx  # Reload configuration
sudo systemctl restart nginx # Restart Nginx
sudo systemctl status nginx  # Check status
```

### Database Commands

```bash
# Run migrations
npx sequelize-cli db:migrate

# Rollback last migration
npx sequelize-cli db:migrate:undo

# Check migration status
npx sequelize-cli db:migrate:status
```

---

## ⚠️ Important Notes

1. **Update Passwords:** Change all default passwords in `.env` files
2. **JWT Secrets:** Use strong, random strings for JWT secrets
3. **Database:** Ensure PostgreSQL is running and accessible
4. **Firewall:** Only open necessary ports (22, 80)
5. **Backups:** Regularly backup your database
6. **Logs:** Check PM2 and Nginx logs regularly for errors

---

## 🐛 Troubleshooting

### PM2 Process Not Starting

```bash
pm2 logs tuma-africa-backend  # Check logs
pm2 delete tuma-africa-backend
pm2 start ecosystem.config.js
```

### Nginx 502 Bad Gateway

- Check if backend is running: `pm2 status`
- Check backend logs: `pm2 logs tuma-africa-backend`
- Verify backend is listening on port 5001: `netstat -tlnp | grep 5001`

### Frontend Not Loading

- Check if frontend build exists: `ls -la frontend/build`
- Rebuild frontend: `cd frontend && npm run build`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Database Connection Issues

- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `backend/.env`
- Test connection: `psql -U postgres -d tuma_africa_cargo`

---

## 📝 Environment Variables Checklist

Before deploying, ensure these are set in `backend/.env`:

- [ ] `NODE_ENV=production`
- [ ] `POSTGRES_PASSWORD` (secure password)
- [ ] `JWT_SECRET` (strong random string)
- [ ] `JWT_REFRESH_SECRET` (strong random string)
- [ ] `FRONTEND_URL=http://213.199.35.46`
- [ ] `API_URL=http://213.199.35.46/api`

---

**Deployment Date:** Created for production deployment
**Server IP:** 213.199.35.46
**Protocol:** HTTP (No SSL)

