import { Resend } from "resend";

// API key should be properly loaded
const resend = new Resend("re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA");

async function testEmail() {
  try {
    console.log("Sending test email...");
    const response = await resend.emails.send({
      from: "ServeTracker <no-reply@justlegalsolutions.tech>",
      to: ["iannazzi.joseph@gmail.com"], // Your email address
      subject: "Test Email from ServeTracker",
      html: "<h1>This is a test email</h1><p>Sent at: " + new Date().toLocaleString() + "</p>",
    });
    console.log("Resend API response:", response);

    if (response && response.data && response.data.id) {
      console.log("✅ Email sent successfully with ID:", response.data.id);
    } else {
      console.error("❌ Failed to send email. Unexpected response structure:", response);
    }
  } catch (error) {
    console.error("❌ Error sending email via Resend:", error);
    if (error.response) {
      console.error("Error details:", error.response);
    }
  }
}

// Execute the test function
testEmail().then(() => {
  console.log("Test complete");
}).catch(err => {
  console.error("Test failed with error:", err);
});

// Instructions on how to run this test script
console.log("\nRun this script using Node.js:");
console.log("  npm install resend");
console.log("  node test-resend.js");
