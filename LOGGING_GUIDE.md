# 📊 Logging Guide - Backend & Frontend

## ✅ Enhanced Logging Now Active

Both backend and frontend now have comprehensive logging to help you debug and monitor your application.

---

## 🔧 Backend Logging

### What You'll See:

#### 1. **Server Startup Logs:**
```
============================================================
🚀 BACKEND SERVER STARTED
============================================================
📡 Server running on 0.0.0.0:5001
🌐 Local access: http://localhost:5001
🌐 Network access: http://192.168.0.246:5001
📚 Swagger API Docs: http://localhost:5001/api-docs
❤️  Health Check: http://localhost:5001/api/health
============================================================
📋 Available Endpoints:
   - POST /api/auth/login
   - POST /api/auth/register
   - GET  /api/products
   - POST /api/products (Super Admin)
   - GET  /api/orders
   - POST /api/orders
   - ... and more
============================================================
```

#### 2. **Database Connection:**
```
✅ MongoDB connected successfully
📊 Database: Local (mongodb://localhost:27017/tuma-africa-cargo)
```

#### 3. **Request Logs:**
```
[2025-12-02T18:40:00.000Z] GET /api/products - IP: ::1
[2025-12-02T18:40:00.000Z] ✅ GET /api/products - Status: 200

[2025-12-02T18:40:05.000Z] POST /api/products - IP: ::1
[2025-12-02T18:40:05.000Z] Request Body: {
  "name": "Test Product",
  "price": 99.99,
  ...
}
[2025-12-02T18:40:05.000Z] ✅ POST /api/products - Status: 201
```

#### 4. **Error Logs:**
```
[2025-12-02T18:40:10.000Z] POST /api/products - IP: ::1
[2025-12-02T18:40:10.000Z] ⚠️ POST /api/products - Status: 400
```

#### 5. **Socket.IO Logs:**
```
✅ Socket.IO initialized successfully
✅ User connected: Super Admin (super_admin) - Socket ID: xxx
Admin Super Admin joined admins room
📨 Message from Super Admin: Hello...
```

---

## 🎨 Frontend Logging

### What You'll See:

#### 1. **App Startup:**
```
============================================================
🎨 FRONTEND STARTING
============================================================
🌐 Frontend URL: http://localhost:3000
🔗 Backend API: /api
📦 Environment: Development
============================================================
```

#### 2. **API Request Logs:**
```
📤 API Request: GET /products
✅ API Response: GET /products - Status: 200

📤 API Request: POST /products
📦 Request Data: { name: "Test Product", ... }
✅ API Response: POST /products - Status: 201
```

#### 3. **API Error Logs:**
```
📤 API Request: POST /products
❌ API Error: POST /products - Status: 403
📋 Error Details: { message: "Access denied..." }
```

#### 4. **Authentication Logs:**
```
✅ Authentication verified - user logged in
✅ WebSocket connected
```

---

## 📋 Log Categories

### Backend Logs:

| Type | Emoji | Description |
|------|-------|-------------|
| Request | `[timestamp]` | All incoming requests |
| Success | ✅ | Successful responses (200-299) |
| Warning | ⚠️ | Client errors (400-499) |
| Error | ❌ | Server errors (500+) |
| Info | ℹ️ | Other responses |
| Database | 📊 | MongoDB operations |
| Socket | 📨 | WebSocket events |

### Frontend Logs:

| Type | Emoji | Description |
|------|-------|-------------|
| Request | 📤 | Outgoing API requests |
| Response | ✅ | Successful API responses |
| Error | ❌ | Failed API requests |
| Data | 📦 | Request/response data |
| Auth | 🔑 | Authentication events |
| WebSocket | 🔌 | Socket.IO events |

---

## 🔍 What Gets Logged

### Backend Logs:
- ✅ All HTTP requests (method, URL, IP)
- ✅ Request bodies (sensitive data hidden)
- ✅ Response status codes
- ✅ Database connections
- ✅ Socket.IO connections
- ✅ Errors with stack traces

### Frontend Logs:
- ✅ API requests (method, URL)
- ✅ Request data (for POST/PUT)
- ✅ Response status codes
- ✅ Error details
- ✅ Authentication state
- ✅ WebSocket connections

---

## 🔒 Security: Sensitive Data Protection

The logging system automatically hides sensitive information:

**Hidden Fields:**
- `password` → `***`
- `passwordHash` → `***`
- `refreshToken` → `***`
- `accessToken` → `***`

**Example:**
```javascript
// Request body logged:
{
  "email": "user@example.com",
  "password": "***",  // Hidden!
  "fullName": "John Doe"
}
```

---

## 🎯 How to Use Logs

### Debugging API Issues:

1. **Check Backend Logs:**
   - See if request reached backend
   - Check request body
   - See response status

2. **Check Frontend Logs:**
   - See if request was sent
   - Check request data
   - See error response

### Example Debugging Flow:

**Problem:** Product creation fails

**Backend Logs:**
```
[timestamp] POST /api/products - IP: ::1
[timestamp] Request Body: { name: "Test", price: 99.99 }
[timestamp] ⚠️ POST /api/products - Status: 403
```
→ Shows: Access denied (403)

**Frontend Logs:**
```
📤 API Request: POST /products
📦 Request Data: { name: "Test", price: 99.99 }
❌ API Error: POST /products - Status: 403
📋 Error Details: { message: "Access denied. Super Admin role required." }
```
→ Shows: User doesn't have Super Admin role

---

## 🚀 Running with Logs

### Terminal 1 - Backend:
```bash
npm run backend
```
**You'll see:**
- Server startup info
- All API requests
- Database connections
- Socket.IO events
- Errors

### Terminal 2 - Frontend:
```bash
npm run frontend
```
**You'll see:**
- App startup info
- All API requests
- API responses
- Errors
- Authentication events

---

## 📊 Log Format

### Backend Request Log:
```
[2025-12-02T18:40:00.000Z] GET /api/products - IP: ::1
[2025-12-02T18:40:00.000Z] ✅ GET /api/products - Status: 200
```

### Frontend API Log:
```
📤 API Request: GET /products
✅ API Response: GET /products - Status: 200
```

---

## 🎨 Log Colors (Terminal)

Most terminals will show:
- ✅ Green for success
- ⚠️ Yellow for warnings
- ❌ Red for errors
- ℹ️ Blue for info

---

## 💡 Tips

1. **Watch Both Terminals**: Backend and frontend logs together tell the full story
2. **Check Timestamps**: Match logs by timestamp to trace requests
3. **Look for Emojis**: Quick visual indicators of log type
4. **Filter Logs**: Use terminal search (Ctrl+F) to find specific requests
5. **Error Stack Traces**: Always check full error messages in logs

---

## 🔍 Example: Complete Request Flow

### Creating a Product:

**Frontend Log:**
```
📤 API Request: POST /products
📦 Request Data: { name: "Test", price: 99.99, ... }
```

**Backend Log:**
```
[timestamp] POST /api/products - IP: ::1
[timestamp] Request Body: { name: "Test", price: 99.99, ... }
[timestamp] ✅ POST /api/products - Status: 201
```

**Frontend Log:**
```
✅ API Response: POST /products - Status: 201
```

---

Now you have comprehensive logging in both backend and frontend! 🎉

