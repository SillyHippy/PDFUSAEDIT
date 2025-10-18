
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string;
  readonly VITE_APPWRITE_PROJECT_ID: string;
  readonly VITE_APPWRITE_DATABASE_ID: string;
  readonly VITE_APPWRITE_CLIENTS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_SERVE_ATTEMPTS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_CLIENT_CASES_COLLECTION_ID: string;
  readonly VITE_APPWRITE_CLIENT_DOCUMENTS_COLLECTION_ID: string;
  readonly VITE_APPWRITE_STORAGE_BUCKET_ID: string;
  readonly VITE_APPWRITE_EMAIL_FUNCTION_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Add compatibility for both Node.js and browser environments
declare global {
  interface Window {
    // Extend window with any custom properties
    [key: string]: any;
  }

  // Ensure compatibility with browser types
  type Storage = globalThis.Storage;
  type Request = globalThis.Request;
  type Response = globalThis.Response;
  type EventSource = globalThis.EventSource;

  // Define GeolocationCoordinates type for compatibility
  interface GeolocationCoordinatesCompatible {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  }

  // Make it available globally for type checking
  type CoordinateTypes = string | GeolocationCoordinatesCompatible | null;
}
