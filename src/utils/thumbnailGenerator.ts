/**
 * Thumbnail generation utilities for optimizing image storage and display
 */

interface ThumbnailOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Generate a thumbnail from base64 image data
 * @param base64Image - The original base64 image (with or without data URL prefix)
 * @param options - Thumbnail generation options
 * @returns Promise<Blob> - The thumbnail as a Blob
 */
export const generateThumbnail = async (
  base64Image: string,
  options: ThumbnailOptions = {}
): Promise<Blob> => {
  const {
    maxWidth = 400,
    maxHeight = 300,
    quality = 0.8,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    try {
      // Create an image element
      const img = new Image();
      
      img.onload = () => {
        // Create canvas for thumbnail generation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw the image on canvas with new dimensions
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate thumbnail blob'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for thumbnail generation'));
      };

      // Handle both data URLs and raw base64
      if (base64Image.startsWith('data:')) {
        img.src = base64Image;
      } else {
        img.src = `data:image/jpeg;base64,${base64Image}`;
      }
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate a thumbnail and convert it to base64
 * @param base64Image - The original base64 image
 * @param options - Thumbnail generation options
 * @returns Promise<string> - The thumbnail as base64 data URL
 */
export const generateThumbnailBase64 = async (
  base64Image: string,
  options: ThumbnailOptions = {}
): Promise<string> => {
  const thumbnailBlob = await generateThumbnail(base64Image, options);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Failed to convert thumbnail blob to base64'));
    };
    reader.readAsDataURL(thumbnailBlob);
  });
};

/**
 * Validate if an image is suitable for thumbnail generation
 * @param base64Image - The base64 image to validate
 * @returns Promise<boolean> - Whether the image is valid
 */
export const validateImageForThumbnail = async (base64Image: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        // Check if image has reasonable dimensions
        const isValid = img.width > 0 && img.height > 0 && img.width <= 4096 && img.height <= 4096;
        resolve(isValid);
      };
      
      img.onerror = () => {
        resolve(false);
      };

      // Handle both data URLs and raw base64
      if (base64Image.startsWith('data:')) {
        img.src = base64Image;
      } else {
        img.src = `data:image/jpeg;base64,${base64Image}`;
      }
    } catch (error) {
      console.error('Error validating image:', error);
      resolve(false);
    }
  });
};