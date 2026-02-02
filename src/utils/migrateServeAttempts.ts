import { Client, Databases, Query } from 'appwrite';

const OLD_COLLECTION_ID = '684c14fb002f6275b932';
const NEW_COLLECTION_ID = 'new_serve_attempts';
const DATABASE_ID = '67eae6fe0020c6721531';

const client = new Client();
client
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('67ff9afd003750551953');

const databases = new Databases(client);

export async function migrateServeAttempts() {
  console.log('Starting migration from old serve_attempts to new collection...');
  
  let migrated = 0;
  let failed = 0;
  let offset = 0;
  const limit = 25;
  
  try {
    while (true) {
      console.log(`Fetching batch at offset ${offset}...`);
      
      // Fetch from old collection
      const response = await databases.listDocuments(
        DATABASE_ID,
        OLD_COLLECTION_ID,
        [
          Query.limit(limit),
          Query.offset(offset)
        ]
      );
      
      if (response.documents.length === 0) {
        console.log('No more documents to migrate.');
        break;
      }
      
      console.log(`Found ${response.documents.length} documents in this batch`);
      
      // Copy each document to new collection
      for (const doc of response.documents) {
        try {
          // Build payload from old document
          const payload: Record<string, any> = {
            client_id: doc.client_id || doc.clientId || '',
            client_name: doc.client_name || doc.clientName || 'Unknown',
            case_number: doc.case_number || doc.caseNumber || '',
            case_name: doc.case_name || doc.caseName || '',
            status: doc.status || 'unknown',
            notes: doc.notes || '',
            address: doc.address || '',
            service_address: doc.service_address || doc.serviceAddress || '',
            coordinates: doc.coordinates || '',
            image_data: doc.image_data || doc.imageData || '',
            timestamp: doc.timestamp || doc.$createdAt,
            attempt_number: doc.attempt_number || doc.attemptNumber || 1,
          };
          
          // Only include thumbnail fields if they exist
          if (doc.thumbnailUrl) {
            payload.thumbnailUrl = doc.thumbnailUrl;
          }
          if (doc.thumbnailFileId) {
            payload.thumbnailFileId = doc.thumbnailFileId;
          }
          
          await databases.createDocument(
            DATABASE_ID,
            NEW_COLLECTION_ID,
            doc.$id, // Keep same document ID
            payload
          );
          
          migrated++;
          console.log(`✓ Migrated: ${doc.$id} (${doc.case_name || doc.case_number})`);
        } catch (docError: any) {
          if (docError.code === 409) {
            console.log(`⊘ Already exists: ${doc.$id}`);
          } else {
            failed++;
            console.error(`✗ Failed: ${doc.$id}`, docError.message);
          }
        }
      }
      
      offset += limit;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n=== Migration Complete ===`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Failed: ${failed}`);
    
    return { migrated, failed };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run from console: window.runMigration()
if (typeof window !== 'undefined') {
  (window as any).runMigration = migrateServeAttempts;
}
