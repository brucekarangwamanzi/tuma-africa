# Quick Start: Deploy to Vercel

## 🚀 Fast Deployment Steps

### 1. Deploy Frontend to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# For production deployment
vercel --prod
```

**Or use Vercel Dashboard:**
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### 2. Set Environment Variables in Vercel

In Vercel Dashboard → Project Settings → Environment Variables:

```
REACT_APP_API_URL=https://your-backend.railway.app/api
REACT_APP_WS_URL=https://your-backend.railway.app
```

### 3. Deploy Backend to Railway (for Socket.IO)

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repository
4. Add environment variables (see below)
5. Deploy!

**Railway Environment Variables:**
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
NODE_ENV=production
```

### 4. Update Vercel Environment Variables

After Railway deployment, update Vercel with your Railway URL:
- `REACT_APP_API_URL`: `https://your-app.railway.app/api`
- `REACT_APP_WS_URL`: `https://your-app.railway.app`

### 5. Redeploy Vercel

After updating environment variables, redeploy:
```bash
vercel --prod
```

Or trigger redeploy from Vercel dashboard.

## ✅ Done!

Your app should now be live:
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.railway.app`

## 📝 Notes

- Socket.IO requires persistent connections (Railway supports this)
- MongoDB Atlas is recommended for production
- File uploads should use Cloudinary (already configured)

