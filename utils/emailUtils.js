/**
 * This utility file provides a helper function to create an email transport
 * that works for both development and production environments.
 */

const nodemailer = require('nodemailer');

/**
 * Creates an email transporter that either uses Gmail or Ethereal for testing
 * @returns {Promise<object>} A configured nodemailer transport
 */
async function createTransporter() {
  // Check if we're in development mode and want to use ethereal for testing
  if (process.env.NODE_ENV === 'development' && process.env.USE_ETHEREAL === 'true') {
    try {
      // Create a test account with ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      
      // Log the credentials for debugging
      console.log('Ethereal email test account created:');
      console.log(`- Email: ${testAccount.user}`);
      console.log(`- Password: ${testAccount.pass}`);
      
      // Create a transporter using ethereal.email
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (error) {
      console.error('Failed to create Ethereal test account:', error);
      console.log('Falling back to Gmail transport');
    }
  }
  
  // For production or fallback, use real Gmail account
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
}

/**
 * Sends an email using the configured transport
 * @param {Object} emailOptions - Email sending options
 * @returns {Promise<Object>} Information about the sent message
 */
async function sendEmail(emailOptions) {
  try {
    // Get a fresh transporter
    const transporter = await createTransporter();
    
    // Send the email
    const info = await transporter.sendMail(emailOptions);
    
    // Log success info
    if (process.env.NODE_ENV === 'development' && process.env.USE_ETHEREAL === 'true') {
      console.log('Email sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } else {
      console.log('Email sent successfully to:', emailOptions.to);
    }
    
    return { success: true, info };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // For development, allow continuing without email if configured
    if (process.env.NODE_ENV === 'development' && process.env.ALLOW_FAILED_EMAILS === 'true') {
      console.log('Continuing despite email failure (development mode)');
      return { success: false, error, allowContinue: true };
    }
    
    return { success: false, error, allowContinue: false };
  }
}

module.exports = {
  createTransporter,
  sendEmail
};
