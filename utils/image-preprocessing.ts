/**
 * Image Preprocessing Utilities
 * Standardizes images for consistent AI analysis
 */

export const DEFAULT_TARGET_WIDTH = 1920;
export const DEFAULT_TARGET_HEIGHT = 1080;

/**
 * Standardizes an image to a consistent resolution while maintaining aspect ratio.
 * Centers the image on a white canvas if aspect ratio differs.
 *
 * @param base64 - Base64 encoded image (with or without data URI prefix)
 * @param targetWidth - Target width in pixels (default: 1920)
 * @param targetHeight - Target height in pixels (default: 1080)
 * @returns Promise<string> - Base64 encoded standardized image with data URI prefix
 */
export const standardizeImage = async (
  base64: string,
  targetWidth = DEFAULT_TARGET_WIDTH,
  targetHeight = DEFAULT_TARGET_HEIGHT
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas 2D context'));
        return;
      }

      // Calculate scale to fit while maintaining aspect ratio
      const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      // Center the image
      const x = (targetWidth - scaledWidth) / 2;
      const y = (targetHeight - scaledHeight) / 2;

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Draw scaled and centered image
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for preprocessing'));
    };

    // Handle both with and without data URI prefix
    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
  });
};

/**
 * Extracts the raw base64 data from a data URI
 * @param dataUri - Full data URI string
 * @returns Raw base64 string without prefix
 */
export const extractBase64 = (dataUri: string): string => {
  return dataUri.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

/**
 * Gets image dimensions from a base64 encoded image
 * @param base64 - Base64 encoded image
 * @returns Promise with width and height
 */
export const getImageDimensions = async (
  base64: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for dimension check'));
    };

    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
  });
};
