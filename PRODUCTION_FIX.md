# Fix 401 Unauthorized Error on Production

## Problem
Getting `401 Unauthorized` error when trying to login on production server (213.199.35.46).

## Root Causes
1. **CORS Configuration**: Backend doesn't allow requests from `http://213.199.35.46`
2. **Frontend API URL**: Frontend not configured with correct production API URL
3. **Environment Variables**: Missing `FRONTEND_URL` in backend `.env`

## Solutions Applied

### 1. Updated Backend CORS Configuration
Added production server IP to allowed origins in `backend/server.js`:
- `http://213.199.35.46`
- `https://213.199.35.46`
- Regex pattern for IP with any port

### 2. Created Frontend Production Environment File
Created `frontend/.env.production`:
```env
REACT_APP_API_URL=http://213.199.35.46/api
REACT_APP_WS_URL=http://213.199.35.46
```

### 3. Updated Backend Environment
Added to `backend/.env`:
```env
FRONTEND_URL=http://213.199.35.46
```

## Deployment Steps

### On Your Production Server (213.199.35.46)

1. **Update Backend CORS** (already done in code):
   ```bash
   cd /var/www/tuma-africa/backend
   # Pull latest code or manually update server.js
   ```

2. **Update Backend .env**:
   ```bash
   cd /var/www/tuma-africa/backend
   echo "FRONTEND_URL=http://213.199.35.46" >> .env
   ```

3. **Create Frontend .env.production**:
   ```bash
   cd /var/www/tuma-africa/frontend
   cat > .env.production << 'EOF'
   REACT_APP_API_URL=http://213.199.35.46/api
   REACT_APP_WS_URL=http://213.199.35.46
   EOF
   ```

4. **Rebuild Frontend**:
   ```bash
   cd /var/www/tuma-africa/frontend
   npm install
   npm run build
   ```

5. **Restart Backend**:
   ```bash
   cd /var/www/tuma-africa/backend
   # If using PM2:
   pm2 restart all
   # Or if using npm:
   # Stop and restart: npm start
   ```

6. **Restart Nginx**:
   ```bash
   sudo systemctl restart nginx
   ```

## Verification

1. **Test Backend Health**:
   ```bash
   curl http://213.199.35.46/api/health
   ```

2. **Test Login Endpoint**:
   ```bash
   curl -X POST http://213.199.35.46/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@tumaafricacargo.com","password":"admin123"}'
   ```

3. **Check CORS Headers**:
   ```bash
   curl -I -X OPTIONS http://213.199.35.46/api/auth/login \
     -H "Origin: http://213.199.35.46" \
     -H "Access-Control-Request-Method: POST"
   ```

## Additional Checks

### Check Backend Logs
```bash
# If using PM2:
pm2 logs

# Or check server logs:
tail -f /var/www/tuma-africa/backend/logs/*.log
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/tuma-africa-error.log
sudo tail -f /var/log/nginx/tuma-africa-access.log
```

### Verify Environment Variables
```bash
# Backend
cd /var/www/tuma-africa/backend
node -e "require('dotenv').config(); console.log('FRONTEND_URL:', process.env.FRONTEND_URL);"

# Frontend (check build)
cd /var/www/tuma-africa/frontend/build
grep -r "REACT_APP_API_URL" static/js/ | head -1
```

## Common Issues

### Issue: Still getting 401
**Solution**: 
- Verify backend is running: `curl http://localhost:5001/api/health`
- Check backend logs for authentication errors
- Verify JWT_SECRET is set in backend/.env
- Restart backend after .env changes

### Issue: CORS errors in browser console
**Solution**:
- Verify backend CORS includes `http://213.199.35.46`
- Check that backend is reading updated server.js
- Restart backend server

### Issue: Frontend still using old API URL
**Solution**:
- Delete `frontend/build` folder
- Rebuild: `npm run build`
- Clear browser cache
- Hard refresh: Ctrl+Shift+R

## Quick Fix Script

Run this on your production server:

```bash
#!/bin/bash
cd /var/www/tuma-africa

# Update backend .env
echo "FRONTEND_URL=http://213.199.35.46" >> backend/.env

# Create frontend .env.production
cat > frontend/.env.production << 'EOF'
REACT_APP_API_URL=http://213.199.35.46/api
REACT_APP_WS_URL=http://213.199.35.46
EOF

# Rebuild frontend
cd frontend
npm run build

# Restart backend (if using PM2)
pm2 restart all

# Restart nginx
sudo systemctl restart nginx

echo "✅ Production configuration updated!"
```

