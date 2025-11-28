# 🚀 Quick Reference Card - tuma.com Deployment

## ⚡ One-Page Deployment Guide

---

## 📋 Pre-Deployment Checklist

- [ ] Server IP verified: `3.226.2.22` (Contabo dashboard)
- [ ] DNS working: `dig tuma.com` returns `3.226.2.22`
- [ ] MongoDB Atlas connection string ready
- [ ] Gmail App Password ready
- [ ] SSH access to server confirmed

---

## 🎯 Deployment Commands (Copy & Paste)

### 1. Connect to Server
```bash
ssh root@3.226.2.22
```

### 2. Run Deployment Script
```bash
curl -o- https://raw.githubusercontent.com/brucekarangwamanzi/tuma-africa/main/deploy-contabo.sh | bash
```

### 3. Configure Environment
```bash
# Backend
nano /var/www/tuma-africa/backend/.env
# Update: MONGODB_URI, EMAIL_USER, EMAIL_APP_PASSWORD

# Frontend
nano /var/www/tuma-africa/frontend/.env.production
# Should be: REACT_APP_API_URL=https://tuma.com/api
#            REACT_APP_WS_URL=https://tuma.com
```

### 4. Rebuild Frontend
```bash
cd /var/www/tuma-africa/frontend && npm run build && cd ..
```

### 5. Setup Nginx
```bash
cp /var/www/tuma-africa/nginx-contabo.conf /etc/nginx/sites-available/tuma-africa
ln -s /etc/nginx/sites-available/tuma-africa /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 6. Setup SSL
```bash
certbot --nginx -d tuma.com -d www.tuma.com
```

### 7. Restart App
```bash
pm2 restart tuma-africa-backend
pm2 save
```

### 8. Verify
```bash
curl https://tuma.com/api/health
pm2 status
```

---

## 🔍 Quick Verification Commands

```bash
# DNS Check
dig tuma.com +short
# Should return: 3.226.2.22

# Server IP Check
curl ifconfig.me
# Should return: 3.226.2.22

# PM2 Status
pm2 status

# Nginx Status
systemctl status nginx

# Health Check
curl https://tuma.com/api/health
```

---

## 🆘 Quick Troubleshooting

### Can't Connect?
```bash
# Check server IP
curl ifconfig.me
```

### 502 Bad Gateway?
```bash
pm2 logs tuma-africa-backend
pm2 restart tuma-africa-backend
```

### SSL Failed?
```bash
# Check DNS first
dig tuma.com
# Then retry
certbot --nginx -d tuma.com -d www.tuma.com
```

### Frontend Not Loading?
```bash
# Rebuild frontend
cd /var/www/tuma-africa/frontend && npm run build && cd ..
# Restart Nginx
systemctl reload nginx
```

---

## 📝 Environment Variables Needed

### Backend (.env)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
FRONTEND_URL=https://tuma.com
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-gmail-app-password
JWT_SECRET=crKbcgas8cuVURJR4f3xEukxsQ1aETGxQ6NYCrmME6B+7nnV1xHi4l/jG9/TE+BF
JWT_REFRESH_SECRET=clgq5bvDhJjfra/GK/fA4BDRPiktR9bs7nQk0TzFJedhZHUOgfdvJ1EuKPf9gH3H
```

### Frontend (.env.production)
```
REACT_APP_API_URL=https://tuma.com/api
REACT_APP_WS_URL=https://tuma.com
```

---

## ✅ Success Checklist

- [ ] `pm2 status` shows app online
- [ ] `systemctl status nginx` shows active
- [ ] `https://tuma.com/api/health` returns JSON
- [ ] `https://tuma.com` shows frontend
- [ ] WebSocket works (test messaging)
- [ ] Authentication works (test login)

---

## 📚 Full Documentation

- **DEPLOYMENT_ROADMAP.md** - Complete 9-step guide
- **DEPLOY_TUMA_COM.md** - Detailed instructions
- **PRE_DEPLOYMENT_CHECKLIST.md** - Pre-flight checklist

---

## 🌐 Your URLs

- **Frontend:** https://tuma.com
- **API:** https://tuma.com/api
- **WebSocket:** https://tuma.com

---

**Start with:** `DEPLOYMENT_ROADMAP.md`

