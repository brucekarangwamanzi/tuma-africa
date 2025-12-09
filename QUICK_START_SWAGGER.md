# Quick Start: View Your Swagger API Documentation

## 🚨 Issue Found: Server Not Running

Your Swagger documentation is **correctly configured**, but you need to **start your server** first!

## ✅ Step-by-Step Instructions:

### Step 1: Start Your Server

Open a terminal and run:

```bash
cd /home/kmbruce/inn
npm run server
```

Or:

```bash
node backend/server.js
```

You should see output like:
```
MongoDB connected successfully
Server running on 0.0.0.0:5001
Local access: http://localhost:5001
```

### Step 2: Open Swagger UI in Browser

Once the server is running, open your browser and go to:

```
http://localhost:5001/api-docs
```

### Step 3: Find Authentication Section

1. Look at the **left sidebar** of the Swagger UI page
2. Find the section labeled **"Authentication"**
3. Click on it to expand
4. You'll see all 7 authentication endpoints:
   - POST /auth/register
   - POST /auth/login
   - POST /auth/refresh
   - POST /auth/logout
   - GET /auth/me
   - POST /auth/forgot-password
   - POST /auth/reset-password

### Step 4: Test an Endpoint

1. Click on **POST /auth/login**
2. Click the green **"Try it out"** button
3. You'll see the request body with `email` and `password` fields
4. Fill them in:
   ```json
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
   ```
5. Click **"Execute"**
6. See the response below!

## 📋 What You Should See:

```
┌─────────────────────────────────────────────┐
│ Tuma-Africa API Documentation                │
├─────────────────────────────────────────────┤
│                                              │
│ Authentication ▼                            │
│   POST /auth/register                       │
│   POST /auth/login                          │
│   POST /auth/refresh                        │
│   POST /auth/logout                         │
│   GET  /auth/me                             │
│   POST /auth/forgot-password                │
│   POST /auth/reset-password                 │
│                                              │
│ Products                                    │
│ Orders                                      │
│ Users                                       │
│ Chat                                        │
│ Notifications                               │
│ Admin                                       │
│ Upload                                      │
│ Public                                      │
└─────────────────────────────────────────────┘
```

## 🔍 Verification Commands:

After starting your server, you can verify everything is working:

```bash
# Test 1: Check if server is running
curl http://localhost:5001/api/health

# Test 2: Verify Swagger endpoints
node test-swagger.js

# Test 3: Check Swagger UI accessibility
node verify-swagger-ui.js
```

## ❌ Common Mistakes:

1. **Server not running** - Most common issue!
   - Solution: Run `npm run server`

2. **Wrong URL** - Using wrong port or path
   - Correct: `http://localhost:5001/api-docs`
   - Wrong: `http://localhost:5001/api-docs/` (trailing slash)
   - Wrong: `http://localhost:3000/api-docs` (wrong port)

3. **Browser cache** - Old version cached
   - Solution: Hard refresh (Ctrl+F5 or Cmd+Shift+R)

4. **Port already in use** - Another process using port 5001
   - Solution: Kill the process or change PORT in .env

## 🎯 Quick Checklist:

- [ ] Server is running (`npm run server`)
- [ ] MongoDB is connected (check server logs)
- [ ] Browser is open to `http://localhost:5001/api-docs`
- [ ] Authentication section is visible in left sidebar
- [ ] Can click on endpoints to see details
- [ ] "Try it out" button works

## 🚀 All Your Endpoints Are Ready!

Your Swagger documentation includes:

- ✅ **7 Authentication endpoints**
- ✅ **5+ Product endpoints**
- ✅ **5+ Order endpoints**
- ✅ **User management endpoints**
- ✅ **Chat endpoints**
- ✅ **Notification endpoints**
- ✅ **Admin endpoints**
- ✅ **Upload endpoints**
- ✅ **Public endpoints**

**Total: 22 API endpoints fully documented!**

## Need Help?

If you still don't see anything after starting the server:

1. Check server logs for errors
2. Verify MongoDB is running
3. Check browser console (F12) for errors
4. Try a different browser
5. Run `node verify-swagger-ui.js` to test

---

**Remember: Start your server first, then open Swagger UI!** 🎉

