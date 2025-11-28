# 🔧 Quick Fix: Email Not Sending

## The Problem

Your `.env` file has placeholder values:
- `EMAIL_USER=your-email@gmail.com` ❌ (placeholder)
- `EMAIL_PASS=your-app-password` ❌ (placeholder)

## Quick Fix Steps

### 1. Update Your .env File

Edit `/home/kmbruce/inn/.env` and replace the placeholder values:

```env
# Change this:
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# To this (with your real values):
EMAIL_USER=youractualemail@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Important:** 
- Use your real Gmail address
- Use a Gmail App Password (16 characters, no spaces)
- NOT your regular Gmail password

### 2. Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" → "Other" → Name it "Tuma-Africa"
3. Click "Generate"
4. Copy the 16-character password
5. Paste it in your .env file (remove spaces)

### 3. Restart Server

After updating .env, restart your backend server:

```bash
# Stop server (Ctrl+C)
# Then restart:
cd /home/kmbruce/inn
npm run server
```

### 4. Test Email

Test if email works:

```bash
cd /home/kmbruce/inn/backend
node scripts/testEmail.js
```

### 5. Try Registration Again

Register a new user and check your Gmail inbox (and spam folder).

## Current Status

Your email service is looking for:
- ✅ `EMAIL_USER` - Found but using placeholder
- ✅ `EMAIL_PASS` - Found but using placeholder

**Action Required:** Replace placeholder values with real Gmail credentials.

## Alternative: Check Console Logs

If you can't set up email right now, when you register:
1. Check your backend console
2. Look for: `📧 Verification token: ...`
3. Use that token to verify manually at: `http://localhost:3000/verify-email?token=YOUR_TOKEN`

