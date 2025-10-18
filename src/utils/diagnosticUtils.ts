/**
 * Utility functions for diagnosing and fixing issues in the application
 */
import { appwrite } from "@/lib/appwrite";

/**
 * Function to check email sending functionality by trying multiple methods
 */
export const diagnosticEmailTest = async (recipientEmail: string): Promise<{ 
  success: boolean; 
  results: Array<{ method: string; success: boolean; message: string }>;
}> => {
  const results: Array<{ method: string; success: boolean; message: string }> = [];
  let overallSuccess = false;
  
  const testSubject = "ServeTracker Email Diagnostic - " + new Date().toLocaleString();
  const testBody = `
    <h1>ServeTracker Email Diagnostic Test</h1>
    <p>This is a test email to diagnose email delivery issues.</p>
    <p>Time: ${new Date().toLocaleString()}</p>
    <p>If you receive this, please reply to confirm.</p>
  `;

  // Method 1: Direct Resend API
  try {
    console.log("Diagnostic: Trying direct Resend API...");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA`
      },
      body: JSON.stringify({
        from: "ServeTracker <no-reply@justlegalsolutions.tech>",
        to: [recipientEmail],
        subject: testSubject + " (Method 1: Direct API)",
        html: testBody
      })
    });
    
    const result = await response.json();
    const success = !!result.id;
    results.push({
      method: "Direct Resend API",
      success,
      message: success ? `Email sent with ID: ${result.id}` : (result.message || "Unknown error")
    });
    
    if (success) overallSuccess = true;
  } catch (error) {
    results.push({
      method: "Direct Resend API",
      success: false,
      message: error.message || "Exception occurred"
    });
  }

  // Method 2: Appwrite Function
  try {
    console.log("Diagnostic: Trying Appwrite Function...");
    const response = await appwrite.functions.createExecution(
      "67ec44660011c13116cd", // Function ID for email sending
      JSON.stringify({
        to: [recipientEmail],
        subject: testSubject + " (Method 2: Appwrite Function)",
        body: testBody,
        apiKey: "re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA"
      })
    );
    
    const success = response.status === 'completed';
    let message = "Function completed";
    
    if (response.response) {
      try {
        const parsedResponse = JSON.parse(response.response);
        message = parsedResponse.message || "Function completed successfully";
      } catch (parseError) {
        message = "Couldn't parse function response";
      }
    }
    
    results.push({
      method: "Appwrite Function",
      success,
      message
    });
    
    if (success) overallSuccess = true;
  } catch (error) {
    results.push({
      method: "Appwrite Function",
      success: false,
      message: error.message || "Exception occurred"
    });
  }

  // Method 3: CORS Proxy attempt (more likely to work in restricted environments)
  try {
    console.log("Diagnostic: Trying CORS proxy...");
    const response = await fetch("https://api.allorigins.win/post?url=" + 
      encodeURIComponent("https://api.resend.com/emails"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer re_cKhSe1Ao_7Wyvkcfq6AjC8Ccorq4GeoQA`
        },
        body: {
          from: "ServeTracker <no-reply@justlegalsolutions.tech>",
          to: [recipientEmail],
          subject: testSubject + " (Method 3: CORS Proxy)",
          html: testBody
        }
      })
    });
    
    const result = await response.json();
    results.push({
      method: "CORS Proxy",
      success: !!result.contents?.id,
      message: result.contents?.id ? `Email sent with ID: ${result.contents.id}` : "Proxy attempt failed"
    });
    
    if (result.contents?.id) overallSuccess = true;
  } catch (error) {
    results.push({
      method: "CORS Proxy",
      success: false,
      message: error.message || "Exception occurred"
    });
  }

  return {
    success: overallSuccess,
    results
  };
};

// Add diagnostic command to window for console use
if (typeof window !== 'undefined') {
  (window as any).diagnosticEmailTest = diagnosticEmailTest;
}

/**
 * Function to fix serve attempts with client ID issues
 */
export const fixClientIdsInServeAttempts = async (): Promise<{
  processed: number;
  fixed: number;
  message: string;
}> => {
  try {
    // Get all serve attempts - these will now be in the frontend format
    const serves = await appwrite.getServeAttempts();
    
    if (!serves || !Array.isArray(serves) || serves.length === 0) {
      return { processed: 0, fixed: 0, message: "No serve attempts found" };
    }
    
    // Get all clients for reference
    const clients = await appwrite.getClients();
    if (!clients || clients.length === 0) {
      return { processed: 0, fixed: 0, message: "No clients found to reference" };
    }
    
    const defaultClientId = clients[0].$id;
    console.log(`Will use ${defaultClientId} as fallback client ID`);
    
    let processed = 0;
    let fixed = 0;
    
    // Process each serve attempt
    for (const serve of serves) {
      processed++;
      
      // Check if client ID is valid
      const hasValidClientId = serve.clientId && 
                             clients.some(c => c.$id === serve.clientId);
      
      if (!hasValidClientId) {
        console.log(`Fixing serve ${serve.id} with invalid client ID: ${serve.clientId}`);
        
        try {
          // Need to update the actual Appwrite document with snake_case fields
          await appwrite.databases.updateDocument(
            appwrite.DATABASE_ID,
            appwrite.SERVE_ATTEMPTS_COLLECTION_ID,
            serve.id,
            { client_id: defaultClientId }
          );
          
          fixed++;
        } catch (error) {
          console.error(`Failed to fix serve ${serve.id}:`, error);
        }
      }
    }
    
    // If we fixed any, sync back to local storage
    if (fixed > 0) {
      await appwrite.syncAppwriteServesToLocal();
    }
    
    return {
      processed,
      fixed,
      message: `Processed ${processed} serve attempts, fixed ${fixed} with invalid client IDs`
    };
  } catch (error) {
    console.error("Error fixing client IDs:", error);
    return {
      processed: 0,
      fixed: 0,
      message: `Error: ${error.message || "Unknown error"}`
    };
  }
};

// Add fix function to window for console use
if (typeof window !== 'undefined') {
  (window as any).fixClientIdsInServeAttempts = fixClientIdsInServeAttempts;
}
