# 🚀 Master Deployment Guide - tuma.com

## 📋 Choose Your Deployment Type

### 🆕 First Time Deployment?
→ Use: **[DEPLOY_NOW.md](DEPLOY_NOW.md)**
- Complete server setup
- Install all software
- Configure everything from scratch
- 9 comprehensive steps

### 🔄 Updating Existing Deployment?
→ Use: **[RE_DEPLOYMENT_CHECKLIST.md](RE_DEPLOYMENT_CHECKLIST.md)**
- Quick update process
- Pull latest code
- Rebuild and restart
- 9 streamlined steps

---

## 🆕 Initial Deployment (First Time)

### Use: `DEPLOY_NOW.md`

**9 Steps:**
1. ✅ Connect to server
2. ✅ Run deployment script
3. ✅ Configure backend environment
4. ✅ Configure frontend environment
5. ✅ Rebuild frontend
6. ✅ Configure Nginx
7. ✅ Setup SSL certificate
8. ✅ Restart application
9. ✅ Verify deployment

**Time:** ~30-45 minutes

**Commands:**
```bash
# Step 1: Connect
ssh root@3.226.2.22

# Step 2: Deploy
curl -o- https://raw.githubusercontent.com/brucekarangwamanzi/tuma-africa/main/deploy-contabo.sh | bash

# Then follow DEPLOY_NOW.md for remaining steps
```

---

## 🔄 Re-Deployment (Updates)

### Use: `RE_DEPLOYMENT_CHECKLIST.md`

**9 Steps:**
1. ✅ Connect to server
2. ✅ Navigate to app directory
3. ✅ Pull latest code
4. ✅ Update dependencies
5. ✅ Update environment (if needed)
6. ✅ Rebuild frontend
7. ✅ Restart application
8. ✅ Reload Nginx (if config changed)
9. ✅ Verify deployment

**Time:** ~5-10 minutes

**Quick Command:**
```bash
cd /var/www/tuma-africa
git pull origin main
npm install
cd frontend && npm install && npm run build && cd ..
pm2 restart tuma-africa-backend
```

---

## 📊 Comparison

| Aspect | Initial Deployment | Re-Deployment |
|--------|-------------------|---------------|
| **Guide** | DEPLOY_NOW.md | RE_DEPLOYMENT_CHECKLIST.md |
| **Time** | 30-45 minutes | 5-10 minutes |
| **Steps** | 9 (full setup) | 9 (quick update) |
| **Includes** | Server setup, SSL, Nginx | Code update, rebuild, restart |
| **When** | First time | After initial deployment |

---

## 🎯 Quick Reference

### Initial Deployment Checklist
- [ ] Verify server IP: `3.226.2.22`
- [ ] Have MongoDB Atlas connection string
- [ ] Have Gmail App Password
- [ ] Follow: `DEPLOY_NOW.md`

### Re-Deployment Checklist
- [ ] Can connect to server
- [ ] Code changes pushed to GitHub
- [ ] Follow: `RE_DEPLOYMENT_CHECKLIST.md`

---

## 📚 Complete Documentation

### Main Guides
- **[DEPLOY_NOW.md](DEPLOY_NOW.md)** - Initial deployment (first time)
- **[RE_DEPLOYMENT_CHECKLIST.md](RE_DEPLOYMENT_CHECKLIST.md)** - Update existing deployment
- **[DEPLOYMENT_ROADMAP.md](DEPLOYMENT_ROADMAP.md)** - Detailed 9-step guide
- **[README_DEPLOYMENT.md](README_DEPLOYMENT.md)** - Complete overview

### Quick References
- **[QUICK_REFERENCE_CARD.md](QUICK_REFERENCE_CARD.md)** - One-page quick reference
- **[DEPLOYMENT_INDEX.md](DEPLOYMENT_INDEX.md)** - All documentation index

### Supporting Guides
- **[PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md)** - Pre-flight checklist
- **[DNS_CONFIGURATION_GUIDE.md](DNS_CONFIGURATION_GUIDE.md)** - DNS setup
- **[DNS_STATUS.md](DNS_STATUS.md)** - Current DNS status
- **[CONTABO_DEPLOYMENT_GUIDE.md](CONTABO_DEPLOYMENT_GUIDE.md)** - Complete reference

---

## 🔧 Configuration Files

All pre-configured for `tuma.com`:
- ✅ `deploy-contabo.sh` - Automated deployment script
- ✅ `nginx-contabo.conf` - Nginx configuration
- ✅ `ecosystem.config.js` - PM2 configuration
- ✅ `CONTABO_ENV_TEMPLATE.txt` - Environment variables

---

## 🌐 Your URLs

- **Frontend:** https://tuma.com
- **API:** https://tuma.com/api
- **WebSocket:** https://tuma.com

---

## ✅ Current Status

- ✅ DNS configured: `tuma.com` → `3.226.2.22`
- ✅ All configuration files ready
- ✅ Deployment scripts ready
- ✅ Complete documentation available

---

## 🚀 Ready to Deploy?

### First Time?
1. Verify server IP: `3.226.2.22`
2. Open: `DEPLOY_NOW.md`
3. Follow the 9-step checklist

### Updating?
1. Connect to server
2. Open: `RE_DEPLOYMENT_CHECKLIST.md`
3. Follow the 9-step checklist

---

## 🆘 Troubleshooting

Both guides include troubleshooting sections:
- 502 Bad Gateway fixes
- SSL certificate issues
- Frontend not loading
- Build failures
- Git pull issues

---

## 📝 Quick Commands

### Initial Deployment
```bash
ssh root@3.226.2.22
curl -o- https://raw.githubusercontent.com/brucekarangwamanzi/tuma-africa/main/deploy-contabo.sh | bash
# Then follow DEPLOY_NOW.md
```

### Re-Deployment
```bash
ssh root@3.226.2.22
cd /var/www/tuma-africa
git pull origin main
npm install
cd frontend && npm install && npm run build && cd ..
pm2 restart tuma-africa-backend
```

---

## 🎉 Success Indicators

After deployment, verify:
- ✅ `pm2 status` shows app online
- ✅ `https://tuma.com/api/health` returns JSON
- ✅ `https://tuma.com` shows frontend
- ✅ WebSocket connections work
- ✅ Authentication works
- ✅ Notifications work

---

**Choose the right guide for your situation and start deploying! 🚀**

