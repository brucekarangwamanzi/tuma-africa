# 🗺️ Complete Deployment Roadmap for tuma.com

## Current Status Summary

### ✅ Completed
- [x] DNS configured: `tuma.com` → `3.226.2.22`
- [x] DNS configured: `www.tuma.com` → `3.226.2.22`
- [x] All configuration files updated for `tuma.com`
- [x] Deployment scripts ready
- [x] Documentation complete

### 🔄 Next Steps
- [ ] Verify server IP matches DNS
- [ ] Deploy application to Contabo
- [ ] Configure environment variables
- [ ] Setup SSL certificate
- [ ] Verify deployment

---

## 🎯 Step-by-Step Deployment Plan

### Step 1: Verify Server IP ⚠️ IMPORTANT

**Action Required:** Confirm `3.226.2.22` is your Contabo server IP

#### Option A: Check Contabo Dashboard
1. Log in to https://contabo.com
2. Go to **VPS** → **Your Server**
3. Find **IPv4 Address**
4. Compare with `3.226.2.22`

#### Option B: Check from Server (if connected)
```bash
ssh root@3.226.2.22
curl ifconfig.me
# Should return: 3.226.2.22
```

**Result:**
- ✅ If IP matches → Proceed to Step 2
- ❌ If IP is different → Update DNS A record to correct IP, then proceed

---

### Step 2: Connect to Your Contabo Server

```bash
ssh root@3.226.2.22
# or
ssh root@your-actual-server-ip
```

**Note:** Use the actual IP from Step 1 if different.

---

### Step 3: Run Automated Deployment Script

```bash
curl -o- https://raw.githubusercontent.com/brucekarangwamanzi/tuma-africa/main/deploy-contabo.sh | bash
```

**What this does:**
- Installs Node.js, PM2, Nginx, Certbot
- Configures firewall
- Clones your repository
- Installs dependencies
- Builds frontend
- Sets up PM2
- Creates environment file templates

**Time:** ~5-10 minutes

---

### Step 4: Configure Environment Variables

#### 4.1 Backend Environment

```bash
nano /var/www/tuma-africa/backend/.env
```

**Update these values:**
```env
# Database - REPLACE WITH YOUR MONGODB URI
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# CORS - Already set to tuma.com
FRONTEND_URL=https://tuma.com

# Email - REPLACE WITH YOUR CREDENTIALS
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password

# JWT Secrets - Already generated (don't change)
JWT_SECRET=crKbcgas8cuVURJR4f3xEukxsQ1aETGxQ6NYCrmME6B+7nnV1xHi4l/jG9/TE+BF
JWT_REFRESH_SECRET=clgq5bvDhJjfra/GK/fA4BDRPiktR9bs7nQk0TzFJedhZHUOgfdvJ1EuKPf9gH3H
```

#### 4.2 Frontend Environment

```bash
nano /var/www/tuma-africa/frontend/.env.production
```

**Should already be:**
```env
REACT_APP_API_URL=https://tuma.com/api
REACT_APP_WS_URL=https://tuma.com
```

---

### Step 5: Rebuild Frontend

```bash
cd /var/www/tuma-africa/frontend
npm run build
cd ..
```

---

### Step 6: Configure Nginx

The `nginx-contabo.conf` file is already configured for `tuma.com`!

```bash
# Copy nginx config
cp /var/www/tuma-africa/nginx-contabo.conf /etc/nginx/sites-available/tuma-africa

# Enable site
ln -s /etc/nginx/sites-available/tuma-africa /etc/nginx/sites-enabled/

# Remove default (optional)
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

### Step 7: Setup SSL Certificate

```bash
certbot --nginx -d tuma.com -d www.tuma.com
```

**Follow the prompts:**
- Enter email for renewal notices
- Agree to terms
- Choose redirect HTTP to HTTPS (recommended)

Certbot will automatically configure SSL for `tuma.com`.

---

### Step 8: Restart Application

```bash
pm2 restart tuma-africa-backend
pm2 save
```

---

### Step 9: Verify Deployment

#### 9.1 Check Services

```bash
# Check PM2
pm2 status
# Should show: tuma-africa-backend (online)

# Check Nginx
systemctl status nginx
# Should show: active (running)
```

#### 9.2 Test Endpoints

```bash
# Health check
curl https://tuma.com/api/health
# Should return: {"status":"ok","message":"Server is running"}

# Test from browser
# Visit: https://tuma.com
# Should show your application
```

#### 9.3 Check Logs

```bash
# Application logs
pm2 logs tuma-africa-backend

# Nginx logs
tail -f /var/log/nginx/tuma-africa-error.log
tail -f /var/log/nginx/tuma-africa-access.log
```

---

## ✅ Deployment Checklist

Use this checklist to track your progress:

- [ ] **Step 1:** Verified server IP matches DNS (3.226.2.22)
- [ ] **Step 2:** Connected to Contabo server via SSH
- [ ] **Step 3:** Ran deployment script successfully
- [ ] **Step 4:** Configured backend `.env` file
- [ ] **Step 4:** Configured frontend `.env.production` file
- [ ] **Step 5:** Rebuilt frontend
- [ ] **Step 6:** Configured and enabled Nginx
- [ ] **Step 7:** Installed SSL certificate
- [ ] **Step 8:** Restarted application
- [ ] **Step 9:** Verified health endpoint works
- [ ] **Step 9:** Verified frontend accessible
- [ ] **Step 9:** Tested WebSocket connection
- [ ] **Step 9:** Tested authentication
- [ ] **Step 9:** Tested messaging/notifications

---

## 🆘 Troubleshooting

### Issue: Can't connect to server

**Solution:**
- Verify server IP is correct
- Check if server is running in Contabo dashboard
- Verify SSH key/credentials

### Issue: Deployment script fails

**Solution:**
- Check internet connection on server
- Verify GitHub repository is accessible
- Check server has enough resources
- Review error messages in script output

### Issue: SSL certificate fails

**Solution:**
- Ensure DNS is working: `dig tuma.com`
- Verify ports 80 and 443 are open: `ufw status`
- Check Nginx is running: `systemctl status nginx`
- Wait a few minutes and try again

### Issue: 502 Bad Gateway

**Solution:**
- Check PM2: `pm2 status`
- Check backend logs: `pm2 logs tuma-africa-backend`
- Verify backend is running: `curl http://localhost:5001/api/health`
- Check environment variables are set correctly

### Issue: Frontend not loading

**Solution:**
- Verify frontend was built: `ls /var/www/tuma-africa/frontend/build`
- Check Nginx config: `nginx -t`
- Check Nginx logs: `tail -f /var/log/nginx/tuma-africa-error.log`
- Verify `.env.production` has correct URLs

---

## 📚 Reference Documentation

- **Main Deployment Guide:** `DEPLOY_TUMA_COM.md`
- **Pre-Deployment Checklist:** `PRE_DEPLOYMENT_CHECKLIST.md`
- **DNS Configuration:** `DNS_CONFIGURATION_GUIDE.md`
- **DNS Status:** `DNS_STATUS.md`
- **Complete Guide:** `CONTABO_DEPLOYMENT_GUIDE.md`
- **Quick Start:** `START_HERE.md`

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ `pm2 status` shows `tuma-africa-backend` as online  
✅ `systemctl status nginx` shows active  
✅ `https://tuma.com/api/health` returns JSON  
✅ `https://tuma.com` shows your frontend  
✅ WebSocket connections work (test messaging)  
✅ Authentication works (test login)  
✅ Notifications work (test notifications)  

---

## 🚀 Quick Command Reference

```bash
# Connect to server
ssh root@3.226.2.22

# Run deployment
curl -o- https://raw.githubusercontent.com/brucekarangwamanzi/tuma-africa/main/deploy-contabo.sh | bash

# Configure environment
nano /var/www/tuma-africa/backend/.env
nano /var/www/tuma-africa/frontend/.env.production

# Rebuild frontend
cd /var/www/tuma-africa/frontend && npm run build && cd ..

# Setup Nginx
cp /var/www/tuma-africa/nginx-contabo.conf /etc/nginx/sites-available/tuma-africa
ln -s /etc/nginx/sites-available/tuma-africa /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Setup SSL
certbot --nginx -d tuma.com -d www.tuma.com

# Restart app
pm2 restart tuma-africa-backend

# Verify
curl https://tuma.com/api/health
pm2 status
```

---

## ✅ Ready to Deploy?

**Start with Step 1:** Verify your server IP, then follow the steps above.

**Your app will be live at:** `https://tuma.com` 🚀

---

**Need help?** Check the troubleshooting section or refer to the detailed guides listed above.

