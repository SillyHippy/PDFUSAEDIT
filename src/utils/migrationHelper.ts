import { appwrite } from "@/lib/appwrite";
import { toast } from "@/hooks/use-toast";

export const migrateSupabaseToAppwrite = async () => {
  try {
    // This utility would help users migrate their remaining Supabase data
    // This is a placeholder function that your migration page might use
    
    // 1. Get data from local storage first (if available)
    const clientsStr = localStorage.getItem("serve-tracker-clients");
    const servesStr = localStorage.getItem("serve-tracker-serves");
    
    const localClients = clientsStr ? JSON.parse(clientsStr) : [];
    const localServes = servesStr ? JSON.parse(servesStr) : [];
    
    // 2. Migrate clients to Appwrite
    const migratedClients = [];
    for (const client of localClients) {
      try {
        await appwrite.createClient(client);
        migratedClients.push(client);
      } catch (error) {
        console.error(`Error migrating client ${client.id}:`, error);
      }
    }
    
    // 3. Migrate serves to Appwrite
    const migratedServes = [];
    for (const serve of localServes) {
      try {
        await appwrite.createServeAttempt({
          ...serve,
          date: serve.timestamp ? new Date(serve.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
          time: serve.timestamp ? new Date(serve.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()
        });
        migratedServes.push(serve);
      } catch (error) {
        console.error(`Error migrating serve ${serve.id}:`, error);
      }
    }
    
    toast.success("Migration complete", {
      description: `Migrated ${migratedClients.length} clients and ${migratedServes.length} serve attempts`
    });
    
    return {
      success: true,
      clientsCount: migratedClients.length,
      servesCount: migratedServes.length
    };
  } catch (error) {
    console.error("Error during migration:", error);
    toast.error("Migration failed", {
      description: error instanceof Error ? error.message : "Unknown error occurred"
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};
