# 📧 Setup Email Verification - URGENT

## Current Problem

Your `.env` file has **placeholder values** instead of real Gmail credentials:
- `EMAIL_USER=your-email@gmail.com` ❌ (needs your real email)
- `EMAIL_PASS=your-app-password` ❌ (needs real app password)

## Quick Setup (5 minutes)

### Step 1: Get Gmail App Password

1. **Open**: https://myaccount.google.com/apppasswords
2. **If prompted**, sign in to your Google account
3. **Select**:
   - App: "Mail"
   - Device: "Other (Custom name)"
   - Name: "Tuma-Africa Cargo"
4. **Click "Generate"**
5. **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)
   - Remove spaces when using it

### Step 2: Update .env File

Edit `/home/kmbruce/inn/.env`:

Find these lines:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

Replace with your real values:
```env
EMAIL_USER=youractualemail@gmail.com
EMAIL_PASS=abcdefghijklmnop
```

**Example:**
```env
EMAIL_USER=john.doe@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

**Important:** 
- Use your real Gmail address
- Use the 16-character app password (remove spaces)
- Save the file

### Step 3: Restart Server

```bash
# Stop current server (Ctrl+C in terminal running server)
# Then restart:
cd /home/kmbruce/inn
npm run server
```

### Step 4: Test Email

```bash
cd /home/kmbruce/inn/backend
node scripts/testEmail.js
```

You should see:
```
✅ Test email sent successfully!
```

### Step 5: Check Your Email

1. Open your Gmail inbox
2. **Also check Spam/Junk folder** (first emails often go there)
3. Look for: "Verify Your Email Address - Tuma-Africa Link Cargo"

## If You Still Don't Receive Emails

1. **Check server logs** - Look for email sending messages
2. **Check spam folder** - Gmail may mark it as spam initially
3. **Verify app password** - Make sure you're using App Password, not regular password
4. **Test script** - Run `node scripts/testEmail.js` to see detailed errors

## Temporary Workaround

If you can't set up email right now:

1. Register a user
2. Check your **backend console** for a message like:
   ```
   📧 Verification token: abc123...
   📧 Manual verification URL: http://localhost:3000/verify-email?token=abc123...
   ```
3. Copy that URL and open it in your browser to verify manually

## Need Help?

Check the detailed guide: `EMAIL_SETUP_INSTRUCTIONS.md`

