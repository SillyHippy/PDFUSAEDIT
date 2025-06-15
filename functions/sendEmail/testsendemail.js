const { Client, Functions } = require("node-appwrite");
require("dotenv").config();

async function testSendEmail() {
  try {
    console.log("Testing email sending via Appwrite function...");

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const functions = new Functions(client);

    const emailData = {
      to: "info@justlegalsolutions.org",
      subject: "Test Email from ServeTracker",
      html: "<h1>Test Email</h1><p>This is a test email sent using the Appwrite function.</p>",
    };

    const response = await functions.createExecution(
      "67ed8899003a8b119a18", // Correct function ID
      JSON.stringify(emailData)
    );
    console.log("Email function response:", response);
  } catch (error) {
    console.error("Error sending email via Appwrite function:", error);
  }
}

// Run test
testSendEmail()
  .then(() => console.log("Test completed"))
  .catch((err) => console.error("Test failed:", err));
