/**
 * Utility functions for handling image data in the application
 */

/**
 * Validates if a string is a proper base64 image data
 * @param {string} data - The string to check
 * @returns {boolean} True if valid base64 image data
 */
export const isValidBase64Image = (data) => {
  if (!data || typeof data !== 'string') return false;
  
  // Check if it's a data URL
  if (data.startsWith('data:image/')) {
    // Extract the base64 part
    const base64Part = data.split('base64,')[1];
    return !!base64Part;
  }
  
  // Check if it looks like base64 directly
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(data);
};

/**
 * Extracts the base64 data from a data URL or returns the original if already base64
 * @param {string} imageData - The image data string
 * @returns {string} The base64 part of the image data
 */
export const extractBase64 = (imageData) => {
  if (!imageData || typeof imageData !== 'string') return null;
  
  // If it's a data URL, extract the base64 part
  if (imageData.includes('base64,')) {
    return imageData.split('base64,')[1];
  }
  
  // Otherwise return as is (assuming it's already base64)
  return imageData;
};

/**
 * Debug function to log image data properly
 * @param {string} imageData - The image data to log
 */
export const debugImageData = (imageData) => {
  if (!imageData) {
    console.log('Image data is null or undefined');
    return;
  }
  
  console.log('Image data type:', typeof imageData);
  console.log('Image data length:', imageData.length);
  
  if (typeof imageData === 'string') {
    // Determine format
    let format = 'Unknown';
    if (imageData.startsWith('data:image/jpeg')) format = 'JPEG Data URL';
    else if (imageData.startsWith('data:image/png')) format = 'PNG Data URL';
    else if (imageData.startsWith('data:image/')) format = 'Image Data URL';
    else if (/^[A-Za-z0-9+/=]+$/.test(imageData)) format = 'Base64 string';
    
    console.log('Image data format:', format);
    console.log('Image data preview:', imageData.substring(0, 50) + '...');
    
    if (imageData.includes('base64,')) {
      const base64Part = imageData.split('base64,')[1];
      console.log('Base64 part length:', base64Part.length);
    }
  }
};
