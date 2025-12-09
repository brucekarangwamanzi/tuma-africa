# 📧 Email Verification Setup Guide

## Gmail Configuration

To send verification emails, you need to configure Gmail SMTP:

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Tuma-Africa Cargo" as the name
4. Click "Generate"
5. Copy the 16-character password (you'll use this in .env)

### Step 3: Configure Environment Variables

Create or update your `.env` file in the backend directory:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
EMAIL_FROM_NAME=Tuma-Africa Link Cargo

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
# Or for production:
# FRONTEND_URL=https://yourdomain.com
```

### Step 4: Test Email Sending

After setting up, restart your backend server and try registering a new user. You should receive a verification email.

## Email Verification Flow

1. **User Registers** → Verification email is automatically sent
2. **User Clicks Link** → Email is verified
3. **User Can Login** → Full access to platform features

## Resend Verification Email

If a user didn't receive the email, they can:
- Go to their profile page
- Click "Resend Verification Email"
- Or use the API endpoint: `POST /api/users/verify-email`

## Troubleshooting

### Email Not Sending?
- Check that `EMAIL_USER` and `EMAIL_APP_PASSWORD` are set correctly
- Verify you're using an App Password, not your regular Gmail password
- Check server logs for email errors
- Make sure 2FA is enabled on your Gmail account

### Email Goes to Spam?
- This is normal for new email senders
- Users should check their spam folder
- Consider using a professional email service (SendGrid, Mailgun) for production

### Token Expired?
- Verification tokens expire after 24 hours
- User can request a new verification email
- Or register again with the same email

## Production Recommendations

For production, consider using:
- **SendGrid** - Professional email service
- **Mailgun** - Reliable email API
- **AWS SES** - Amazon's email service
- **Postmark** - Transactional email service

These services provide better deliverability and don't require Gmail App Passwords.

