
import { ACTIVE_BACKEND, BACKEND_PROVIDER } from '@/config/backendConfig';
import { appwrite } from '@/lib/appwrite';
import { toast } from 'sonner';

// Helper function to check which backend is currently active
export const isUsingAppwrite = () => {
  return true; // Always using Appwrite now
};

// Helper function to check if we're properly connected to the active backend
export const checkBackendConnection = async () => {
  try {
    // Try to list clients to check if we're connected
    const clients = await appwrite.databases.listDocuments(
      appwrite.DATABASE_ID,
      appwrite.CLIENTS_COLLECTION_ID
    );
    
    // If we get here, we're connected
    // Reset any fallback flags
    window.localStorage.removeItem('useLocalStorageFallback');
    console.log("Successfully connected to Appwrite");
    return { connected: true, provider: 'Appwrite' };
  } catch (error) {
    console.error("Appwrite connection check failed:", error);
    // Set fallback flag for offline usage
    window.localStorage.setItem('useLocalStorageFallback', 'true');
    
    // Show toast only once - not on every failed check
    if (!window.localStorage.getItem('connectionErrorShown')) {
      toast.error("Appwrite connection failed", {
        description: "Using local storage as fallback. Data will sync when connection is restored."
      });
      window.localStorage.setItem('connectionErrorShown', 'true');
    }
    
    return { connected: false, provider: 'Appwrite', error };
  }
};

// Helper to get displayable backend information
export const getBackendInfo = () => {
  return {
    name: "Appwrite",
    icon: "⚡",
    color: "bg-indigo-500"
  };
};

export default {
  isUsingAppwrite,
  checkBackendConnection,
  getBackendInfo
};
