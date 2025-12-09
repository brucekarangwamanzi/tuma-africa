# 🚀 How to Run Backend and Frontend Separately

## Overview

This project is designed to run **backend** and **frontend separately** in different terminals. This gives you better control and easier debugging.

---

## 📋 Prerequisites

1. **Install dependencies** (one time):
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

   Or use the combined command:
   ```bash
   npm run install-all
   ```

2. **Setup environment variables**:
   - Create `.env` file in root directory
   - Add your MongoDB URI, JWT secrets, etc.

---

## 🔧 Running Backend Only

### Step 1: Open Terminal 1
```bash
cd /home/kmbruce/inn
```

### Step 2: Start Backend
```bash
npm run backend
```

**Or:**
```bash
npm run server
```

**Or directly:**
```bash
nodemon backend/server.js
```

### Expected Output:
```
MongoDB connected successfully
Server running on 0.0.0.0:5001
Local access: http://localhost:5001
✅ Socket.IO initialized successfully
```

### Backend URLs:
- **API**: http://localhost:5001/api
- **Swagger Docs**: http://localhost:5001/api-docs
- **Health Check**: http://localhost:5001/api/health

### To Stop Backend:
Press `Ctrl + C` in the terminal

---

## 🎨 Running Frontend Only

### Step 1: Open Terminal 2 (New Terminal)
```bash
cd /home/kmbruce/inn
```

### Step 2: Start Frontend
```bash
npm run frontend
```

**Or:**
```bash
cd frontend
npm start
```

### Expected Output:
```
Compiled successfully!

You can now view tuma-africa-cargo-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Frontend URL:
- **Application**: http://localhost:3000

### To Stop Frontend:
Press `Ctrl + C` in the terminal

---

## 📊 Running Both (Separate Terminals)

### Terminal 1 - Backend:
```bash
cd /home/kmbruce/inn
npm run backend
```

### Terminal 2 - Frontend:
```bash
cd /home/kmbruce/inn
npm run frontend
```

**Benefits:**
- ✅ See backend logs separately
- ✅ See frontend logs separately
- ✅ Stop one without affecting the other
- ✅ Easier debugging
- ✅ Better error visibility

---

## 🛠️ Available Scripts

### Root Directory (`/home/kmbruce/inn`):

| Command | Description |
|---------|-------------|
| `npm run backend` | Start backend with nodemon (auto-restart) |
| `npm run frontend` | Start frontend development server |
| `npm run build` | Build frontend |
| `npm start` | Start backend |
| `npm run install-all` | Install all dependencies (root + frontend) |

### Frontend Directory (`/home/kmbruce/inn/frontend`):

| Command | Description |
|---------|-------------|
| `npm start` | Start frontend development server |
| `npm run build` | Build frontend |
| `npm test` | Run tests |

---

## 🔍 Verification

### Check Backend is Running:
```bash
curl http://localhost:5001/api/health
```

Should return:
```json
{"status":"ok","timestamp":"...","uptime":...}
```

### Check Frontend is Running:
Open browser: http://localhost:3000

Should see your React application.

---

## 🐛 Troubleshooting

### Backend won't start:
1. Check if port 5001 is already in use:
   ```bash
   lsof -i :5001
   ```
2. Check MongoDB is running
3. Check `.env` file exists and has correct values

### Frontend won't start:
1. Check if port 3000 is already in use:
   ```bash
   lsof -i :3000
   ```
2. Make sure you're in the frontend directory
3. Check if dependencies are installed:
   ```bash
   cd frontend
   npm install
   ```

### Connection Issues:
- Backend must be running before frontend
- Check proxy in `frontend/package.json` is set to `http://localhost:5001`
- Check CORS settings in backend allow `http://localhost:3000`

---

## 📝 Quick Reference

### Start Backend:
```bash
npm run backend
```

### Start Frontend (in new terminal):
```bash
npm run frontend
```

### Stop:
Press `Ctrl + C` in respective terminal

---

## ✅ Best Practices

1. **Always start backend first** - Frontend needs backend API
2. **Use separate terminals** - Easier to see logs and debug
3. **Check ports** - Make sure 5001 (backend) and 3000 (frontend) are free
4. **Monitor logs** - Watch both terminals for errors
5. **Stop properly** - Use Ctrl+C instead of closing terminal

---

## 🎯 Development Workflow

1. **Terminal 1**: Start backend
   ```bash
   npm run backend
   ```

2. **Terminal 2**: Start frontend
   ```bash
   npm run frontend
   ```

3. **Browser**: Open http://localhost:3000

4. **Make changes**: Both will auto-reload (nodemon for backend, React for frontend)

5. **Stop**: Press Ctrl+C in each terminal when done

---

That's it! You now have full control over running backend and frontend separately! 🚀

