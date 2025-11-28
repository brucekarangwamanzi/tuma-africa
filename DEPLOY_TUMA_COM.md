# 🚀 Deploy to tuma.com - Quick Guide

## Your Domain: `tuma.com`

All configuration files have been updated with your domain.

---

## 🎯 Quick Deployment Steps

### Step 1: Connect to Your Contabo Server

```bash
ssh root@your-contabo-server-ip
```

### Step 2: Run the Deployment Script

```bash
curl -o- https://raw.githubusercontent.com/brucekarangwamanzi/tuma-africa/main/deploy-contabo.sh | bash
```

**OR** if you've uploaded the file:

```bash
chmod +x deploy-contabo.sh
./deploy-contabo.sh
```

### Step 3: Configure Environment Variables

```bash
# Backend environment
nano /var/www/tuma-africa/backend/.env
```

**Update these values:**
- `MONGODB_URI` → Your MongoDB Atlas connection string
- `FRONTEND_URL` → `https://tuma.com` (already set)
- `EMAIL_USER` → Your Gmail address
- `EMAIL_APP_PASSWORD` → Your Gmail App Password

```bash
# Frontend environment
nano /var/www/tuma-africa/frontend/.env.production
```

**Should be:**
- `REACT_APP_API_URL=https://tuma.com/api`
- `REACT_APP_WS_URL=https://tuma.com`

### Step 4: Rebuild Frontend

```bash
cd /var/www/tuma-africa/frontend
npm run build
cd ..
```

### Step 5: Configure Nginx

The `nginx-contabo.conf` file is already configured for `tuma.com`!

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

### Step 6: Setup SSL Certificate

```bash
certbot --nginx -d tuma.com -d www.tuma.com
```

Follow the prompts. Certbot will automatically configure SSL for `tuma.com`.

### Step 7: Restart Application

```bash
pm2 restart tuma-africa-backend
pm2 save
```

### Step 8: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check Nginx status
systemctl status nginx

# Test health endpoint
curl https://tuma.com/api/health
```

---

## ✅ Success!

Your app should now be live at:
- **Frontend:** https://tuma.com
- **API:** https://tuma.com/api
- **WebSocket:** https://tuma.com

---

## 🔍 Verify DNS

Before deploying, make sure your DNS is configured:

```bash
# Check if domain points to your server
dig tuma.com +short
nslookup tuma.com
```

The IP should match your Contabo server IP.

---

## 📝 Important Notes

1. **DNS Configuration:**
   - Point `tuma.com` A record to your Contabo server IP
   - Point `www.tuma.com` A record to your Contabo server IP
   - Wait for DNS propagation (can take up to 48 hours, usually < 1 hour)

2. **SSL Certificate:**
   - Certbot will automatically configure SSL
   - Certificate will auto-renew
   - Make sure DNS is working before running certbot

3. **Environment Variables:**
   - JWT secrets are already generated (in `secrets.txt`)
   - MongoDB URI needs to be set
   - Email credentials need to be set

---

## 🆘 Troubleshooting

### DNS Not Resolving?

```bash
# Check DNS
dig tuma.com
nslookup tuma.com

# Wait for propagation (can take time)
```

### SSL Certificate Fails?

- Make sure DNS is pointing to your server
- Make sure ports 80 and 443 are open
- Check firewall: `ufw status`

### 502 Bad Gateway?

```bash
# Check PM2
pm2 status
pm2 logs tuma-africa-backend

# Check if backend is running
curl http://localhost:5001/api/health
```

---

## 🔄 After Deployment

### Update Application

```bash
cd /var/www/tuma-africa
git pull origin main
npm install
cd frontend && npm install && npm run build && cd ..
pm2 restart tuma-africa-backend
```

### Check Logs

```bash
# Application logs
pm2 logs tuma-africa-backend

# Nginx logs
tail -f /var/log/nginx/tuma-africa-error.log
tail -f /var/log/nginx/tuma-africa-access.log
```

---

## ✅ Deployment Checklist

- [ ] DNS configured (tuma.com → server IP)
- [ ] Connected to Contabo server
- [ ] Deployment script completed
- [ ] Environment variables configured
- [ ] Frontend rebuilt
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Application restarted
- [ ] Health endpoint working: https://tuma.com/api/health
- [ ] Frontend accessible: https://tuma.com

---

**Ready to deploy? Start with Step 1 above! 🚀**

