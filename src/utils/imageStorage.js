import { appwrite } from "@/lib/appwrite";
import { ID } from "appwrite";
import { extractBase64 } from "./imageUtils";

/**
 * Uploads an image from base64 to Appwrite storage and returns a public URL
 * @param {string} base64Image - Base64 image data (with or without data URL prefix)
 * @param {string} filename - Desired filename
 * @returns {Promise<{fileId: string, fileUrl: string}>} The file ID and public URL
 */
export const uploadImageAndGetUrl = async (base64Image, filename = "serve_evidence.jpg") => {
  console.log("Starting image upload process");
  
  try {
    // Extract the pure base64 data without the prefix
    const pureBase64 = extractBase64(base64Image);
    
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
    
    const blob = new Blob(byteArrays, { type: "image/jpeg" });
    
    // Create a File object from the Blob
    const file = new File([blob], filename, { type: "image/jpeg" });
    console.log(`Created File object: ${file.name}, size: ${file.size} bytes`);
    
    // Generate a unique file ID
    const fileId = ID.unique();
    
    // Upload to Appwrite storage
    const result = await appwrite.storage.createFile(
      appwrite.STORAGE_BUCKET_ID,
      fileId,
      file
    );
    
    console.log("File uploaded successfully:", result.$id);
    
    // Get the file URL
    const fileUrl = appwrite.storage.getFileView(
      appwrite.STORAGE_BUCKET_ID,
      fileId
    ).href;
    
    console.log("Generated public file URL:", fileUrl);
    
    return {
      fileId: result.$id,
      fileUrl
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
