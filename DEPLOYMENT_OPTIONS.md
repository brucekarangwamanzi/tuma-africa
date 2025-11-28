# 🚀 Deployment Options - Make Your App Accessible to Everyone

## 📋 Overview

This guide provides multiple options to deploy your Tuma Africa Cargo application so everyone can access it online.

---

## 🎯 Quick Comparison

| Option | Cost | Difficulty | Best For |
|--------|------|-----------|----------|
| **Render** | Free tier available | ⭐ Easy | Quick deployment |
| **Railway** | Free tier available | ⭐ Easy | Modern deployment |
| **Vercel + MongoDB Atlas** | Free tier available | ⭐⭐ Medium | Serverless |
| **DigitalOcean** | $6/month | ⭐⭐⭐ Advanced | Full control |
| **AWS** | Pay as you go | ⭐⭐⭐⭐ Expert | Enterprise |
| **Local Network** | Free | ⭐ Easy | Testing only |

---

## 🌟 Option 1: Render (RECOMMENDED)

**Best for**: Quick deployment with free tier

### Step 1: Prepare Your Code

1. Make sure your code is on GitHub
2. Update environment variables

### Step 2: Deploy Backend

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository
5. Configure:
   - **Name**: tuma-africa-cargo-backend
   - **Environment**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Plan**: Free

6. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

7. Click "Create Web Service"

### Step 3: Deploy Frontend

1. Click "New +" → "Static Site"
2. Connect your repository
3. Configure:
   - **Name**: tuma-africa-cargo-frontend
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`

4. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com/api
   REACT_APP_WS_URL=https://your-backend-url.onrender.com
   ```

5. Click "Create Static Site"

### Step 4: Get Your URL

Your app will be available at:
```
https://tuma-africa-cargo-frontend.onrender.com
```

---

## 🚂 Option 2: Railway

**Best for**: Modern deployment with great DX

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Step 2: Initialize Project

```bash
railway init
railway link
```

### Step 3: Deploy

```bash
# Deploy backend
cd backend
railway up

# Deploy frontend
cd ../frontend
railway up
```

### Step 4: Add Environment Variables

```bash
railway variables set MONGODB_URI=your_connection_string
railway variables set JWT_SECRET=your_secret
```

Your app will be available at:
```
https://your-app.railway.app
```

---

## ☁️ Option 3: DigitalOcean Droplet

**Best for**: Full control and custom domain

### Step 1: Create Droplet

1. Go to https://digitalocean.com
2. Create account
3. Create Droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month)
   - **Size**: 1GB RAM
   - **Region**: Closest to your users

### Step 2: Connect to Server

```bash
ssh root@your_droplet_ip
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

### Step 4: Deploy Application

```bash
# Clone repository
cd /var/www
git clone https://github.com/yourusername/tuma-africa-cargo.git
cd tuma-africa-cargo

# Install dependencies
npm install
cd frontend && npm install && npm run build
cd ..

# Create .env file
nano .env
```

Add:
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://localhost:27017/tuma-africa-cargo
JWT_SECRET=your_secret_key_here
```

### Step 5: Start with PM2

```bash
pm2 start backend/server.js --name tuma-africa-cargo
pm2 save
pm2 startup
```

### Step 6: Configure Nginx

```bash
nano /etc/nginx/sites-available/tuma-africa-cargo
```

Add:
```nginx
server {
    listen 80;
    server_name your_domain.com;

    # Frontend
    location / {
        root /var/www/tuma-africa-cargo/frontend/build;
        try_files $uri $uri/ /index.html;
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
        proxy_set_header Host $host;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/tuma-africa-cargo /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 7: Setup SSL (HTTPS)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your_domain.com
```

Your app will be available at:
```
https://your_domain.com
```

---

## 🌐 Option 4: Local Network Access (Testing)

**Best for**: Testing with team on same network

### Already Working!

Your app is accessible on your local network:

```
Frontend: http://192.168.43.98:3000
Backend:  http://192.168.43.98:5001
```

### Make it Permanent

1. **Keep servers running**:
```bash
# Use PM2 to keep servers running
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name backend

# Start frontend (for development)
cd ../frontend
pm2 start npm --name frontend -- start
```

2. **Access from any device on same WiFi**:
```
http://192.168.43.98:3000
```

---

## 🔧 Option 5: Ngrok (Quick Public URL)

**Best for**: Quick testing with public URL

### Step 1: Install Ngrok

```bash
# Download from https://ngrok.com
# Or install via npm
npm install -g ngrok
```

### Step 2: Start Your Servers

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm start
```

### Step 3: Expose with Ngrok

```bash
# Terminal 3: Expose frontend
ngrok http 3000
```

You'll get a public URL like:
```
https://abc123.ngrok.io
```

**Note**: Free tier URLs change on restart

---

## 📦 Complete Deployment Script

I'll create an automated deployment script for you:

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change JWT_SECRET to strong random string
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up MongoDB authentication
- [ ] Regular backups
- [ ] Monitor logs
- [ ] Update dependencies

---

## 🌍 Custom Domain Setup

### Step 1: Buy Domain

Popular registrars:
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare

### Step 2: Configure DNS

Add these records:

```
Type    Name    Value
A       @       your_server_ip
A       www     your_server_ip
```

### Step 3: Wait for Propagation

DNS changes take 1-48 hours to propagate.

---

## 📊 Monitoring & Maintenance

### PM2 Commands

```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart all apps
pm2 stop all            # Stop all apps
pm2 monit               # Monitor resources
```

### Nginx Commands

```bash
systemctl status nginx  # Check status
systemctl restart nginx # Restart
nginx -t                # Test configuration
```

### MongoDB Commands

```bash
systemctl status mongod # Check status
mongosh                 # Connect to MongoDB
```

---

## 🆘 Troubleshooting

### App Not Loading

1. Check if servers are running:
```bash
pm2 status
```

2. Check logs:
```bash
pm2 logs
```

3. Check ports:
```bash
netstat -tulpn | grep :5001
```

### Database Connection Failed

1. Check MongoDB status:
```bash
systemctl status mongod
```

2. Check connection string in .env

3. Test connection:
```bash
mongosh mongodb://localhost:27017/tuma-africa-cargo
```

### SSL Certificate Issues

```bash
certbot renew --dry-run
certbot certificates
```

---

## 💰 Cost Estimates

### Free Options
- **Render Free Tier**: $0/month (with limitations)
- **Railway Free Tier**: $0/month (500 hours)
- **Vercel**: $0/month (hobby)
- **MongoDB Atlas**: $0/month (512MB)

### Paid Options
- **DigitalOcean Droplet**: $6/month
- **AWS EC2 t2.micro**: ~$10/month
- **Render Starter**: $7/month
- **Railway Pro**: $5/month

---

## 🎉 Recommended Setup

For production deployment, I recommend:

1. **Backend**: Render Web Service ($7/month)
2. **Frontend**: Vercel (Free)
3. **Database**: MongoDB Atlas (Free tier)
4. **Domain**: Namecheap (~$10/year)
5. **SSL**: Let's Encrypt (Free)

**Total**: ~$8/month + $10/year domain

---

## 📞 Need Help?

Choose the option that best fits your needs and budget. I can help you with any of these deployment methods!
