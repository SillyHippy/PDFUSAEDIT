// Import any necessary types or utilities here
import { appwrite } from '@/lib/appwrite';

// Define a type for client data to fix the object property access issues
interface ClientData {
  id: string;
  name: string;
  email: string;
  additionalEmails: string[];
  phone: string;
  address: string;
  notes: string;
  [key: string]: any; // Allow other properties
}

// Extend the Window interface to include our debug tools
declare global {
  interface Window {
    inspectAppwriteConfig: () => void;
    fixClientIdsInServeAttempts: () => Promise<void>;
    testCreateClient: () => Promise<{ success: boolean; client?: any; error?: any }>;
    testDeleteClient: (clientId: string) => void;
    listClients: () => Promise<{ success: boolean; clients?: any[]; error?: any }>;
  }
}

// Initialize debug tools for development environment
export function initializeDebugTools() {
  console.log('Debug tools initialized');

  // Add a function to the window object to inspect Appwrite configuration
  window.inspectAppwriteConfig = () => {
    console.log('Appwrite Config:', {
      endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
      projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
      databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
      serveAttemptsCollectionId: import.meta.env.VITE_APPWRITE_SERVE_ATTEMPTS_COLLECTION_ID,
    });
  };

  // Add client data repair function to window object
  window.fixClientIdsInServeAttempts = async function() {
    try {
      const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || "67eae6fe0020c6721531";
      const collectionId = import.meta.env.VITE_APPWRITE_SERVE_ATTEMPTS_COLLECTION_ID || "67eae7ef8034c7ad35f6";

      console.log("Debug: databaseId =", databaseId);
      console.log("Debug: collectionId =", collectionId);
      
      // Log the appwrite object structure to help debug
      console.log("Appwrite client structure:", Object.keys(appwrite));
      console.log("Appwrite databases structure:", appwrite.databases ? Object.keys(appwrite.databases) : "No databases property");
      
      if (!databaseId || !collectionId) {
        throw new Error("Missing Appwrite databaseId or collectionId in environment variables.");
      }

      // Fetch serve attempts
      console.log("Fetching serve attempts...");
      const serves = await appwrite.getServeAttempts();
      console.log(`Found ${serves.length} serve attempts`);
      
      if (!serves || serves.length === 0) {
        return;
      }
      
      // Check if updateDocument is available in appwrite.databases
      if (!appwrite.databases || typeof appwrite.databases.updateDocument !== 'function') {
        console.error("Error: appwrite.databases.updateDocument is not a function");
        console.log("Attempting to use alternative methods...");
        
        // Try to use the client directly instead
        if (appwrite.client && appwrite.client.databases) {
          console.log("Using appwrite.client.databases instead");
          for (const serve of serves) {
            if (!serve.id && !serve.$id) {
              console.error("Skipping serve attempt with missing ID:", serve);
              continue;
            }
            
            const documentId = serve.id || serve.$id;
            const updatedServe = { ...serve, clientId: serve.clientId || "unknown" };
            
            console.log(`Updating serve attempt ${documentId} using client.databases...`);
            await appwrite.client.databases.updateDocument(databaseId, collectionId, documentId, updatedServe);
          }
          return;
        }
      }
      
      // Use the standard method if available
      for (const serve of serves) {
        if (!serve.id && !serve.$id) {
          console.error("Skipping serve attempt with missing ID:", serve);
          continue;
        }
        
        const documentId = serve.id || serve.$id;
        const updatedServe = { ...serve, clientId: serve.clientId || "unknown" };
        
        console.log(`Updating serve attempt with ID: ${documentId}`);
        try {
          // Use a more direct approach to call the Appwrite SDK
          await appwrite.databases.updateDocument(
            databaseId,
            collectionId,
            documentId,
            updatedServe
          );
          console.log(`Successfully updated serve attempt: ${documentId}`);
        } catch (updateError) {
          console.error(`Error updating serve attempt ${documentId}:`, updateError);
        }
      }
    } catch (error) {
      console.error("Error fixing client IDs in serve attempts:", error);
      
      // Additional debugging for the error
      if (error.response) {
        console.error("Error response:", error.response);
      }
      
      if (error.message) {
        console.error("Error message:", error.message);
      }
    }
  };

  // Add function to test client creation
  window.testCreateClient = async function() {
    try {
      // Define client with correct type
      const clientData: ClientData = {
        id: '', 
        name: 'Test Client',
        email: 'test@example.com',
        additionalEmails: [],
        phone: '555-123-4567',
        address: '123 Test Street',
        notes: 'Created for testing'
      };

      // Create a test client using the Appwrite SDK
      const newClient = await appwrite.createClient(clientData);

      console.log('Test client created:', newClient);
      return { success: true, client: newClient };
    } catch (error) {
      console.error('Error creating test client:', error);
      return { success: false, error };
    }
  };

  // Add function to list all clients
  window.listClients = async function() {
    try {
      const clients = await appwrite.getClients();
      console.log('Listing all clients:', clients);
      return { success: true, clients };
    } catch (error) {
      console.error('Error listing clients:', error);
      return { success: false, error };
    }
  };
}
