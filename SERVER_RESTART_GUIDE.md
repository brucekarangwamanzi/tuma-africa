# Server Restart Guide

## ✅ Servers Restarted Successfully!

**Status:** RUNNING  
**Frontend:** http://localhost:3000 ✅  
**Backend:** http://localhost:5001 ✅  
**Database:** MongoDB Connected ✅

---

## 🔧 What Happened?

The backend server crashed (terminated with code 143). This can happen due to:
- Memory issues
- Unhandled errors
- Process interruption
- Database connection issues

**Solution:** Restarted both servers - now working perfectly!

---

## 🚀 Current Status

```
✅ Backend Server:  Running on port 5001
✅ Frontend Server: Running on port 3000
✅ MongoDB:         Connected
✅ WebSocket:       Ready
✅ Compilation:     Successful
```

---

## 🔄 If Server Crashes Again

### Quick Restart:

**Option 1: Using npm (Recommended)**
```bash
# Stop current process (Ctrl+C)
# Then restart:
npm run dev
```

**Option 2: Restart Individual Servers**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

**Option 3: Full Restart**
```bash
# Stop all processes
# Close all terminals
# Open new terminal
npm run dev
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Port Already in Use
**Error:** `Port 5001 is already in use`

**Solution:**
```bash
# Find process using port
lsof -i :5001

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=5002
```

### Issue 2: MongoDB Connection Failed
**Error:** `MongoDB connection error`

**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Or check connection string in .env
MONGODB_URI=mongodb://localhost:27017/your-db
```

### Issue 3: Module Not Found
**Error:** `Cannot find module 'xyz'`

**Solution:**
```bash
# Reinstall dependencies
npm install

# Clear cache
npm cache clean --force

# Reinstall everything
rm -rf node_modules package-lock.json
npm install
```

### Issue 4: WebSocket Connection Failed
**Error:** `WebSocket disconnected`

**Solution:**
1. Check if backend is running
2. Verify WebSocket port in config
3. Check firewall settings
4. Restart both servers

---

## 📊 Health Check

### Verify Everything is Working:

1. **Backend Health**
   ```bash
   curl http://localhost:5001/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Frontend Access**
   - Open: http://localhost:3000
   - Should load homepage

3. **Database Connection**
   - Check server logs
   - Should see: "MongoDB connected successfully"

4. **WebSocket**
   - Open browser console
   - Should see WebSocket connection established

---

## 🔍 Monitoring

### Watch Server Logs:

The development server shows logs in real-time:
- `[0]` = Backend logs
- `[1]` = Frontend logs

**Look for:**
- ✅ "Server running on port 5001"
- ✅ "MongoDB connected successfully"
- ✅ "Compiled successfully"
- ❌ Any error messages

---

## 💡 Prevention Tips

### 1. Monitor Memory Usage
```bash
# Check memory
free -h

# Check Node processes
ps aux | grep node
```

### 2. Handle Errors Gracefully
- Add try-catch blocks
- Log errors properly
- Use error boundaries

### 3. Use Process Manager (Production)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start backend/server.js --name "backend"
pm2 start "npm run client" --name "frontend"

# Monitor
pm2 monit

# Auto-restart on crash
pm2 startup
```

### 4. Regular Maintenance
- Clear logs regularly
- Update dependencies
- Monitor disk space
- Check database size

---

## 🚨 Emergency Procedures

### If Nothing Works:

1. **Full System Restart**
   ```bash
   # Stop all Node processes
   killall node
   
   # Clear all caches
   npm cache clean --force
   
   # Remove node_modules
   rm -rf node_modules frontend/node_modules
   
   # Reinstall
   npm run install-all
   
   # Restart
   npm run dev
   ```

2. **Check System Resources**
   ```bash
   # Disk space
   df -h
   
   # Memory
   free -h
   
   # CPU
   top
   ```

3. **Database Reset (Last Resort)**
   ```bash
   # Backup first!
   mongodump --out backup/
   
   # Drop database
   mongo
   > use your-database
   > db.dropDatabase()
   
   # Restart server (will recreate)
   npm run dev
   ```

---

## 📝 Logging

### Enable Detailed Logging:

**Backend (.env):**
```
LOG_LEVEL=debug
NODE_ENV=development
```

**Frontend:**
- Open DevTools (F12)
- Check Console tab
- Check Network tab

---

## 🎯 Quick Commands

```bash
# Restart servers
npm run dev

# Check if ports are free
lsof -i :3000
lsof -i :5001

# Kill processes on ports
kill -9 $(lsof -t -i:3000)
kill -9 $(lsof -t -i:5001)

# Check MongoDB
sudo systemctl status mongod

# View logs
tail -f backend/logs/error.log

# Clear cache
npm cache clean --force
```

---

## ✅ Verification Checklist

After restart, verify:

- [ ] Backend running on port 5001
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] No errors in console
- [ ] Can access http://localhost:3000
- [ ] Can login
- [ ] WebSocket connected
- [ ] Theme system works
- [ ] Messages page works

---

## 📞 Still Having Issues?

1. Check all error messages
2. Review server logs
3. Check browser console
4. Verify .env configuration
5. Test in incognito mode
6. Try different browser
7. Restart computer (if needed)

---

## 🎉 Success!

Servers are now running smoothly. You can:
- ✅ Access the application
- ✅ Login and use features
- ✅ Test theme system
- ✅ Use messaging system

**Everything is working!** 🚀

---

**Last Restart:** Just now  
**Status:** All systems operational ✅
