import { appwrite } from "@/lib/appwrite";
import { generateThumbnail } from "./thumbnailGenerator";
import { v4 as uuidv4 } from "uuid";

// Thumbnail storage bucket configuration
const THUMBNAIL_BUCKET_ID = "68865532001e22527554";

/**
 * Upload a thumbnail image to Appwrite Storage and return the public URL
 * @param base64Image - Original base64 image data
 * @param filename - Optional filename (will generate unique if not provided)
 * @returns Promise<{fileId: string, fileUrl: string}> - File ID and public URL
 */
export const uploadThumbnailAndGetUrl = async (
  base64Image: string,
  filename?: string
): Promise<{ fileId: string; fileUrl: string }> => {
  console.log("Starting thumbnail upload process");
  
  try {
    // Generate thumbnail blob
    const thumbnailBlob = await generateThumbnail(base64Image, {
      maxWidth: 400,
      maxHeight: 300,
      quality: 0.8,
      format: 'jpeg'
    });
    
    console.log(`Generated thumbnail blob (${thumbnailBlob.size} bytes)`);
    
    // Create file from blob
    const fileId = uuidv4().replace(/-/g, ''); // Generate valid Appwrite file ID
    const finalFilename = filename || `thumbnail_${fileId}.jpg`;
    const file = new File([thumbnailBlob], finalFilename, { type: 'image/jpeg' });
    
    console.log(`Created file: ${file.name}, size: ${file.size} bytes`);
    
    // Upload to Appwrite storage
    const result = await appwrite.storage.createFile(
      THUMBNAIL_BUCKET_ID,
      fileId,
      file
    );
    
    console.log("Thumbnail uploaded successfully:", result.$id);
    
    // Get the public URL with proper project parameter
    const fileUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/${THUMBNAIL_BUCKET_ID}/files/${fileId}/view?project=67ff9afd003750551953`;
    
    console.log("Generated thumbnail URL:", fileUrl);
    
    return {
      fileId: result.$id,
      fileUrl
    };
  } catch (error) {
    console.error("Error uploading thumbnail:", error);
    throw error;
  }
};

/**
 * Delete a thumbnail from storage
 * @param fileId - The file ID to delete
 * @returns Promise<boolean> - Success status
 */
export const deleteThumbnail = async (fileId: string): Promise<boolean> => {
  try {
    await appwrite.storage.deleteFile(THUMBNAIL_BUCKET_ID, fileId);
    console.log("Thumbnail deleted successfully:", fileId);
    return true;
  } catch (error) {
    console.error("Error deleting thumbnail:", error);
    return false;
  }
};

/**
 * Get a thumbnail URL by file ID
 * @param fileId - The file ID
 * @returns string - The public URL
 */
export const getThumbnailUrl = (fileId: string): string => {
  return `https://nyc.cloud.appwrite.io/v1/storage/buckets/${THUMBNAIL_BUCKET_ID}/files/${fileId}/view?project=67ff9afd003750551953`;
};

/**
 * Process and store thumbnail for a serve attempt
 * @param imageData - Base64 image data from serve attempt
 * @param serveId - Serve attempt ID for filename
 * @returns Promise<string> - The thumbnail URL
 */
export const processAndStoreThumbnail = async (
  imageData: string,
  serveId: string
): Promise<string> => {
  const filename = `serve_${serveId}_thumb.jpg`;
  const { fileUrl } = await uploadThumbnailAndGetUrl(imageData, filename);
  return fileUrl;
};