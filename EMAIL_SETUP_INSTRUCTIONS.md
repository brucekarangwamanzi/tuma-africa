# 📧 Email Verification Setup - Step by Step

## Problem: Emails Not Being Sent

The email service is not configured. Here's how to fix it:

## Step 1: Get Gmail App Password

1. **Go to your Google Account**: https://myaccount.google.com/
2. **Enable 2-Factor Authentication** (if not already enabled):
   - Go to Security → 2-Step Verification
   - Follow the setup process

3. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Or: Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter name: "Tuma-Africa Cargo"
   - Click "Generate"
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

## Step 2: Add to .env File

Open your `.env` file in the root directory (`/home/kmbruce/inn/.env`) and add:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
EMAIL_FROM_NAME=Tuma-Africa Link Cargo

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with the 16-character app password (remove spaces)
- The app password is NOT your regular Gmail password

## Step 3: Test Email Sending

After adding the credentials, test the email service:

```bash
cd /home/kmbruce/inn/backend
node scripts/testEmail.js
```

This will:
- Check if credentials are configured
- Send a test email to your Gmail address
- Show any errors if something is wrong

## Step 4: Restart Your Server

After adding the email credentials, restart your backend server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd /home/kmbruce/inn
npm run server
```

## Step 5: Try Registration Again

1. Register a new user (or use existing account)
2. Check your Gmail inbox
3. **Also check your Spam/Junk folder** - verification emails sometimes go there initially

## Troubleshooting

### Still Not Receiving Emails?

1. **Check Server Logs**:
   - Look for email-related messages in your backend console
   - Should see: `✅ Verification email sent successfully!`

2. **Check Spam Folder**:
   - Gmail may mark first emails as spam
   - Mark as "Not Spam" if found there

3. **Verify App Password**:
   - Make sure you're using App Password, not regular password
   - App passwords are 16 characters (no spaces when using)

4. **Check Gmail Security**:
   - Some Gmail accounts have "Less secure app access" disabled
   - App Passwords should work regardless, but check your account settings

5. **Test Email Script**:
   ```bash
   cd /home/kmbruce/inn/backend
   node scripts/testEmail.js
   ```
   This will show detailed error messages

### Common Errors

**"EAUTH" Error**:
- Wrong email or app password
- Make sure you copied the app password correctly (no spaces)

**"ECONNECTION" Error**:
- Internet connection issue
- Gmail server temporarily unavailable

**"Email service not configured"**:
- .env file not loaded
- Variables not set correctly
- Restart server after adding variables

## Quick Test

After setup, you can test by:
1. Registering a new user
2. Or clicking "Resend Verification Email" in your profile
3. Check both inbox and spam folder

## Alternative: Use Development Mode

If you can't set up Gmail right now, the system will:
- Still create verification tokens
- Log the token in the console
- Show the verification URL in development mode
- You can manually verify using the token

Check your backend console logs when registering - you'll see the verification token and URL.

