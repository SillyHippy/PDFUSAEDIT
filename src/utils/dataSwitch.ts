
import { toast } from 'sonner';
import { appwrite } from '@/lib/appwrite';
import { ServeAttemptData } from '@/types/ServeAttemptData';
import { ClientData } from '@/components/ClientForm';
import { ACTIVE_BACKEND, BACKEND_PROVIDER } from '@/config/backendConfig';

export const clearLocalStorage = () => {
  try {
    // Remove all app data from local storage
    localStorage.removeItem("serve-tracker-clients");
    localStorage.removeItem("serve-tracker-serves");
    
    toast.success("Local storage cleared", {
      description: "All local data has been reset"
    });
    
    return true;
  } catch (error) {
    console.error('Error clearing local storage:', error);
    toast.error("Failed to clear local storage", {
      description: error instanceof Error ? error.message : "Unknown error"
    });
    return false;
  }
};

export const syncToAppwrite = async () => {
  try {
    // Get data from local storage
    const clientsStr = localStorage.getItem("serve-tracker-clients");
    const servesStr = localStorage.getItem("serve-tracker-serves");
    
    const clients = clientsStr ? JSON.parse(clientsStr) : [];
    const serves = servesStr ? JSON.parse(servesStr) : [];
    
    console.log(`Found ${clients.length} clients and ${serves.length} serve attempts in localStorage`);
    
    // Upload clients to Appwrite
    for (const client of clients) {
      try {
        await appwrite.createClient(client);
        console.log(`Migrated client: ${client.name}`);
      } catch (error) {
        console.error(`Error migrating client ${client.id}:`, error);
      }
    }
    
    // Upload serve attempts to Appwrite
    for (const serve of serves) {
      try {
        await appwrite.createServeAttempt(serve);
        console.log(`Migrated serve attempt: ${serve.id}`);
      } catch (error) {
        console.error(`Error migrating serve attempt ${serve.id}:`, error);
      }
    }
    
    return {
      success: true,
      clientsCount: clients.length,
      servesCount: serves.length
    };
  } catch (error) {
    console.error("Error syncing to Appwrite:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

export const loadDataFromAppwrite = async (): Promise<{
  clients: ClientData[];
  serves: ServeAttemptData[];
}> => {
  try {
    console.log("Loading data from Appwrite instead of local storage");
    
    // Get clients from Appwrite
    const appwriteClients = await appwrite.getClients();
    const clients = appwriteClients.map(client => ({
      id: client.$id,
      name: client.name,
      email: client.email,
      additionalEmails: client.additional_emails || [],
      phone: client.phone,
      address: client.address,
      notes: client.notes
    }));
    
    // Get serve attempts from Appwrite
    const appwriteServes = await appwrite.getServeAttempts();
    const serves = appwriteServes.map(serve => ({
      id: serve.$id,
      clientId: serve.clientId,
      date: serve.date,
      time: serve.time,
      address: serve.address,
      notes: serve.notes,
      status: serve.status,
      imageData: serve.imageData,
      coordinates: serve.coordinates
    }));
    
    console.log(`Loaded ${clients.length} clients and ${serves.length} serve attempts from Appwrite`);
    
    return { clients, serves };
  } catch (error) {
    console.error("Error loading data from Appwrite:", error);
    return { clients: [], serves: [] };
  }
};

export const saveClientToAppwrite = async (client: ClientData): Promise<ClientData | null> => {
  try {
    const newClientId = client.id || `client-${Date.now()}`;
    const clientToSave = {
      ...client,
      id: newClientId
    };
    
    await appwrite.createClient(clientToSave);
    console.log("Successfully saved client to Appwrite:", clientToSave);
    
    return clientToSave;
  } catch (error) {
    console.error("Error saving client to Appwrite:", error);
    return null;
  }
};

export const checkAppwriteConnection = async (): Promise<boolean> => {
  try {
    // Try to get a list of clients to test connection
    const clients = await appwrite.getClients();
    console.log("Appwrite connection test successful");
    return true;
  } catch (error) {
    console.error("Appwrite connection test failed:", error);
    return false;
  }
};

// Helper function to determine which backend to use
export const getActiveBackend = () => {
  return BACKEND_PROVIDER.APPWRITE; // Always return Appwrite
};
