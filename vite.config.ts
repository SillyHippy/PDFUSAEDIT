
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // assetsInclude: ['**/*.pdf'], // Let's rely on the explicit '?url' import instead.
  server: {
    host: "::",
    port: 8080,
    // Add history API fallback for SPA routing
    historyApiFallback: true,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure static assets are properly handled
  publicDir: 'public',
  build: {
    // Ensure all assets are copied to dist
    copyPublicDir: true,
    assetsInlineLimit: 0, // Don't inline assets, keep them as separate files
    rollupOptions: {
      // Ensure PDF files are treated as external assets
      external: [],
      output: {
        assetFileNames: (assetInfo) => {
          // Keep PDF files in their original structure
          if (assetInfo.name && assetInfo.name.endsWith('.pdf')) {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  // Ensure PDF files are served with correct MIME type
  preview: {
    headers: {
      'Cache-Control': 'no-cache'
    }
  },
  // Define fallback env variables for development
  define: {
    // Provide empty strings as fallbacks for required env vars
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || ''),
    'import.meta.env.VITE_APPWRITE_ENDPOINT': JSON.stringify(process.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1'),
    'import.meta.env.VITE_APPWRITE_PROJECT_ID': JSON.stringify(process.env.VITE_APPWRITE_PROJECT_ID || '67ff9afd003750551953'),
    'process.env': {},
    'REACT_ROUTER_FUTURE_FLAGS': {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
}));
