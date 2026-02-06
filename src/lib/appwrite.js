import { Client, Account, Databases, Storage, ID, Query, Teams, Functions } from 'appwrite';
import { APPWRITE_CONFIG } from '@/config/backendConfig';
import { createServeEmailBody } from "@/utils/email"; 
import { v4 as uuidv4 } from "uuid";
import { generateThumbnail } from "@/utils/thumbnailGenerator";
import { extractBase64 } from "@/utils/imageUtils";

const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || APPWRITE_CONFIG.endpoint)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || APPWRITE_CONFIG.projectId);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);
const functions = new Functions(client);

const DATABASE_ID = APPWRITE_CONFIG.databaseId;
const CLIENTS_COLLECTION_ID = APPWRITE_CONFIG.collections.clients;
const SERVE_ATTEMPTS_COLLECTION_ID = APPWRITE_CONFIG.collections.serveAttempts;
const CASES_COLLECTION_ID = APPWRITE_CONFIG.collections.clientCases;
const DOCUMENTS_COLLECTION_ID = APPWRITE_CONFIG.collections.clientDocuments;
const STORAGE_BUCKET_ID = APPWRITE_CONFIG.storageBucket;

export const appwrite = {
  client,
  account,
  databases,
  storage,
  teams,
  functions,
  DATABASE_ID,
  collections: APPWRITE_CONFIG.collections,
  CLIENTS_COLLECTION_ID,
  SERVE_ATTEMPTS_COLLECTION_ID,
  CASES_COLLECTION_ID,
  DOCUMENTS_COLLECTION_ID,
  STORAGE_BUCKET_ID,

  async sendMessage(payload, providerId, topicId) {
    try {
      console.log(`Sending message via Appwrite messaging with provider ${providerId} and topic ${topicId}`);
      console.log("Message payload:", {
        subject: payload.subject,
        recipients: payload.recipients,
        hasImageData: !!payload.imageData,
      });

      if (!payload.subject || !payload.content || !payload.recipients) {
        throw new Error("Missing required fields for email: subject, content, or recipients");
      }

      try {
        const result = await functions.createExecution(
          "sendEmail",
          JSON.stringify({
            subject: payload.subject,
            html: payload.content,
            to: payload.recipients.split(", ")
          }),
          false, 
          "", 
          "POST", 
          {} 
        );
        
        console.log("Email function execution result:", result);
        
        if (result.$id) {
          return { 
            success: true,
            id: result.$id,
            message: "Email send request has been queued"
          };
        } else {
          throw new Error("Function execution created but no ID returned");
        }
      } catch (fnError) {
        console.error("Error executing email function:", fnError);
        
        console.log("Falling back to direct messaging API call");
        
        const endpoint = `${client.config.endpoint}/messaging/topics/${topicId}/subscribers`;
        
        const headers = {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': client.config.project,
        };
        
        if (client.config.key) {
          headers['X-Appwrite-Key'] = client.config.key;
        } else if (client.config.jwt) {
          headers['X-Appwrite-JWT'] = client.config.jwt;
        }
        
        const messageData = {
          userId: 'unique',
          providerType: 'smtp',
          providerId: providerId,
          targetId: payload.recipients,
          content: {
            subject: payload.subject,
            html: payload.content,
          },
          metadata: payload.metadata || {},
        };
        
        if (payload.imageData) {
          messageData.content.attachments = [{
            content: payload.imageData,
            filename: 'serve_evidence.jpeg',
            disposition: 'attachment'
          }];
        }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(messageData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to send message: ${errorData.message || response.statusText}`);
        }
        
        const result = await response.json();
        console.log("Message sent successfully via API:", result);
        return result;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  },

  async sendEmailViaFunction(emailData) {
    try {
      const businessEmail = 'info@justlegalsolutions.org';
      const recipients = Array.isArray(emailData.to) ? [...emailData.to] : [emailData.to];
      if (!recipients.some(email => email.toLowerCase() === businessEmail.toLowerCase())) {
        recipients.push(businessEmail);
      }

      const response = await functions.createExecution(
        "67ed8899003a8b119a18", 
        JSON.stringify({ ...emailData, to: recipients })
      );

      if (response.status === "completed") {
        console.log("Email function executed successfully:", response);
        return { success: true, message: "Email sent successfully" };
      } else {
        console.error("Email function execution failed:", response);
        return { success: false, message: "Email function execution failed" };
      }
    } catch (error) {
      console.error("Error calling email function:", error);
      return { success: false, message: error.message };
    }
  },

  setupRealtimeSubscription(callback) {
    try {
      console.log("Setting up realtime subscription for Appwrite");
      
      const unsubscribe = client.subscribe([
        `databases.${DATABASE_ID}.collections.${CLIENTS_COLLECTION_ID}.documents`,
        `databases.${DATABASE_ID}.collections.${SERVE_ATTEMPTS_COLLECTION_ID}.documents`,
        `databases.${DATABASE_ID}.collections.${CASES_COLLECTION_ID}.documents`,
        `databases.${DATABASE_ID}.collections.${DOCUMENTS_COLLECTION_ID}.documents`,
      ], (response) => {
        callback(response);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up Appwrite realtime subscription:", error);
      return () => {};
    }
  },

  isAppwriteConfigured() {
    return !!APPWRITE_CONFIG.projectId && !!APPWRITE_CONFIG.endpoint;
  },

  async getClients() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID, 
        CLIENTS_COLLECTION_ID,
        [
          Query.limit(500),
          Query.orderDesc('$updatedAt') // Most recently updated/added first
        ]
      );
      return response.documents;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  async createClient(client) {
    try {
      const clientId = client.id || uuidv4().replace(/-/g, '');
      const now = new Date().toISOString();
      const response = await databases.createDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        clientId,
        {
          name: client.name,
          email: client.email,
          additional_emails: client.additionalEmails || [],
          phone: client.phone,
          address: client.address,
          notes: client.notes || "",
          created_at: now,
        }
      );
      return response;
    } catch (error) {
      console.error("Error creating client:", error);
      throw error;
    }
  },

  async updateClient(clientId, clientData) {
    try {
      console.log('Updating client with data:', clientData);
      
      const response = await databases.updateDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        clientId,
        {
          name: clientData.name || '',
          email: clientData.email || '',
          additional_emails: clientData.additionalEmails || [],
          phone: clientData.phone || '',
          address: clientData.address || '',
          notes: clientData.notes || ''
        }
      );
      console.log('Client update response:', response);
      return response;
    } catch (error) {
      console.error('Error updating client:', error);
      console.error('Error details:', error.response || error.message);
      throw error;
    }
  },

  async deleteClient(clientId) {
    try {
      console.log('Attempting to delete client:', clientId);
      
      const cases = await this.getClientCases(clientId);
      console.log(`Found ${cases.length} cases to delete`);
      
      for (const caseDoc of cases) {
        try {
          await this.deleteClientCase(caseDoc.$id);
          console.log(`Deleted case: ${caseDoc.$id}`);
        } catch (caseError) {
          console.error(`Error deleting case ${caseDoc.$id}:`, caseError);
        }
      }
      
      const serves = await this.getClientServeAttempts(clientId);
      console.log(`Found ${serves.length} serve attempts to delete`);
      
      for (const serve of serves) {
        try {
          await this.deleteServeAttempt(serve.$id);
          console.log(`Deleted serve attempt: ${serve.$id}`);
        } catch (serveError) {
          console.error(`Error deleting serve attempt ${serve.$id}:`, serveError);
        }
      }
      
      const documents = await this.getClientDocuments(clientId);
      console.log(`Found ${documents.length} documents to delete`);
      
      for (const doc of documents) {
        try {
          await this.deleteClientDocument(doc.$id, doc.file_path || doc.filePath);
          console.log(`Deleted document: ${doc.$id}`);
        } catch (docError) {
          console.error(`Error deleting document ${doc.$id}:`, docError);
        }
      }
      
      console.log('Deleting client record:', clientId);
      await databases.deleteDocument(
        DATABASE_ID,
        CLIENTS_COLLECTION_ID,
        clientId
      );
      
      console.log('Client and all associated data deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in client deletion process:', error);
      throw error;
    }
  },
  async getServeAttempts(limit = 50, offset = 0) {
    try {
      // Add pagination to prevent memory overload
      const queries = [
        Query.orderDesc('timestamp'),
        Query.limit(limit),
        Query.offset(offset)
      ];
      
      const response = await databases.listDocuments(DATABASE_ID, SERVE_ATTEMPTS_COLLECTION_ID, queries);
      
      const formattedServes = response.documents.map(doc => ({
        id: doc.$id,
        clientId: doc.client_id || "unknown",
        clientName: doc.client_name || "Unknown Client",
        caseNumber: doc.case_number || "Unknown",
        caseName: doc.case_name || "Unknown Case",
        coordinates: doc.coordinates || null,
        notes: doc.notes || "",
        status: doc.status || "unknown",
        timestamp: doc.timestamp ? new Date(doc.timestamp) : new Date(),
        attemptNumber: doc.attempt_number || 1,
        // Use thumbnail URL for faster loading
        thumbnailUrl: doc.thumbnailUrl || doc.thumbnail_url || null,
        thumbnailFileId: doc.thumbnailFileId || doc.thumbnail_file_id || null,
        // Use image_url (storage URL) for full image - no more base64 in database
        imageUrl: doc.image_url || null,
        imageFileId: doc.image_file_id || null,
        // Keep image_data for backwards compatibility with legacy records
        image_data: doc.image_data || null,
        address: doc.address || "",
        serviceAddress: doc.service_address || "",
      }));
      
      return formattedServes;
    } catch (error) {
      console.error('Error fetching serve attempts:', error);
      return [];
    }
  },

  async getClientServeAttempts(clientId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        [Query.equal('client_id', clientId)]
      );
      return response.documents.map(doc => ({
        id: doc.$id,
        clientId: doc.client_id || "unknown",
        clientName: doc.client_name || "Unknown Client", 
        caseNumber: doc.case_number || "Unknown",
        caseName: doc.case_name || "Unknown Case",
        coordinates: doc.coordinates || null,
        notes: doc.notes || "",
        status: doc.status || "unknown",
        timestamp: doc.timestamp ? new Date(doc.timestamp) : new Date(),
        attemptNumber: doc.attempt_number || 1,
        thumbnailUrl: doc.thumbnailUrl || doc.thumbnail_url || null,
        thumbnailFileId: doc.thumbnailFileId || doc.thumbnail_file_id || null,
        // Use image_url (storage URL) for full image - no more base64 in database
        imageUrl: doc.image_url || null,
        imageFileId: doc.image_file_id || null,
        // Keep image_data for backwards compatibility with legacy records
        image_data: doc.image_data || null,
        address: doc.address || "",
        serviceAddress: doc.service_address || "",
      })).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error(`Error fetching serve attempts for client ${clientId}:`, error);
      return [];
    }
  },

  async getTotalServeAttemptsCount() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        [Query.limit(1)]
      );
      return response.total;
    } catch (error) {
      console.error('Error getting total serve attempts count:', error);
      return 0;
    }
  },

  async createServeAttempt(serveData) {
    try {
      console.log("Creating serve attempt in Appwrite with data:", {
        clientId: serveData.clientId,
        clientName: serveData.clientName,
        caseNumber: serveData.caseNumber,
        caseName: serveData.caseName
      });

      if (!serveData.clientId || serveData.clientId === "unknown") {
        throw new Error("Valid client ID is required for serve attempts.");
      }

      let clientName = serveData.clientName || "Unknown Client";
      if (clientName === "Unknown Client") {
        try {
          const client = await databases.getDocument(
            DATABASE_ID,
            CLIENTS_COLLECTION_ID,
            serveData.clientId
          );
          if (client && client.name) {
            clientName = client.name;
          }
        } catch (clientError) {
          console.warn("Could not fetch client name:", clientError);
        }
      }

      const address = serveData.address || 
                      (typeof serveData.coordinates === 'string' ? 
                       `Coordinates: ${serveData.coordinates}` : 
                       "Address not provided");

      const caseNumber = serveData.caseNumber || "Not Specified";
      const caseName = serveData.caseName || "Unknown Case";

      let coordinates = "0,0";
      if (serveData.coordinates) {
        if (typeof serveData.coordinates === 'string') {
          coordinates = serveData.coordinates;
        } else if (serveData.coordinates.latitude !== undefined && serveData.coordinates.longitude !== undefined) {
          coordinates = `${serveData.coordinates.latitude},${serveData.coordinates.longitude}`;
        }
      }

      const documentId = uuidv4().replace(/-/g, '');

      // Process full image and thumbnail if image data is provided
      let thumbnailUrl = null;
      let thumbnailFileId = null;
      let imageUrl = null;
      let imageFileId = null;
      
      if (serveData.imageData) {
        // Upload full image to storage bucket
        try {
          console.log("Starting full image upload process...");
          
          // Extract the pure base64 data without the prefix
          const pureBase64 = extractBase64(serveData.imageData);
          
          if (!pureBase64) {
            throw new Error("Failed to extract base64 data from image");
          }
          
          console.log(`Extracted base64 data (${pureBase64.length} chars)`);
          
          // Convert base64 to a Blob
          const byteCharacters = atob(pureBase64);
          const byteArrays = [];
          
          for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
          }
          
          const fullImageBlob = new Blob(byteArrays, { type: "image/jpeg" });
          
          // Create file from blob for full image
          imageFileId = uuidv4().replace(/-/g, '');
          const fullImageFilename = `serve_${documentId}_full.jpg`;
          const fullImageFile = new File([fullImageBlob], fullImageFilename, { type: 'image/jpeg' });
          
          console.log(`Created full image file: ${fullImageFile.name}, size: ${fullImageFile.size} bytes`);
          
          // Upload full image to Appwrite storage
          const IMAGES_BUCKET_ID = STORAGE_BUCKET_ID;
          const fullImageResult = await storage.createFile(
            IMAGES_BUCKET_ID,
            imageFileId,
            fullImageFile
          );
          
          console.log("Full image uploaded successfully:", fullImageResult.$id);
          
          // Get the public URL for full image
          imageUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${IMAGES_BUCKET_ID}/files/${imageFileId}/view?project=67ff9afd003750551953`;
          
          console.log("Generated full image URL:", imageUrl);
        } catch (imageError) {
          console.error("Failed to upload full image:", imageError);
          imageUrl = null;
          imageFileId = null;
        }
        
        // Generate and upload thumbnail
        try {
          console.log("Starting thumbnail generation process...");
          
          // Generate thumbnail blob
          const thumbnailBlob = await generateThumbnail(serveData.imageData, {
            maxWidth: 400,
            maxHeight: 300,
            quality: 0.8,
            format: 'jpeg'
          });
          
          console.log(`Generated thumbnail blob (${thumbnailBlob.size} bytes)`);
          
          // Create file from blob
          thumbnailFileId = uuidv4().replace(/-/g, '');
          const filename = `serve_${documentId}_thumb.jpg`;
          const file = new File([thumbnailBlob], filename, { type: 'image/jpeg' });
          
          console.log(`Created thumbnail file: ${file.name}, size: ${file.size} bytes`);
          
          // Upload to Appwrite storage
          const THUMBNAIL_BUCKET_ID = "68865532001e22527554";
          const result = await storage.createFile(
            THUMBNAIL_BUCKET_ID,
            thumbnailFileId,
            file
          );
          
          console.log("Thumbnail uploaded successfully:", result.$id);
          
          // Get the public URL
          thumbnailUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${THUMBNAIL_BUCKET_ID}/files/${thumbnailFileId}/view?project=67ff9afd003750551953`;
          
          console.log("Generated thumbnail URL:", thumbnailUrl);
        } catch (thumbnailError) {
          console.warn("Failed to process thumbnail, continuing without it:", thumbnailError);
          thumbnailUrl = null;
          thumbnailFileId = null;
        }
      }

      const payload = {
        client_id: serveData.clientId,
        client_name: clientName,
        case_number: caseNumber,
        case_name: caseName,
        status: serveData.status || "unknown",
        notes: serveData.notes || "",
        address: address,
        service_address: serveData.serviceAddress || serveData.address || "",
        coordinates: coordinates,
        image_url: imageUrl || "", // Full image URL in storage
        timestamp: serveData.timestamp ? 
                   (serveData.timestamp instanceof Date ? 
                    serveData.timestamp.toISOString() : 
                    new Date(serveData.timestamp).toISOString()) : 
                   new Date().toISOString(),
        attempt_number: serveData.attemptNumber || 1,
      };
      
      // Only include thumbnail fields if they were successfully generated
      if (thumbnailUrl && thumbnailFileId) {
        payload.thumbnailUrl = thumbnailUrl;
        payload.thumbnailFileId = thumbnailFileId;
        console.log("Including thumbnail fields in payload");
      } else {
        console.log("Skipping thumbnail fields - not generated");
      }
      
      // Log fields being saved to confirm no base64 data
      console.log("Payload image fields:", {
        image_url: payload.image_url,
        thumbnailUrl: payload.thumbnailUrl,
        thumbnailFileId: payload.thumbnailFileId
      });

      const response = await databases.createDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        documentId,
        payload
      );
      
      console.log("Serve attempt saved successfully with ID:", response.$id);
      
      if (serveData.clientEmail) {
        response.clientEmail = serveData.clientEmail;
      }
      
      try {
        const emailBody = createServeEmailBody(
          response.client_name,
          response.address,
          response.notes,
          new Date(response.timestamp),
          response.coordinates,
          response.attempt_number,
          response.case_name
        );
    
        const statusText = response.status === 'completed' ? 'Successful' : 'Failed';
        const emailData = {
          to: serveData.clientEmail || "info@justlegalsolutions.org",
          subject: `New Serve Attempt ${statusText} - ${response.case_name}`,
          html: emailBody,
          imageUrl: imageUrl, // Use the URL we just uploaded
          coordinates: response.coordinates,
          notes: response.notes,
          status: response.status
        };
    
        console.log("Sending email with imageUrl:", imageUrl);
        const emailResult = await this.sendEmailViaFunction(emailData);
    
        if (emailResult.success) {
          console.log("Email sent successfully:", emailResult.message);
        } else {
          console.error("Failed to send email:", emailResult.message);
        }
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
      }
      
      return response;
    } catch (error) {
      console.error("Error creating serve attempt:", error);
      
      try {
        console.log("Saving serve attempt to local storage as fallback");
        const serveAttempts = JSON.parse(localStorage.getItem("serve-tracker-serves") || "[]");
        const newServe = {
          id: uuidv4().replace(/-/g, ''),
          clientId: serveData.clientId,
          clientName: serveData.clientName || "Unknown Client",
          clientEmail: serveData.clientEmail,
          caseNumber: serveData.caseNumber || "Unknown",
          caseName: serveData.caseName || "Unknown Case",
          coordinates: serveData.coordinates || null,
          notes: serveData.notes || "",
          status: serveData.status || "unknown",
          timestamp: new Date(),
          attemptNumber: serveData.attemptNumber || 1,
          imageUrl: null, // Don't store base64 in local storage fallback either
          address: serveData.address || ""
        };
        serveAttempts.push(newServe);
        localStorage.setItem("serve-tracker-serves", JSON.stringify(serveAttempts));
        console.log("Saved to local storage successfully");
        return newServe;
      } catch (localError) {
        console.error("Failed local storage fallback:", localError);
      }
      
      throw error;
    }
  },

  async updateServeAttempt(serveId, serveData) {
    try {
      console.log("Updating serve attempt with data:", serveData);

      const docId = typeof serveId === 'object' ? (serveId.id || serveId.$id) : serveId;

      if (!docId) {
        throw new Error("Valid serve ID is required for updating");
      }

      const originalDoc = await databases.getDocument(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        docId
      );

      console.log("Original document:", originalDoc);

      const updateData = {};
      
      if (serveData.notes !== undefined && serveData.notes !== originalDoc.notes) 
        updateData.notes = serveData.notes;
      
      if (serveData.status !== undefined && serveData.status !== originalDoc.status) 
        updateData.status = serveData.status;
      
      if (serveData.caseNumber !== undefined && serveData.caseNumber !== originalDoc.case_number) 
        updateData.case_number = serveData.caseNumber;
      
      if (serveData.caseName !== undefined && serveData.caseName !== originalDoc.case_name) 
        updateData.case_name = serveData.caseName;
      
      console.log("Updating document with fields:", updateData);

      if (Object.keys(updateData).length > 0) {
        const response = await databases.updateDocument(
          DATABASE_ID,
          SERVE_ATTEMPTS_COLLECTION_ID,
          docId,
          updateData
        );

        console.log("Update response:", response);

        // --- THIS IS THE NEW CODE ---
        try {
          // Fetch the client's data to get their email
          const client = await databases.getDocument(DATABASE_ID, CLIENTS_COLLECTION_ID, response.client_id);
          const clientEmail = client.email;
          
          if (clientEmail) {
            const emailBody = createServeEmailBody(
              response.client_name,
              response.address,
              response.notes,
              new Date(response.timestamp),
              response.coordinates,
              response.attempt_number,
              response.case_name
            );

            const statusText = response.status === 'completed' ? 'Successful' : 'Failed';
            const emailData = {
              to: clientEmail,
              subject: `Serve Attempt Updated - ${response.case_name}`,
              html: emailBody,
              imageUrl: response.image_url || response.image_data, // Use URL instead of base64
              coordinates: response.coordinates,
              notes: response.notes,
              status: response.status
            };

            console.log("Sending update email notification...");
            await this.sendEmailViaFunction(emailData);
          }
        } catch (emailError) {
          console.error("Error sending update email notification:", emailError);
        }
        // --- END OF NEW CODE ---
        
        await this.syncAppwriteServesToLocal();

        return response;
      } else {
        console.log("No fields to update");
        return originalDoc;
      }
    } catch (error) {
      console.error('Error updating serve attempt:', error);
      throw error;
    }
  },

  async deleteServeAttempt(serveId) {
    try {
      if (!serveId) {
        console.warn("Invalid serveId provided to deleteServeAttempt:", serveId);
        return false;
      }

      console.log(`Attempting to delete serve attempt with ID: ${serveId}`);
      await databases.deleteDocument(DATABASE_ID, SERVE_ATTEMPTS_COLLECTION_ID, serveId);
      console.log(`Successfully deleted serve attempt with ID: ${serveId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting serve attempt ${serveId}:`, error);
      throw error;
    }
  },

  async resolveClientId(fallbackClientId) {
    try {
      console.log(`Resolving client ID for fallback client_id: ${fallbackClientId}`);

      const cases = await databases.listDocuments(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        [Query.equal('client_id', fallbackClientId)]
      );
      if (cases.documents.length > 0) {
        console.log(`Resolved client ID from client_cases: ${fallbackClientId}`);
        return fallbackClientId;
      }

      const documents = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        [Query.equal('client_id', fallbackClientId)]
      );
      if (documents.documents.length > 0) {
        console.log(`Resolved client ID from client_documents: ${fallbackClientId}`);
        return fallbackClientId;
      }

      const serves = await databases.listDocuments(
        DATABASE_ID,
        SERVE_ATTEMPTS_COLLECTION_ID,
        [Query.equal('client_id', fallbackClientId)]
      );
      if (serves.documents.length > 0) {
        console.log(`Resolved client ID from serve_attempts: ${fallbackClientId}`);
        return fallbackClientId;
      }

      console.warn(`Unable to resolve client ID for fallback client_id: ${fallbackClientId}`);
      return null;
    } catch (error) {
      console.error(`Error resolving client ID for fallback client_id: ${fallbackClientId}`, error);
      return null;
    }
  },
  async syncAppwriteServesToLocal() {
    try {
      // Only sync recent data to prevent memory overload
      const response = await databases.listDocuments(
        DATABASE_ID, 
        SERVE_ATTEMPTS_COLLECTION_ID,
        [
          Query.orderDesc('timestamp'),
          Query.limit(100) // Limit to most recent 100 serves
        ]
      );
      
      if (!response.documents || response.documents.length === 0) {
        console.log("No serve attempts found in Appwrite");
        return false;
      }

      const frontendServes = response.documents.map(doc => ({
        id: doc.$id,
        clientId: doc.client_id || "unknown",
        clientName: doc.client_name || "Unknown Client",
        caseNumber: doc.case_number || "Unknown",
        caseName: doc.case_name || "Unknown Case",
        coordinates: doc.coordinates || null,
        notes: doc.notes || "",
        status: doc.status || "unknown",
        timestamp: doc.timestamp ? new Date(doc.timestamp) : new Date(),
        attemptNumber: doc.attempt_number || 1,
        // Use image_url for storage URL (no more base64 overhead)
        imageUrl: doc.image_url || null,
        imageFileId: doc.image_file_id || null,
        thumbnailUrl: doc.thumbnailUrl || doc.thumbnail_url || null,
        thumbnailFileId: doc.thumbnailFileId || doc.thumbnail_file_id || null,
        // Keep image_data for backwards compatibility with legacy records
        image_data: doc.image_data || null,
        address: doc.address || "",
        serviceAddress: doc.service_address || "",
      }));

      // Check localStorage size before saving
      const dataString = JSON.stringify(frontendServes);
      const sizeInMB = new Blob([dataString]).size / (1024 * 1024);
      
      if (sizeInMB > 5) { // If data is over 5MB, remove legacy image_data to prevent memory issues
        console.warn(`Data size is ${sizeInMB.toFixed(2)}MB, removing legacy image_data to prevent memory issues`);
        frontendServes.forEach(serve => serve.image_data = null);
      }

      localStorage.setItem("serve-tracker-serves", JSON.stringify(frontendServes));
      window.dispatchEvent(new CustomEvent("serves-updated"));

      console.log(`Synced ${frontendServes.length} serve attempts from Appwrite to local storage (${sizeInMB.toFixed(2)}MB)`);
      return true;
    } catch (error) {
      console.error("Error syncing serve attempts from Appwrite:", error);
      return false;
    }
  },

  async getClientCases(clientId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        [Query.equal('client_id', clientId)]
      );
      return response.documents;
    } catch (error) {
      console.error(`Error fetching cases for client ${clientId}:`, error);
      return [];
    }
  },

  async createCase(caseData) {
    try {
      const caseId = uuidv4().replace(/-/g, '');
      const now = new Date().toISOString();
      const response = await databases.createDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        caseId,
        {
          client_id: caseData.client_id,
          case_number: caseData.case_number,
          case_name: caseData.case_name,
          court_name: caseData.court_name,
          plaintiff_petitioner: caseData.plaintiff_petitioner,
          defendant_respondent: caseData.defendant_respondent,
          home_address: caseData.home_address,
          work_address: caseData.work_address,
          notes: caseData.notes || '',
          status: caseData.status || 'Open',
          created_at: now,
          updated_at: now
        }
      );
      return response;
    } catch (error) {
      console.error('Error creating case:', error);
      throw error;
    }
  },

  async updateCase(caseId, caseData) {
    try {
      console.log('Updating case with ID:', caseId, 'and data:', caseData);
      
      const response = await databases.updateDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        caseId,
        {
          case_number: caseData.case_number,
          case_name: caseData.case_name,
          court_name: caseData.court_name,
          plaintiff_petitioner: caseData.plaintiff_petitioner,
          defendant_respondent: caseData.defendant_respondent,
          home_address: caseData.home_address,
          work_address: caseData.work_address,
          notes: caseData.notes || '',
          status: caseData.status,
          updated_at: new Date().toISOString()
        }
      );
      
      console.log('Case update successful:', response);
      return response;
    } catch (error) {
      console.error('Error updating case:', error);
      throw error;
    }
  },

  async deleteClientCase(caseId) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        caseId
      );
      return true;
    } catch (error) {
      console.error('Error deleting client case:', error);
      throw error;
    }
  },

  async updateCaseStatus(caseId, status) {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        CASES_COLLECTION_ID,
        caseId,
        {
          status: status,
          updated_at: new Date().toISOString()
        }
      );
      return response;
    } catch (error) {
      console.error('Error updating case status:', error);
      throw error;
    }
  },

  async uploadClientDocument(clientId, file, caseNumber, description) {
    try {
      const fileId = uuidv4().replace(/-/g, '');
      const fileUploadResponse = await storage.createFile(
        STORAGE_BUCKET_ID,
        fileId,
        file
      );
      
      const docId = uuidv4().replace(/-/g, '');
      const now = new Date().toISOString();
      const document = await databases.createDocument(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        docId,
        {
          client_id: clientId,
          case_number: caseNumber || "",
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: fileId,
          description: description || "",
          created_at: now
        }
      );
      return document;
    } catch (error) {
      console.error('Error uploading client document:', error);
      throw error;
    }
  },

  async getClientDocuments(clientId, caseNumber) {
    try {
      const queries = [Query.equal('client_id', clientId)];
      if (caseNumber) {
        queries.push(Query.equal('case_number', caseNumber));
      }
      const response = await databases.listDocuments(
        DATABASE_ID,
        DOCUMENTS_COLLECTION_ID,
        queries
      );
      return response.documents;
    } catch (error) {
      console.error(`Error fetching documents for client ${clientId}:`, error);
      return [];
    }
  },

  async deleteClientDocument(docId, fileId) {
    try {
      console.log(`Attempting to delete document with ID: ${docId} and fileId: ${fileId}`);

      if (fileId && (!/^[a-zA-Z0-9_]{1,36}$/.test(fileId) || fileId.startsWith('_'))) {
        console.warn(`Invalid fileId: ${fileId}. Skipping file deletion.`);
      } else if (fileId) {
        await storage.deleteFile(STORAGE_BUCKET_ID, fileId);
        console.log(`Successfully deleted file with fileId: ${fileId}`);
      }

      await databases.deleteDocument(DATABASE_ID, DOCUMENTS_COLLECTION_ID, docId);
      console.log(`Successfully deleted document with ID: ${docId}`);
      return true;
    } catch (error) {
      console.error('Error deleting client document:', error);
      throw error;
    }
  }
};
