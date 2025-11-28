# 🚂 Railway Backend Deployment Guide

## Quick Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Go to Railway**
   - Visit https://railway.app
   - Sign up/Login with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `brucekarangwamanzi/tuma-africa`

3. **Configure Service**
   - Railway will auto-detect Node.js
   - **Root Directory**: Leave empty (uses root)
   - **Build Command**: `npm install` (auto-detected)
   - **Start Command**: `npm start` (already in railway.json)

4. **Set Environment Variables**
   Click on your service → Variables tab → Add:

   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
   JWT_SECRET=your-secret-key-here
   JWT_REFRESH_SECRET=your-refresh-secret-here
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-gmail-app-password
   NODE_ENV=production
   FRONTEND_URL=https://inn-mp1434skp-manzibruce67-4846s-projects.vercel.app
   PORT=5001
   ```

5. **Deploy**
   - Railway will automatically deploy
   - Wait for deployment to complete
   - Check logs for any errors

6. **Get Your Railway URL**
   - Go to Settings → Networking
   - Generate a public domain
   - Copy the URL (e.g., `https://your-app.railway.app`)

7. **Update Vercel Environment Variables**
   - Go to Vercel Dashboard
   - Project Settings → Environment Variables
   - Update:
     - `REACT_APP_API_URL` = `https://your-app.railway.app/api`
     - `REACT_APP_WS_URL` = `https://your-app.railway.app`
   - Redeploy Vercel: `vercel --prod`

---

### Option 2: Deploy via Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to existing project (or create new)
railway link

# Set environment variables
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set JWT_SECRET="your-secret"
railway variables set JWT_REFRESH_SECRET="your-refresh-secret"
railway variables set EMAIL_USER="your-email@gmail.com"
railway variables set EMAIL_APP_PASSWORD="your-app-password"
railway variables set NODE_ENV="production"
railway variables set FRONTEND_URL="https://inn-mp1434skp-manzibruce67-4846s-projects.vercel.app"

# Deploy
railway up
```

---

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret for JWT tokens | Random string (32+ chars) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Random string (32+ chars) |
| `EMAIL_USER` | Gmail address for sending emails | `your-email@gmail.com` |
| `EMAIL_APP_PASSWORD` | Gmail app password | 16-char app password |
| `NODE_ENV` | Environment mode | `production` |
| `FRONTEND_URL` | Vercel frontend URL | `https://inn-mp1434skp-manzibruce67-4846s-projects.vercel.app` |
| `PORT` | Server port (optional, Railway auto-assigns) | `5001` |

---

## Post-Deployment Checklist

- [ ] Backend deployed successfully
- [ ] Railway URL obtained
- [ ] Environment variables set in Vercel
- [ ] Vercel redeployed with new variables
- [ ] Test API endpoint: `https://your-app.railway.app/api/health`
- [ ] Test WebSocket connection
- [ ] Test authentication flow
- [ ] Test notifications
- [ ] Test messaging

---

## Troubleshooting

### Port Issues
- Railway automatically assigns a port via `PORT` environment variable
- The server.js already uses `process.env.PORT || 5001`

### Build Failures
- Check Railway logs: Service → Deployments → View Logs
- Ensure all dependencies are in root `package.json`
- Verify Node.js version (Railway auto-detects)

### Connection Issues
- Verify CORS settings in `backend/server.js`
- Check that Railway URL is added to `allowedOrigins`
- Ensure `FRONTEND_URL` is set correctly

### WebSocket Issues
- Railway supports WebSocket connections
- Ensure `REACT_APP_WS_URL` matches Railway URL exactly
- Check Socket.IO CORS configuration

---

## Railway URL Format

After deployment, your Railway URL will be:
- `https://your-app-name.railway.app`

Use this for:
- `REACT_APP_API_URL`: `https://your-app-name.railway.app/api`
- `REACT_APP_WS_URL`: `https://your-app-name.railway.app`

---

## Next Steps

1. ✅ Deploy backend to Railway
2. ✅ Get Railway URL
3. ✅ Update Vercel environment variables
4. ✅ Redeploy Vercel frontend
5. ✅ Test the full application

---

**Need Help?** Check Railway docs: https://docs.railway.app

