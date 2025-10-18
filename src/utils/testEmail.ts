
import { sendEmail } from './email';

/**
 * Utility function to test email sending functionality
 */
export const testEmailFunctionality = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log("Running messaging functionality test...");
    
    const businessEmail = "info@justlegalsolutions.org";
    const testSubject = "ServeTracker Message Test - " + new Date().toLocaleString();
    const testBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Message Test</title>
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">ServeTracker Messaging Test</h1>
          <p>This is a test message from the ServeTracker application.</p>
          <p>If you received this message, your messaging functionality is working correctly!</p>
          <p><strong>Time sent:</strong> ${new Date().toLocaleString()}</p>
          <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
            This is an automated test message from ServeTracker.
          </div>
        </div>
      </body>
      </html>
    `;
    
    console.log(`Sending test message to: ${businessEmail}`);
    
    const result = await sendEmail({
      to: businessEmail,
      subject: testSubject,
      body: testBody,
      html: testBody
    });
    
    console.log("Test message result:", result);
    return result;
  } catch (error) {
    console.error("Error in test message function:", error);
    return { 
      success: false, 
      message: `Test failed with error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
