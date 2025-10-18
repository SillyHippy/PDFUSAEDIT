const nodemailer = require('nodemailer');
require('dotenv').config();

async function testSmtpConnection() {
  try {
    console.log("Testing SMTP connection configuration...");
    
    // Create transporter with your SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'your-app-password',
      }
    });
    
    // Verify connection configuration
    await transporter.verify();
    console.log("SMTP connection verified successfully!");
    
    return {
      success: true,
      message: "SMTP connection successful",
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER
      }
    };
  } catch (error) {
    console.error("SMTP connection error:", error);
    return {
      success: false,
      message: error.message
    };
  }
}

// Run the test
testSmtpConnection()
  .then(result => console.log("Test result:", JSON.stringify(result, null, 2)))
  .catch(err => console.error("Test execution error:", err));
