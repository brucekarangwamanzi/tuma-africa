# How to See Login Parameters in Swagger UI

## The login endpoint DOES have parameters!

The login endpoint (`POST /auth/login`) requires two parameters:
- `email` (string, required)
- `password` (string, required)

## How to See Them in Swagger UI:

### Step 1: Open Swagger UI
Navigate to: `http://localhost:5001/api-docs`

### Step 2: Find the Login Endpoint
1. Look for the **Authentication** section
2. Find **POST /auth/login**
3. Click on it to expand

### Step 3: Click "Try it out" Button
- You'll see a green **"Try it out"** button
- Click it to enable editing

### Step 4: See the Request Body
After clicking "Try it out", you'll see:
```
Request body
{
  "email": "string",
  "password": "string"
}
```

You can then:
- Edit the JSON directly
- Or use the example values provided

### Step 5: Fill in Your Credentials
Replace the example values:
```json
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

### Step 6: Execute
Click the **"Execute"** button to test the login

## Visual Guide:

```
┌─────────────────────────────────────────┐
│ POST /auth/login                        │
│ Login user                              │
├─────────────────────────────────────────┤
│ [Try it out]  ← Click this button!     │
├─────────────────────────────────────────┤
│ Request body                            │
│ {                                       │
│   "email": "string",    ← Edit this    │
│   "password": "string"  ← Edit this    │
│ }                                       │
├─────────────────────────────────────────┤
│ [Execute]  ← Then click this           │
└─────────────────────────────────────────┘
```

## Why You Might Not See Parameters:

1. **Haven't clicked "Try it out"** - This is the most common reason!
   - Solution: Click the green "Try it out" button

2. **Endpoint is collapsed** - The section might be minimized
   - Solution: Click on the endpoint name to expand it

3. **Looking at wrong endpoint** - Make sure you're on `/auth/login`
   - Solution: Scroll to Authentication section, find POST /auth/login

4. **Browser cache** - Old version might be cached
   - Solution: Hard refresh (Ctrl+F5 or Cmd+Shift+R)

## Example Request:

```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

## Expected Response:

```json
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "fullName": "John Doe",
    "email": "admin@example.com",
    "role": "admin"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Still Not Working?

1. **Restart your server** to reload Swagger:
   ```bash
   npm run server
   ```

2. **Check the console** for any errors

3. **Verify the endpoint** is accessible at:
   ```
   http://localhost:5001/api-docs
   ```

The parameters ARE there - you just need to click "Try it out" to see and edit them! 🚀

