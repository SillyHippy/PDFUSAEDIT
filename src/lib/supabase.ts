// This is a stub file for backwards compatibility during migration
import { SUPABASE_CONFIG } from '@/config/backendConfig';

// Create stub Supabase client with no functionality
const supabaseUrl = SUPABASE_CONFIG.url;
const supabaseAnonKey = SUPABASE_CONFIG.anonKey;

// Dummy supabase object that will log warnings if accidentally called
export const supabase = {
  from: () => {
    console.warn('Supabase is no longer supported. Please use Appwrite instead.');
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: () => Promise.resolve({ data: null, error: null }),
        }),
        neq: () => Promise.resolve({ data: null, error: null }),
        order: () => Promise.resolve({ data: null, error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({
        eq: () => Promise.resolve({ data: null, error: null }),
      }),
    };
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' }, error: null }),
      remove: () => Promise.resolve({ data: null, error: null }),
    }),
  },
  channel: () => ({
    on: () => ({
      subscribe: () => {},
    }),
  }),
  removeChannel: () => {},
};

// Export specific functions that were previously used
export const setupRealtimeSubscription = () => {
  console.warn('Supabase realtime is no longer supported. Using Appwrite realtime instead.');
  return () => {}; // Return empty cleanup function
};

export const syncSupabaseServesToLocal = async () => {
  console.warn('Syncing from Supabase is no longer supported. Using Appwrite instead.');
  return null;
};

export const syncLocalServesToSupabase = async () => {
  console.warn('Syncing to Supabase is no longer supported. Using Appwrite instead.');
  return;
};

export const updateServeAttempt = async () => {
  console.warn('Updating via Supabase is no longer supported. Using Appwrite instead.');
  return { success: false, error: 'Supabase is no longer supported' };
};

export const deleteServeAttempt = async () => {
  console.warn('Deleting via Supabase is no longer supported. Using Appwrite instead.');
  return { success: false, error: 'Supabase is no longer supported' };
};

export const isSupabaseConfigured = () => false;

export default supabase;
