# 🚀 DEPLOY NOW - Step-by-Step Checklist

## ✅ Pre-Deployment

- [ ] **Verify Server IP:** `3.226.2.22` is your Contabo server IP
  - Check: Contabo Dashboard → VPS → Your Server → IPv4 Address
  - Or run: `ssh root@3.226.2.22 && curl ifconfig.me`

- [ ] **Have Ready:**
  - [ ] MongoDB Atlas connection string
  - [ ] Gmail App Password
  - [ ] SSH access to server

---

## 🎯 Deployment Steps

### Step 1: Connect to Server

```bash
ssh root@3.226.2.22
```

**Status:** ☐ Connected

---

### Step 2: Run Deployment Script

```bash
curl -o- https://raw.githubusercontent.com/brucekarangwamanzi/tuma-africa/main/deploy-contabo.sh | bash
```

**What it does:**
- Installs Node.js, PM2, Nginx, Certbot
- Clones repository
- Installs dependencies
- Builds frontend
- Sets up PM2

**Time:** ~5-10 minutes

**Status:** ☐ Script completed

---

### Step 3: Configure Backend Environment

```bash
nano /var/www/tuma-africa/backend/.env
```

**Update these values:**
- `MONGODB_URI` → Your MongoDB Atlas connection string
- `EMAIL_USER` → Your Gmail address
- `EMAIL_APP_PASSWORD` → Your Gmail App Password
- `FRONTEND_URL` → Already set to `https://tuma.com`
- JWT secrets → Already generated (don't change)

**Save:** Ctrl+X, then Y, then Enter

**Status:** ☐ Backend .env configured

---

### Step 4: Configure Frontend Environment

```bash
nano /var/www/tuma-africa/frontend/.env.production
```

**Should already be:**
```
REACT_APP_API_URL=https://tuma.com/api
REACT_APP_WS_URL=https://tuma.com
```

**If not, update and save.**

**Status:** ☐ Frontend .env.production configured

---

### Step 5: Rebuild Frontend

```bash
cd /var/www/tuma-africa/frontend
npm run build
cd ..
```

**Status:** ☐ Frontend rebuilt

---

### Step 6: Configure Nginx

```bash
# Copy nginx config (already has tuma.com)
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

**Status:** ☐ Nginx configured and reloaded

---

### Step 7: Setup SSL Certificate

```bash
certbot --nginx -d tuma.com -d www.tuma.com
```

**Follow prompts:**
- Enter email for renewal notices
- Agree to terms (A)
- Choose redirect HTTP to HTTPS (2)

**Status:** ☐ SSL certificate installed

---

### Step 8: Restart Application

```bash
pm2 restart tuma-africa-backend
pm2 save
```

**Status:** ☐ Application restarted

---

### Step 9: Verify Deployment

```bash
# Check PM2 status
pm2 status
# Should show: tuma-africa-backend (online)

# Check Nginx status
systemctl status nginx
# Should show: active (running)

# Test health endpoint
curl https://tuma.com/api/health
# Should return: {"status":"ok","message":"Server is running"}
```

**Status:** ☐ All checks passed

---

## ✅ Final Verification

- [ ] Visit: https://tuma.com (should show frontend)
- [ ] Test: https://tuma.com/api/health (should return JSON)
- [ ] Test login/authentication
- [ ] Test messaging/WebSocket
- [ ] Test notifications

---

## 🎉 Success!

Your app is now live at: **https://tuma.com**

---

## 🆘 If Something Goes Wrong

### 502 Bad Gateway?
```bash
pm2 logs tuma-africa-backend
pm2 restart tuma-africa-backend
```

### SSL Failed?
```bash
# Check DNS first
dig tuma.com
# Retry SSL
certbot --nginx -d tuma.com -d www.tuma.com
```

### Frontend Not Loading?
```bash
cd /var/www/tuma-africa/frontend && npm run build && cd ..
systemctl reload nginx
```

### Need More Help?
- See: `DEPLOYMENT_ROADMAP.md` for detailed troubleshooting
- See: `QUICK_REFERENCE_CARD.md` for quick commands

---

**Start with Step 1 above! 🚀**

