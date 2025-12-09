# ✅ Correct Commands to Run Backend and Frontend

## ⚠️ Important: Run from ROOT Directory

**You must run commands from the root directory (`/home/kmbruce/inn`), NOT from `backend/` or `frontend/` subdirectories!**

---

## 🚀 Correct Way to Run

### Step 1: Go to Root Directory
```bash
cd /home/kmbruce/inn
```

### Step 2: Run Backend
```bash
npm run backend
```

### Step 3: Run Frontend (in NEW terminal)
```bash
cd /home/kmbruce/inn
npm run frontend
```

---

## ❌ Wrong Way (What You Did)

```bash
# ❌ WRONG - Don't run from backend directory
cd backend
npm run dev  # ❌ This doesn't exist here!

# ❌ WRONG - Don't run from frontend directory  
cd frontend
npm run dev  # ❌ This doesn't exist here!
```

---

## ✅ Correct Commands

### From Root Directory (`/home/kmbruce/inn`):

| Command | What It Does |
|---------|--------------|
| `npm run backend` | Start backend server |
| `npm run frontend` | Start frontend server |
| `npm run backend:prod` | Start backend in production |
| `npm start` | Start backend in production |

### From Frontend Directory (`/home/kmbruce/inn/frontend`):

| Command | What It Does |
|---------|--------------|
| `npm start` | Start frontend server |
| `npm run build` | Build frontend |

---

## 📋 Step-by-Step Instructions

### Terminal 1 - Backend:
```bash
# 1. Go to root directory
cd /home/kmbruce/inn

# 2. Run backend
npm run backend
```

### Terminal 2 - Frontend:
```bash
# 1. Go to root directory (or frontend directory)
cd /home/kmbruce/inn

# Option A: Run from root
npm run frontend

# Option B: Or go to frontend and run
cd frontend
npm start
```

---

## 🔍 Why the Error Happened

The `dev` script was removed from the root `package.json` because you wanted to run them separately. The scripts are now:
- `npm run backend` - for backend
- `npm run frontend` - for frontend

These scripts are defined in the **root** `package.json`, not in `backend/package.json` or `frontend/package.json`.

---

## ✅ Quick Fix

Just run from the root directory:

```bash
# Make sure you're in the root
cd /home/kmbruce/inn

# Then run
npm run backend    # For backend
npm run frontend   # For frontend
```

---

## 🎯 Summary

**Always start from root directory:**
```bash
cd /home/kmbruce/inn
```

Then use:
- `npm run backend` ✅
- `npm run frontend` ✅

Not:
- `npm run dev` ❌ (removed)
- Running from `backend/` or `frontend/` directories ❌

