const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  // Check if email credentials are configured
  // Support both EMAIL_APP_PASSWORD and EMAIL_PASS for compatibility
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPassword) {
    console.warn('⚠️ Email credentials not configured. Email sending will be disabled.');
    console.warn('⚠️ Please set EMAIL_USER and EMAIL_APP_PASSWORD (or EMAIL_PASS) in your .env file');
    console.warn(`⚠️ Current EMAIL_USER: ${emailUser ? 'Set' : 'Not set'}`);
    console.warn(`⚠️ Current EMAIL_APP_PASSWORD/EMAIL_PASS: ${emailPassword ? 'Set' : 'Not set'}`);
    return null;
  }

  // Check if using placeholder values
  if (emailUser === 'your-email@gmail.com' || emailPassword === 'your-app-password') {
    console.warn('⚠️ Email credentials are using placeholder values. Please update with real values.');
    return null;
  }

  // Use Gmail SMTP
  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser, // Your Gmail address
        pass: emailPassword // Gmail App Password (not regular password)
      }
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    return null;
  }
};

/**
 * Send email verification email
 */
async function sendVerificationEmail(userEmail, verificationToken, userName) {
  try {
    console.log(`📧 Attempting to send verification email to: ${userEmail}`);
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
    console.log(`📧 Email user configured: ${emailUser ? 'Yes (' + emailUser + ')' : 'No'}`);
    console.log(`📧 Email password configured: ${emailPassword ? 'Yes' : 'No'}`);
    
    // Check for placeholder values
    if (emailUser === 'your-email@gmail.com' || emailPassword === 'your-app-password') {
      console.warn('⚠️ Email credentials are using placeholder values!');
    }
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn(`⚠️ Email not configured. Verification link for ${userEmail}: ${verificationToken}`);
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
      console.warn(`⚠️ Manual verification URL: ${verificationUrl}`);
      
      // In development, return success but log the token
      if (process.env.NODE_ENV === 'development') {
        return { 
          success: true, 
          messageId: 'dev-mode',
          debug: `Verification token: ${verificationToken} (Email not configured)`,
          verificationUrl: verificationUrl
        };
      }
      return { success: false, error: 'Email service not configured' };
    }
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    console.log(`📧 Verification URL: ${verificationUrl}`);
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Tuma-Africa Link Cargo'}" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Verify Your Email Address - Tuma-Africa Link Cargo',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to Tuma-Africa Link Cargo!</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${userName || 'there'},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for registering with Tuma-Africa Link Cargo! To complete your registration and start using our services, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
              ${verificationUrl}
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Tuma-Africa Link Cargo. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Tuma-Africa Link Cargo!
        
        Hello ${userName || 'there'},
        
        Thank you for registering with Tuma-Africa Link Cargo! To complete your registration, please verify your email address by clicking the link below:
        
        ${verificationUrl}
        
        This verification link will expire in 24 hours. If you didn't create an account with us, please ignore this email.
        
        © ${new Date().getFullYear()} Tuma-Africa Link Cargo. All rights reserved.
      `
    };

    console.log(`📧 Sending email from: ${mailOptions.from}`);
    console.log(`📧 Sending email to: ${mailOptions.to}`);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully!');
    console.log(`✅ Message ID: ${info.messageId}`);
    console.log(`✅ Response: ${info.response}`);
    return { success: true, messageId: info.messageId, response: info.response };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your EMAIL_USER and EMAIL_APP_PASSWORD in .env file.';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to email server. Please check your internet connection.';
    }
    
    return { success: false, error: errorMessage, details: error };
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(userEmail, resetToken, userName) {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn(`⚠️ Email not configured. Reset token for ${userEmail}: ${resetToken}`);
      // In development, return success but log the token
      if (process.env.NODE_ENV === 'development') {
        return { 
          success: true, 
          messageId: 'dev-mode',
          debug: `Reset token: ${resetToken} (Email not configured)`
        };
      }
      return { success: false, error: 'Email service not configured' };
    }
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Tuma-Africa Link Cargo'}" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Reset Your Password - Tuma-Africa Link Cargo',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${userName || 'there'},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 4px;">
              ${resetUrl}
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
              This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
              © ${new Date().getFullYear()} Tuma-Africa Link Cargo. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};

