# 🔄 Re-Deployment Checklist - Update Existing Deployment

Use this checklist when updating your application after initial deployment.

---

## ✅ Pre-Re-Deployment

- [ ] **Verify Server Access:** Can connect to server
  ```bash
  ssh root@3.226.2.22
  ```

- [ ] **Check Current Status:**
  ```bash
  pm2 status
  systemctl status nginx
  curl https://tuma.com/api/health
  ```

---

## 🎯 Re-Deployment Steps

### Step 1: Connect to Server

```bash
ssh root@3.226.2.22
```

**Status:** ☐ Connected

---

### Step 2: Navigate to Application Directory

```bash
cd /var/www/tuma-africa
```

**Status:** ☐ In application directory

---

### Step 3: Pull Latest Changes

```bash
git pull origin main
```

**Or if you need to force update:**
```bash
git fetch origin
git reset --hard origin/main
```

**Status:** ☐ Latest code pulled

---

### Step 4: Install/Update Dependencies

```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

**Status:** ☐ Dependencies updated

---

### Step 5: Update Environment Variables (If Needed)

**Backend:**
```bash
nano /var/www/tuma-africa/backend/.env
# Update any changed values
# Save: Ctrl+X, Y, Enter
```

**Frontend:**
```bash
nano /var/www/tuma-africa/frontend/.env.production
# Update if needed
# Save: Ctrl+X, Y, Enter
```

**Status:** ☐ Environment variables updated (if needed)

---

### Step 6: Rebuild Frontend

```bash
cd /var/www/tuma-africa/frontend
npm run build
cd ..
```

**Status:** ☐ Frontend rebuilt

---

### Step 7: Restart Application

```bash
pm2 restart tuma-africa-backend
pm2 save
```

**Or if you need to reload:**
```bash
pm2 reload tuma-africa-backend
```

**Status:** ☐ Application restarted

---

### Step 8: Reload Nginx (If Config Changed)

**Only if you changed nginx configuration:**
```bash
# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

**Status:** ☐ Nginx reloaded (if needed)

---

### Step 9: Verify Deployment

```bash
# Check PM2 status
pm2 status
# Should show: tuma-africa-backend (online)

# Check logs
pm2 logs tuma-africa-backend --lines 50

# Test health endpoint
curl https://tuma.com/api/health
# Should return: {"status":"ok","message":"Server is running"}

# Check Nginx status
systemctl status nginx
# Should show: active (running)
```

**Status:** ☐ All checks passed

---

## ✅ Final Verification

- [ ] Visit: https://tuma.com (should show updated frontend)
- [ ] Test: https://tuma.com/api/health (should return JSON)
- [ ] Test login/authentication
- [ ] Test messaging/WebSocket
- [ ] Test notifications
- [ ] Check for any errors in browser console
- [ ] Verify new features/changes are working

---

## 🆘 Troubleshooting

### Application Not Starting?

```bash
# Check PM2 logs
pm2 logs tuma-africa-backend

# Check for errors
pm2 logs tuma-africa-backend --err

# Restart
pm2 restart tuma-africa-backend
```

### Build Failed?

```bash
# Check Node version
node --version

# Clear cache and rebuild
cd /var/www/tuma-africa/frontend
rm -rf node_modules build
npm install
npm run build
```

### 502 Bad Gateway?

```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs tuma-africa-backend

# Test backend directly
curl http://localhost:5001/api/health

# Restart backend
pm2 restart tuma-africa-backend
```

### Frontend Not Updating?

```bash
# Rebuild frontend
cd /var/www/tuma-africa/frontend
npm run build

# Clear browser cache
# Or hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

# Reload Nginx
systemctl reload nginx
```

### Git Pull Failed?

```bash
# Check git status
git status

# If there are local changes, stash them
git stash

# Then pull again
git pull origin main

# Or reset to remote (WARNING: loses local changes)
git fetch origin
git reset --hard origin/main
```

---

## 🔄 Quick Re-Deploy (All-in-One)

For quick updates, you can run this sequence:

```bash
cd /var/www/tuma-africa
git pull origin main
npm install
cd frontend && npm install && npm run build && cd ..
pm2 restart tuma-africa-backend
```

---

## 📝 Re-Deployment Checklist Summary

- [ ] Connected to server
- [ ] Pulled latest code
- [ ] Updated dependencies
- [ ] Updated environment variables (if needed)
- [ ] Rebuilt frontend
- [ ] Restarted application
- [ ] Reloaded Nginx (if config changed)
- [ ] Verified deployment
- [ ] Tested all functionality

---

## 🎉 Success!

Your application has been updated and is live at: **https://tuma.com**

---

**For initial deployment, use:** `DEPLOY_NOW.md`  
**For re-deployment/updates, use:** This checklist

