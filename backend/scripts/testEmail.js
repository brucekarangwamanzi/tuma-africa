const { sendVerificationEmail } = require('../utils/emailService');
const path = require('path');

// Load .env from root directory (one level up from backend)
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function testEmail() {
  console.log('🧪 Testing email service...\n');
  
  // Check configuration
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS;
  
  console.log('Configuration check:');
  console.log('EMAIL_USER:', emailUser ? `✅ Set (${emailUser})` : '❌ Not set');
  console.log('EMAIL_APP_PASSWORD/EMAIL_PASS:', emailPassword ? '✅ Set' : '❌ Not set');
  console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:3000');
  console.log('');
  
  if (!emailUser || !emailPassword) {
    console.error('❌ Email credentials not configured!');
    console.error('Please set EMAIL_USER and EMAIL_APP_PASSWORD (or EMAIL_PASS) in your .env file');
    process.exit(1);
  }
  
  // Check for placeholder values
  if (emailUser === 'your-email@gmail.com' || emailPassword === 'your-app-password') {
    console.error('❌ Email credentials are using placeholder values!');
    console.error('Please replace with your actual Gmail address and App Password');
    console.error('');
    console.error('To get App Password:');
    console.error('1. Go to: https://myaccount.google.com/apppasswords');
    console.error('2. Generate a new app password for "Mail"');
    console.error('3. Copy the 16-character password');
    console.error('4. Update your .env file');
    process.exit(1);
  }
  
  // Test sending email
  const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
  const testToken = 'test-verification-token-12345';
  const testName = 'Test User';
  
  console.log(`📧 Sending test email to: ${testEmail}`);
  console.log('');
  
  const result = await sendVerificationEmail(testEmail, testToken, testName);
  
  if (result.success) {
    console.log('');
    console.log('✅ Test email sent successfully!');
    console.log(`✅ Message ID: ${result.messageId}`);
    if (result.response) {
      console.log(`✅ Server response: ${result.response}`);
    }
    console.log('');
    console.log('Please check your inbox (and spam folder) for the verification email.');
  } else {
    console.log('');
    console.error('❌ Failed to send test email');
    console.error(`Error: ${result.error}`);
    if (result.details) {
      console.error('Details:', result.details);
    }
  }
}

testEmail().catch(console.error);

