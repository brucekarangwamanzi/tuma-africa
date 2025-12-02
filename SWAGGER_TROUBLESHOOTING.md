# Swagger UI Troubleshooting Guide

## ✅ Verification Complete

Your Swagger configuration is **CORRECT**! All 7 authentication endpoints are properly documented:
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- GET /auth/me
- POST /auth/forgot-password
- POST /auth/reset-password

## If You're Not Seeing Anything in Swagger UI:

### Step 1: Make Sure Server is Running

```bash
# Start the server
npm run server

# Or
node backend/server.js
```

You should see:
```
Server running on 0.0.0.0:5001
MongoDB connected successfully
```

### Step 2: Access Swagger UI

Open your browser and go to:
```
http://localhost:5001/api-docs
```

**NOT** `http://localhost:5001/api-docs/` (no trailing slash)

### Step 3: Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for any errors
4. Check Network tab for failed requests

### Step 4: Clear Browser Cache

- **Chrome/Edge**: Ctrl+Shift+Delete or Cmd+Shift+Delete
- **Firefox**: Ctrl+Shift+Delete or Cmd+Shift+Delete
- Or do a Hard Refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

### Step 5: Verify Swagger is Loading

You should see:
- A page titled "Tuma-Africa API Documentation"
- Left sidebar with sections like:
  - Authentication
  - Users
  - Products
  - Orders
  - etc.

### Step 6: Expand Authentication Section

1. Look for **"Authentication"** in the left sidebar
2. Click on it to expand
3. You should see all 7 endpoints listed

### Step 7: Click on an Endpoint

1. Click on **POST /auth/login**
2. The endpoint should expand showing:
   - Summary
   - Description
   - Request body
   - Responses

### Step 8: Click "Try it out"

1. Click the green **"Try it out"** button
2. You'll see the request body with `email` and `password` fields
3. Fill them in and click "Execute"

## Common Issues:

### Issue 1: Blank Page
**Solution:**
- Check if server is running
- Check browser console for errors
- Try a different browser
- Check if port 5001 is already in use

### Issue 2: "Cannot GET /api-docs"
**Solution:**
- Make sure server is running
- Check the route is `/api-docs` (not `/api-docs/`)
- Verify Swagger is mounted in server.js

### Issue 3: Authentication Section is Empty
**Solution:**
- Hard refresh the page (Ctrl+F5)
- Clear browser cache
- Restart the server
- Check if routes are being loaded

### Issue 4: Endpoints Show But No Details
**Solution:**
- Click on the endpoint name to expand it
- Click "Try it out" to see request body
- Check browser console for JavaScript errors

### Issue 5: CORS Errors
**Solution:**
- Swagger UI should work on localhost
- If accessing from different domain, check CORS settings
- Make sure server allows requests from your origin

## Quick Test:

Run this command to verify Swagger is working:
```bash
node test-swagger.js
```

This will show you all available endpoints.

## Manual Verification:

1. **Check server is running:**
   ```bash
   curl http://localhost:5001/api/health
   ```

2. **Check Swagger JSON:**
   ```bash
   curl http://localhost:5001/api-docs/swagger.json
   ```
   This should return a JSON object with all your API definitions.

3. **Check Swagger UI HTML:**
   ```bash
   curl http://localhost:5001/api-docs/
   ```
   This should return HTML for Swagger UI.

## Still Not Working?

1. **Check server logs** for any errors
2. **Verify dependencies** are installed:
   ```bash
   npm list swagger-jsdoc swagger-ui-express
   ```

3. **Reinstall dependencies** if needed:
   ```bash
   npm install swagger-jsdoc swagger-ui-express
   ```

4. **Check file paths** in swagger.js:
   - Routes should be in `./backend/routes/*.js`
   - Config should be in `./backend/config/swagger.js`

## Expected View:

When Swagger UI loads correctly, you should see:

```
┌─────────────────────────────────────┐
│ Tuma-Africa API Documentation       │
├─────────────────────────────────────┤
│ [Authorize] [Filter]                │
├─────────────────────────────────────┤
│ Authentication ▼                    │
│   POST /auth/register               │
│   POST /auth/login                  │
│   POST /auth/refresh                │
│   POST /auth/logout                 │
│   GET  /auth/me                     │
│   POST /auth/forgot-password        │
│   POST /auth/reset-password         │
│ Products                            │
│ Orders                              │
│ ...                                 │
└─────────────────────────────────────┘
```

## Need Help?

If you're still having issues:
1. Share a screenshot of what you see
2. Share browser console errors
3. Share server logs
4. Verify you're accessing the correct URL

Your Swagger setup is correct - the issue is likely with server access or browser cache! 🚀

