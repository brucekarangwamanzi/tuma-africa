# ✅ Render Deployment Checklist

## 📋 Pre-Deployment

### 1. MongoDB Atlas Setup
- [ ] Create MongoDB Atlas account
- [ ] Create free cluster (M0)
- [ ] Create database user
- [ ] Whitelist all IPs (0.0.0.0/0)
- [ ] Copy connection string
- [ ] Test connection locally

### 2. GitHub Repository
- [ ] Code committed to GitHub
- [ ] Repository is public or Render has access
- [ ] All files pushed to main branch
- [ ] .env files NOT committed (in .gitignore)

### 3. Environment Variables Ready
- [ ] MongoDB connection string
- [ ] JWT secret key (strong random string)
- [ ] All API keys and secrets documented

---

## 🚀 Deployment Steps

### Backend Deployment
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Create Web Service
- [ ] Configure build command: `cd backend && npm install`
- [ ] Configure start command: `cd backend && node server.js`
- [ ] Add environment variables:
  - [ ] NODE_ENV=production
  - [ ] PORT=5001
  - [ ] MONGODB_URI
  - [ ] JWT_SECRET
  - [ ] RATE_LIMIT_WINDOW=15
  - [ ] RATE_LIMIT_MAX=500
- [ ] Deploy backend
- [ ] Wait for deployment (5-10 min)
- [ ] Test health endpoint: /api/health
- [ ] Copy backend URL

### Frontend Deployment
- [ ] Create Static Site on Render
- [ ] Connect same GitHub repository
- [ ] Configure build command: `cd frontend && npm install && npm run build`
- [ ] Configure publish directory: `frontend/build`
- [ ] Add environment variables:
  - [ ] REACT_APP_API_URL (backend URL + /api)
  - [ ] REACT_APP_WS_URL (backend URL)
- [ ] Deploy frontend
- [ ] Wait for deployment (5-10 min)
- [ ] Copy frontend URL

### Update Backend CORS
- [ ] Add FRONTEND_URL to backend environment variables
- [ ] Save and redeploy backend

---

## 🧪 Testing

### Backend Tests
- [ ] Health check works: /api/health
- [ ] API responds: /api/products
- [ ] Authentication works: /api/auth/login
- [ ] Database connected
- [ ] No CORS errors in console

### Frontend Tests
- [ ] App loads successfully
- [ ] Can view products
- [ ] Can register new user
- [ ] Can login
- [ ] Can send messages
- [ ] Real-time messaging works
- [ ] File uploads work
- [ ] No console errors

### Full Integration Tests
- [ ] User registration flow
- [ ] User login flow
- [ ] Browse products
- [ ] Place order
- [ ] Send message to admin
- [ ] Admin receives message
- [ ] Admin replies
- [ ] User receives reply

---

## 🔧 Post-Deployment

### Configuration
- [ ] Create admin user in database
- [ ] Test admin login
- [ ] Upload sample products
- [ ] Configure theme colors
- [ ] Test all admin features

### Monitoring
- [ ] Check Render logs for errors
- [ ] Monitor database usage
- [ ] Test from different devices
- [ ] Test from different networks
- [ ] Check mobile responsiveness

### Documentation
- [ ] Update README with live URLs
- [ ] Document admin credentials (securely)
- [ ] Create user guide
- [ ] Document API endpoints

---

## 🌐 Optional Enhancements

### Custom Domain
- [ ] Purchase domain name
- [ ] Configure DNS records
- [ ] Add custom domain in Render
- [ ] Verify SSL certificate
- [ ] Update all references to new domain

### Performance
- [ ] Enable caching
- [ ] Optimize images
- [ ] Minify assets
- [ ] Enable compression
- [ ] Monitor load times

### Security
- [ ] Review CORS settings
- [ ] Check rate limiting
- [ ] Audit dependencies
- [ ] Setup security headers
- [ ] Enable 2FA on accounts

### Monitoring & Analytics
- [ ] Setup error tracking (Sentry)
- [ ] Add analytics (Google Analytics)
- [ ] Setup uptime monitoring
- [ ] Configure alerts
- [ ] Setup logging

---

## 📊 Success Criteria

Your deployment is successful when:

- ✅ Frontend loads without errors
- ✅ Backend API responds correctly
- ✅ Database connection is stable
- ✅ Users can register and login
- ✅ Real-time messaging works
- ✅ File uploads work
- ✅ Admin panel accessible
- ✅ No console errors
- ✅ Mobile responsive
- ✅ HTTPS enabled

---

## 🎯 Quick Reference

### Your URLs (Update after deployment):
```
Frontend: https://tuma-africa-frontend.onrender.com
Backend:  https://tuma-africa-backend.onrender.com
Health:   https://tuma-africa-backend.onrender.com/api/health
```

### Important Commands:
```bash
# Test health endpoint
curl https://tuma-africa-backend.onrender.com/api/health

# View logs (in Render dashboard)
# Services → Your Service → Logs

# Redeploy
# Services → Your Service → Manual Deploy → Deploy latest commit
```

---

## 🆘 Common Issues

### Issue: Build Failed
**Solution**: Check build logs, verify package.json, ensure all dependencies listed

### Issue: Service Won't Start
**Solution**: Check start command, verify environment variables, check logs

### Issue: Database Connection Failed
**Solution**: Verify MongoDB URI, check IP whitelist, test connection string

### Issue: CORS Errors
**Solution**: Add frontend URL to backend CORS, check environment variables

### Issue: 404 on Frontend Routes
**Solution**: Verify publish directory, check build output, ensure routing configured

---

## 📞 Need Help?

1. Check RENDER_DEPLOYMENT_GUIDE.md for detailed instructions
2. Review Render documentation: https://render.com/docs
3. Check MongoDB Atlas docs: https://docs.atlas.mongodb.com
4. Review application logs in Render dashboard

---

## 🎉 Ready to Deploy!

Follow the checklist step by step, and your app will be live in about 30 minutes!

**Start here**: RENDER_DEPLOYMENT_GUIDE.md
