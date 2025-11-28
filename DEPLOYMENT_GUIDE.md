# 🚀 Deployment Guide - Make Your App Accessible Online

## 📋 Overview

This guide will help you deploy your Tuma Africa Cargo application so anyone can access it from anywhere in the world.

---

## 🎯 Deployment Options

### Option 1: Render (Recommended - FREE)
- ✅ Free tier available
- ✅ Easy setup
- ✅ Automatic HTTPS
- ✅ Good for production

### Option 2: Railway
- ✅ Free tier available
- ✅ Very easy deployment
- ✅ Great developer experience

### Option 3: Heroku
- ✅ Popular platform
- ✅ Easy to use
- ⚠️ No longer has free tier

### Option 4: DigitalOcean/AWS/Azure
- ✅ Full control
- ✅ Scalable
- ⚠️ Requires more setup
- ⚠️ Costs money

---

## 🌟 OPTION 1: Render (Recommended)

### Step 1: Prepare Your Code

#### 1.1 Create Production Environment File
```bash
# Create .env.production in backend folder
cat > backend/.env.production << 'EOF'
NODE_ENV=production
PORT=5001
MONGODB_URI=your_mongodb_atlas_uri_here
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
EOF
```

#### 1.2 Update package.json Scripts
Already configured! Your scripts are ready.

### Step 2: Setup MongoDB Atlas (Free Database)

1. **Go to**: https://www.mongodb.com/cloud/atlas
2. **Sign up** for free account
3. **Create a cluster** (Free M0 tier)
4. **Create database user**:
   - Username: `tumaadmin`
   - Password: (generate strong password)
5. **Whitelist IP**: Add `0.0.0.0/0` (allow from anywhere)
6. **Get connection string**:
   ```
   mongodb+srv://tumaadmin:<password>@cluster0.xxxxx.mongodb.net/tuma-africa-cargo?retryWrites=true&w=majority
   ```

### Step 3: Deploy Backend to Render

1. **Go to**: https://render.com
2. **Sign up** with GitHub
3. **Connect your repository**
4. **Create New Web Service**:
   - Name: `tuma-africa-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Plan: `Free`

5. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=5001
   MONGODB_URI=mongodb+srv://tumaadmin:password@cluster0.xxxxx.mongodb.net/tuma-africa-cargo
   JWT_SECRET=your_super_secret_key_change_this_in_production
   JWT_EXPIRES_IN=7d
   ```

6. **Deploy** - Wait 5-10 minutes

7. **Your backend URL**: `https://tuma-africa-backend.onrender.com`

### Step 4: Deploy Frontend to Render

1. **Create New Static Site**:
   - Name: `tuma-africa-frontend`
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/build`

2. **Add Environment Variables**:
   ```
   REACT_APP_API_URL=https://tuma-africa-backend.onrender.com/api
   REACT_APP_WS_URL=https://tuma-africa-backend.onrender.com
   ```

3. **Deploy** - Wait 5-10 minutes

4. **Your frontend URL**: `https://tuma-africa-frontend.onrender.com`

### Step 5: Update CORS in Backend

Update `backend/server.js`:
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tuma-africa-frontend.onrender.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));
```

---

## 🚂 OPTION 2: Railway (Alternative)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Step 2: Deploy Backend
```bash
cd backend
railway init
railway up
railway variables set MONGODB_URI="your_mongodb_uri"
railway variables set JWT_SECRET="your_secret"
```

### Step 3: Deploy Frontend
```bash
cd frontend
railway init
railway up
railway variables set REACT_APP_API_URL="your_backend_url"
```

---

## 🔧 OPTION 3: VPS (DigitalOcean/AWS)

### Step 1: Create VPS Server
1. Create Ubuntu 22.04 server
2. Get server IP address

### Step 2: Connect to Server
```bash
ssh root@your_server_ip
```

### Step 3: Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org
systemctl start mongod
systemctl enable mongod

# Install Nginx
apt install -y nginx

# Install PM2
npm install -g pm2
```

### Step 4: Clone Your Repository
```bash
cd /var/www
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

### Step 5: Setup Backend
```bash
cd backend
npm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://localhost:27017/tuma-africa-cargo
JWT_SECRET=your_super_secret_key
EOF

# Start with PM2
pm2 start server.js --name tuma-backend
pm2 save
pm2 startup
```

### Step 6: Setup Frontend
```bash
cd ../frontend

# Update .env
cat > .env << 'EOF'
REACT_APP_API_URL=http://your_server_ip:5001/api
REACT_APP_WS_URL=http://your_server_ip:5001
EOF

npm install
npm run build

# Copy build to nginx
cp -r build /var/www/html/tuma-africa
```

### Step 7: Configure Nginx
```bash
cat > /etc/nginx/sites-available/tuma-africa << 'EOF'
server {
    listen 80;
    server_name your_domain.com;

    # Frontend
    location / {
        root /var/www/html/tuma-africa;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/tuma-africa /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 8: Setup SSL (HTTPS)
```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your_domain.com

# Auto-renewal
certbot renew --dry-run
```

---

## 🌐 Domain Setup

### Option A: Free Domain (Freenom)
1. Go to: https://www.freenom.com
2. Search for available domain
3. Register free domain (.tk, .ml, .ga, .cf, .gq)
4. Point to your server IP

### Option B: Buy Domain (Namecheap/GoDaddy)
1. Buy domain (~$10/year)
2. Add DNS records:
   ```
   Type: A
   Name: @
   Value: your_server_ip
   
   Type: A
   Name: www
   Value: your_server_ip
   ```

---

## 📦 Pre-Deployment Checklist

### Backend
- [ ] Environment variables set
- [ ] MongoDB connection working
- [ ] CORS configured for production
- [ ] File upload directory exists
- [ ] JWT secret is strong and unique
- [ ] Rate limiting configured
- [ ] Error handling in place

### Frontend
- [ ] API URL points to production backend
- [ ] WebSocket URL configured
- [ ] Build completes without errors
- [ ] No console errors
- [ ] All features tested

### Security
- [ ] Strong JWT secret
- [ ] MongoDB password protected
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation in place

---

## 🔍 Testing Deployment

### 1. Test Backend
```bash
curl https://your-backend-url.com/api/health
# Should return: {"status":"ok"}
```

### 2. Test Frontend
Open browser: `https://your-frontend-url.com`
- [ ] Page loads
- [ ] Can register/login
- [ ] Can view products
- [ ] Can send messages
- [ ] WebSocket connects

### 3. Test WebSocket
Open browser console:
```javascript
// Should see:
✅ WebSocket connected successfully
```

---

## 🐛 Common Issues

### Issue 1: CORS Error
**Solution**: Update backend CORS to include your frontend URL

### Issue 2: WebSocket Not Connecting
**Solution**: Ensure WebSocket URL is correct and uses wss:// for HTTPS

### Issue 3: MongoDB Connection Failed
**Solution**: Check MongoDB URI and whitelist IP in MongoDB Atlas

### Issue 4: Build Fails
**Solution**: Check Node version (should be 16+)

---

## 📊 Monitoring

### Setup PM2 Monitoring (VPS)
```bash
pm2 install pm2-logrotate
pm2 logs tuma-backend
pm2 monit
```

### Setup Uptime Monitoring
- Use: https://uptimerobot.com (Free)
- Monitor your URLs every 5 minutes
- Get alerts if site goes down

---

## 💰 Cost Estimate

### Free Option (Render + MongoDB Atlas)
- Backend: FREE
- Frontend: FREE
- Database: FREE
- Total: **$0/month**

### VPS Option (DigitalOcean)
- Server: $5-10/month
- Domain: $10/year
- Total: **~$6/month**

---

## 🚀 Quick Deploy Commands

### For Render (Easiest)
```bash
# 1. Push to GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 2. Go to render.com and connect repo
# 3. Follow steps above
```

### For VPS
```bash
# On your server
cd /var/www/your-repo
git pull
cd backend && npm install && pm2 restart tuma-backend
cd ../frontend && npm install && npm run build
cp -r build/* /var/www/html/tuma-africa/
```

---

## 📞 Support

If you need help:
1. Check logs: `pm2 logs` (VPS) or Render dashboard
2. Check browser console for errors
3. Verify environment variables
4. Test API endpoints individually

---

## 🎉 Success!

Once deployed, your app will be accessible at:
- **Frontend**: `https://your-domain.com`
- **Backend**: `https://your-api-domain.com`

Share the link with your users! 🚀
