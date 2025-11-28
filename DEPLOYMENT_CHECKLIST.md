# 🚀 Full Deployment Checklist

## Current Status

- [x] Frontend deployed to Vercel
- [ ] Backend deployed to Railway
- [ ] Environment variables set in Railway
- [ ] Railway public domain generated
- [ ] Vercel environment variables updated
- [ ] Vercel redeployed

---

## Step 1: Railway Backend Deployment

### ✅ Completed
- [x] Configuration files ready (`railway.json`)

### 🔄 In Progress / To Do

1. **Go to Railway Dashboard**
   - [ ] Visit https://railway.app
   - [ ] Sign up/Login with GitHub

2. **Create New Project**
   - [ ] Click "New Project"
   - [ ] Select "Deploy from GitHub repo"
   - [ ] Choose: `brucekarangwamanzi/tuma-africa`
   - [ ] Wait for Railway to detect Node.js

3. **Set Environment Variables**
   - [ ] Go to Service → Variables tab
   - [ ] Add: `MONGODB_URI` = `your-mongodb-connection-string`
   - [ ] Add: `JWT_SECRET` = `your-jwt-secret`
   - [ ] Add: `JWT_REFRESH_SECRET` = `your-refresh-secret`
   - [ ] Add: `EMAIL_USER` = `your-email@gmail.com`
   - [ ] Add: `EMAIL_APP_PASSWORD` = `your-gmail-app-password`
   - [ ] Add: `NODE_ENV` = `production`
   - [ ] Add: `FRONTEND_URL` = `https://inn-mp1434skp-manzibruce67-4846s-projects.vercel.app`

4. **Generate Public Domain**
   - [ ] Go to Settings → Networking
   - [ ] Click "Generate Domain"
   - [ ] Copy the Railway URL: `https://________________.railway.app`

---

## Step 2: Update Vercel Environment Variables

### Once you have Railway URL:

1. **Update Vercel Variables**
   - [ ] Go to: https://vercel.com/manzibruce67-4846s-projects/inn/settings/environment-variables
   - [ ] Add/Update: `REACT_APP_API_URL` = `https://YOUR-RAILWAY-URL.railway.app/api`
   - [ ] Add/Update: `REACT_APP_WS_URL` = `https://YOUR-RAILWAY-URL.railway.app`
   - [ ] Select: Production, Preview, Development for each
   - [ ] Save

2. **Redeploy Vercel**
   - [ ] Run: `vercel --prod`
   - [ ] Or trigger redeploy from Vercel dashboard

---

## Step 3: Testing

- [ ] Test Railway health endpoint
- [ ] Test Vercel frontend
- [ ] Test authentication
- [ ] Test WebSocket connection
- [ ] Test notifications
- [ ] Test messaging

---

## 📝 Notes

**Railway URL Format:**
```
https://your-app-name.railway.app
```

**Vercel Environment Variables:**
```
REACT_APP_API_URL=https://your-app-name.railway.app/api
REACT_APP_WS_URL=https://your-app-name.railway.app
```

---

**Last Updated:** Check off items as you complete them!
