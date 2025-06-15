const nodemailer = require('nodemailer');

/*
  'req' variable has:
    'headers' - object with request headers
    'payload' - request body data as a string
    'variables' - object with function variables

  'res' variable has:
    'send(text, status)' - function to return text response. Status code defaults to 200
    'json(obj, status)' - function to return JSON response. Status code defaults to 200
  
  If an error is thrown, a response with code 500 will be returned.
*/

module.exports = async function(req, res) {
  try {
    // Parse the incoming JSON payload
    const { to, subject, html, imageData } = JSON.parse(req.payload || '{}');
    if (!to || !subject || !html) {
      return res.json({ success: false, message: 'Missing required fields' }, 400);
    }

    // Create Nodemailer transporter from env vars
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Ensure recipients list includes the business email
    const recipients = Array.isArray(to) ? [...to] : [to];
    const businessEmail = 'info@justlegalsolutions.org';
    if (!recipients.some(email => email.toLowerCase() === businessEmail.toLowerCase())) {
      recipients.push(businessEmail);
    }

    console.log(`Final recipients list: ${recipients.join(', ')}`);

    // Prepare attachments if Base64 image is provided
    const attachments = [];
    if (imageData) {
      let base64Content = imageData;
      if (imageData.includes('base64,')) {
        base64Content = imageData.split('base64,')[1];
      }
      
      attachments.push({
        filename: 'serve_evidence.jpg',
        content: base64Content,
        encoding: 'base64'
      });
      console.log('Image successfully attached to email');
    }

    // Send email with all recipients
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to: recipients,
      subject,
      html,
      attachments
    });

    console.log(`Email sent successfully to: ${recipients.join(', ')}`);
    return res.json({ 
      success: true, 
      message: 'Email sent', 
      messageId: info.messageId,
      recipients: recipients 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.json({ success: false, message: error.message }, 500);
  }
};
// Ensure no database operations (like deletion) are performed here
