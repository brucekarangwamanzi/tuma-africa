# ✅ Pre-Deployment Checklist for tuma.com

## Before You Start

Complete this checklist before deploying to ensure a smooth deployment.

---

## 📋 Prerequisites Checklist

### Server & Access
- [ ] Contabo VPS purchased and active
- [ ] SSH access to server (root or sudo user)
- [ ] Server IP address noted
- [ ] Ubuntu 20.04/22.04 installed

### Domain & DNS
- [ ] Domain `tuma.com` registered
- [ ] DNS A record for `tuma.com` → Contabo server IP
- [ ] DNS A record for `www.tuma.com` → Contabo server IP
- [ ] DNS propagation verified (use `dig tuma.com` or `nslookup tuma.com`)

### Database
- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created
- [ ] Database user created
- [ ] Connection string ready (format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)
- [ ] IP whitelist configured (allow all IPs: `0.0.0.0/0` for testing)

### Email
- [ ] Gmail account ready
- [ ] Gmail App Password generated (16 characters)
  - Go to: Google Account → Security → 2-Step Verification → App Passwords
- [ ] Email address noted

### Security
- [ ] JWT secrets generated (already done - in `secrets.txt`)
- [ ] Strong MongoDB password set
- [ ] Server root password secure

---

## 🔧 Configuration Files Ready

All files are pre-configured for `tuma.com`:

- [x] `nginx-contabo.conf` - Domain: `tuma.com`
- [x] `CONTABO_ENV_TEMPLATE.txt` - URLs: `https://tuma.com`
- [x] `ecosystem.config.js` - PM2 config ready
- [x] `deploy-contabo.sh` - Deployment script ready
- [x] `DEPLOY_TUMA_COM.md` - Deployment guide ready

---

## 📝 Information You'll Need

Have these ready before starting:

1. **Contabo Server IP:** `_________________`
2. **MongoDB Connection String:** `mongodb+srv://...`
3. **Gmail Address:** `_________________`
4. **Gmail App Password:** `_________________`

---

## 🚀 Deployment Steps Summary

1. **Verify DNS** (if not done)
   ```bash
   dig tuma.com
   nslookup tuma.com
   ```

2. **Connect to Server**
   ```bash
   ssh root@your-contabo-server-ip
   ```

3. **Run Deployment Script**
   ```bash
   curl -o- https://raw.githubusercontent.com/brucekarangwamanzi/tuma-africa/main/deploy-contabo.sh | bash
   ```

4. **Configure Environment**
   - Edit `/var/www/tuma-africa/backend/.env`
   - Edit `/var/www/tuma-africa/frontend/.env.production`

5. **Rebuild Frontend**
   ```bash
   cd /var/www/tuma-africa/frontend && npm run build && cd ..
   ```

6. **Configure Nginx**
   - Copy nginx config (already has tuma.com)
   - Enable site
   - Test and reload

7. **Setup SSL**
   ```bash
   certbot --nginx -d tuma.com -d www.tuma.com
   ```

8. **Restart Application**
   ```bash
   pm2 restart tuma-africa-backend
   ```

9. **Verify**
   - Check: https://tuma.com/api/health
   - Check: https://tuma.com

---

## ⚠️ Important Notes

### DNS Configuration
- **Must be done BEFORE SSL setup**
- Can take up to 48 hours to propagate (usually < 1 hour)
- Verify with: `dig tuma.com` or `nslookup tuma.com`

### SSL Certificate
- Requires DNS to be working
- Certbot will automatically configure Nginx
- Auto-renews every 90 days

### Environment Variables
- JWT secrets are already generated (use from `secrets.txt`)
- MongoDB URI must be valid and accessible
- Email credentials must be correct

---

## 🆘 Troubleshooting Preparation

### If DNS Not Working
- Wait for propagation
- Check DNS settings in domain registrar
- Verify A records point to correct IP

### If SSL Fails
- Ensure DNS is working first
- Check ports 80 and 443 are open
- Verify firewall: `ufw status`

### If Application Not Starting
- Check PM2 logs: `pm2 logs tuma-africa-backend`
- Verify environment variables
- Check MongoDB connection

---

## ✅ Ready to Deploy?

Once all checklist items are complete:

1. Open `DEPLOY_TUMA_COM.md`
2. Follow the step-by-step instructions
3. Your app will be live at `https://tuma.com`

---

**Good luck with your deployment! 🚀**

