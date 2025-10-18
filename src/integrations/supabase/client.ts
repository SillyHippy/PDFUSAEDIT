
// This file forwards from Supabase to Appwrite since we've migrated
import type { Database } from './types';
import { appwrite } from '@/lib/appwrite';

const SUPABASE_URL = "https://qdjdmicjzmpggctzjsrf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkamRtaWNqem1wZ2djdHpqc3JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MTAxODIsImV4cCI6MjA1ODI4NjE4Mn0.St9w_1cd-8yr0vsL6tYQ0MgiQJeqV7-fw6TIursi0I8";

// Forward all calls to Appwrite since we've migrated
export const supabase = {
  ...appwrite,
  // Add any compatibility methods needed
  from: (table: string) => {
    console.log(`Supabase compatibility layer: from('${table}')`);
    return {
      select: () => {
        console.log(`Redirecting to Appwrite for table: ${table}`);
        // Return a promise that will be resolved with Appwrite data
        return {
          then: (callback: any) => {
            if (table === 'serve_attempts') {
              return appwrite.getServeAttempts().then(callback);
            }
            if (table === 'clients') {
              return appwrite.getClients().then(callback);
            }
            return Promise.resolve([]).then(callback);
          }
        };
      }
    };
  },
  // Helper for clients to ensure data format compatibility
  formatClientData: (client: any) => {
    if (!client) return null;
    
    // Handle both Appwrite and Supabase format
    return {
      id: client.id || client.$id,
      name: client.name,
      email: client.email,
      additionalEmails: client.additionalEmails || client.additional_emails || [],
      phone: client.phone || '',
      address: client.address || '',
      notes: client.notes || '',
      createdAt: client.created_at || client.createdAt
    };
  },
  // Format an array of clients for consistency
  formatClientsArray: (clients: any[]) => {
    if (!clients || !Array.isArray(clients)) {
      return [];
    }
    
    return clients.map(client => supabase.formatClientData(client))
      .filter(client => client !== null);
  }
};
