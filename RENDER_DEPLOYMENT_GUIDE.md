# 🚀 Deploy to Render - Step by Step Guide

## 📋 Prerequisites

- [x] GitHub account
- [x] Code pushed to GitHub repository
- [x] MongoDB Atlas account (for database)

---

## 🎯 Deployment Steps

### Step 1: Setup MongoDB Atlas (Free Database)

#### 1.1 Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with Google or email

#### 1.2 Create Cluster
1. Choose "FREE" tier (M0 Sandbox)
2. Select region closest to you
3. Click "Create Cluster"
4. Wait 3-5 minutes for cluster creation

#### 1.3 Setup Database Access
1. Click "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `tumaadmin`
5. Password: Generate secure password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

#### 1.4 Setup Network Access
1. Click "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

#### 1.5 Get Connection String
1. Click "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string:
   ```
   mongodb+srv://tumaadmin:<password>@cluster0.xxxxx.mongodb.net/tuma-africa-cargo?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Save this connection string!

---

### Step 2: Push Code to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

### Step 3: Deploy Backend on Render

#### 3.1 Create Render Account
1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub

#### 3.2 Create Web Service
1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository: `tuma-africa`
4. Click "Connect"

#### 3.3 Configure Backend Service
Fill in the following:

**Basic Settings:**
- **Name**: `tuma-africa-backend`
- **Region**: Oregon (US West) or closest to you
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Environment**: `Node`
- **Build Command**: 
  ```bash
  cd backend && npm install
  ```
- **Start Command**: 
  ```bash
  cd backend && node server.js
  ```

**Plan:**
- Select **Free** ($0/month)

#### 3.4 Add Environment Variables
Click "Advanced" → "Add Environment Variable"

Add these variables:

```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://tumaadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/tuma-africa-cargo?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=500
```

**Important**: 
- Replace `YOUR_PASSWORD` with your MongoDB password
- Replace `JWT_SECRET` with a strong random string

#### 3.5 Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Your backend will be at: `https://tuma-africa-backend.onrender.com`

#### 3.6 Test Backend
Visit: `https://tuma-africa-backend.onrender.com/api/health`

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

---

### Step 4: Deploy Frontend on Render

#### 4.1 Create Static Site
1. Click "New +" button
2. Select "Static Site"
3. Connect same GitHub repository
4. Click "Connect"

#### 4.2 Configure Frontend Service
Fill in the following:

**Basic Settings:**
- **Name**: `tuma-africa-frontend`
- **Region**: Oregon (US West)
- **Branch**: `main`
- **Root Directory**: Leave empty
- **Build Command**: 
  ```bash
  cd frontend && npm install && npm run build
  ```
- **Publish Directory**: 
  ```
  frontend/build
  ```

#### 4.3 Add Environment Variables
Add these variables:

```env
REACT_APP_API_URL=https://tuma-africa-backend.onrender.com/api
REACT_APP_WS_URL=https://tuma-africa-backend.onrender.com
```

**Important**: Replace with your actual backend URL from Step 3

#### 4.4 Deploy
1. Click "Create Static Site"
2. Wait 5-10 minutes for deployment
3. Your frontend will be at: `https://tuma-africa-frontend.onrender.com`

---

### Step 5: Update Backend CORS

#### 5.1 Add Frontend URL to Environment Variables
1. Go to your backend service on Render
2. Click "Environment"
3. Add new variable:
   ```
   FRONTEND_URL=https://tuma-africa-frontend.onrender.com
   ```
4. Click "Save Changes"
5. Service will automatically redeploy

---

### Step 6: Create Admin User

#### 6.1 Connect to Your Database
```bash
# Install MongoDB Shell locally
brew install mongosh  # macOS
# or download from https://www.mongodb.com/try/download/shell

# Connect to your Atlas database
mongosh "mongodb+srv://tumaadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/tuma-africa-cargo"
```

#### 6.2 Create Admin User
```javascript
db.users.insertOne({
  fullName: "Super Admin",
  email: "admin@tumaafricacargo.com",
  password: "$2a$10$YourHashedPasswordHere",
  role: "super_admin",
  isActive: true,
  isApproved: true,
  createdAt: new Date()
})
```

Or use the create-admin script:
```bash
# Update .env with production MongoDB URI
MONGODB_URI=your_atlas_uri node create-admin.js
```

---

## 🎉 Your App is Live!

### Access URLs:
- **Frontend**: https://tuma-africa-frontend.onrender.com
- **Backend**: https://tuma-africa-backend.onrender.com
- **API Health**: https://tuma-africa-backend.onrender.com/api/health

---

## 🔧 Post-Deployment Configuration

### 1. Test Your App
1. Visit your frontend URL
2. Try to login
3. Test messaging feature
4. Upload a product
5. Place an order

### 2. Monitor Your Services
1. Go to Render Dashboard
2. Check logs for any errors
3. Monitor resource usage

### 3. Setup Custom Domain (Optional)

#### 3.1 Buy Domain
- Namecheap: ~$10/year
- GoDaddy: ~$12/year
- Google Domains: ~$12/year

#### 3.2 Configure DNS
In Render:
1. Go to your service
2. Click "Settings" → "Custom Domain"
3. Add your domain: `tumaafricacargo.com`
4. Follow DNS configuration instructions

Add these DNS records at your registrar:
```
Type: CNAME
Name: www
Value: tuma-africa-frontend.onrender.com

Type: A
Name: @
Value: [Render IP provided]
```

#### 3.3 SSL Certificate
Render automatically provides free SSL certificates!

---

## 📊 Free Tier Limitations

### Render Free Tier:
- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ Automatic SSL
- ✅ Custom domains
- ⚠️ Services spin down after 15 min of inactivity
- ⚠️ Cold start takes 30-60 seconds

### MongoDB Atlas Free Tier:
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ Good for ~1000 users

---

## 🚀 Upgrade Options

### When to Upgrade:

**Render Starter ($7/month per service):**
- No spin down
- Faster performance
- More resources

**MongoDB Atlas Shared ($9/month):**
- 2-5 GB storage
- Better performance
- Automated backups

---

## 🐛 Troubleshooting

### Backend Not Starting
1. Check logs in Render dashboard
2. Verify MongoDB connection string
3. Check environment variables
4. Ensure all dependencies in package.json

### Frontend Not Loading
1. Check build logs
2. Verify API URL in environment variables
3. Check CORS settings in backend
4. Clear browser cache

### Database Connection Failed
1. Verify MongoDB Atlas IP whitelist (0.0.0.0/0)
2. Check database user credentials
3. Test connection string locally
4. Ensure database name is correct

### Socket.IO Not Working
1. Verify WebSocket URL in frontend
2. Check CORS configuration
3. Ensure Socket.IO transports enabled
4. Check Render logs for WebSocket errors

---

## 📈 Monitoring & Maintenance

### Check Service Health
```bash
curl https://tuma-africa-backend.onrender.com/api/health
```

### View Logs
1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. Filter by error/warning

### Database Backups
1. Go to MongoDB Atlas
2. Click "Backup" tab
3. Enable automated backups (paid feature)
4. Or export manually

---

## 🔐 Security Checklist

- [x] Strong JWT_SECRET
- [x] MongoDB authentication enabled
- [x] CORS properly configured
- [x] Rate limiting enabled
- [x] HTTPS/SSL enabled
- [x] Environment variables secured
- [ ] Regular security updates
- [ ] Monitor for suspicious activity
- [ ] Regular database backups

---

## 💰 Cost Estimate

### Free Setup:
- Render Free Tier: $0/month
- MongoDB Atlas Free: $0/month
- **Total: $0/month**

### Recommended Production:
- Render Starter (2 services): $14/month
- MongoDB Atlas Shared: $9/month
- Domain: $10/year (~$1/month)
- **Total: ~$24/month**

---

## 🎯 Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Render
3. ✅ Test all features
4. ⬜ Setup custom domain
5. ⬜ Configure monitoring
6. ⬜ Setup automated backups
7. ⬜ Add analytics
8. ⬜ Optimize performance

---

## 📞 Support

### Render Support:
- Docs: https://render.com/docs
- Community: https://community.render.com

### MongoDB Atlas Support:
- Docs: https://docs.atlas.mongodb.com
- Support: https://support.mongodb.com

---

## 🎉 Congratulations!

Your Tuma Africa Cargo application is now live and accessible to everyone worldwide!

**Share your app**: https://tuma-africa-frontend.onrender.com
