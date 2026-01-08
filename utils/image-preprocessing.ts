/**
 * Image Preprocessing Utilities
 * Standardizes images for consistent AI analysis
 */

import { BoundingBox } from '../types';

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
 * Generates a binary mask image from bounding boxes.
 * Black (0,0,0) = keep, White (255,255,255) = remove/inpaint
 *
 * @param boxes - Array of bounding boxes (percentages 0-100)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param padding - Additional padding around boxes in percentage (default: 1.0)
 * @returns Base64 encoded PNG mask (without data URI prefix)
 */
export const generateMaskImage = (
  boxes: BoundingBox[],
  width: number,
  height: number,
  padding = 1.0
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas 2D context for mask generation');
  }

  // Black background = keep these areas
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // White regions = areas to inpaint/remove
  ctx.fillStyle = '#FFFFFF';
  boxes.forEach((box) => {
    // Apply padding and convert percentage to pixels
    const paddedLeft = Math.max(0, box.left - padding);
    const paddedTop = Math.max(0, box.top - padding);
    const paddedWidth = Math.min(100 - paddedLeft, box.width + padding * 2);
    const paddedHeight = Math.min(100 - paddedTop, box.height + padding * 2);

    const x = (paddedLeft / 100) * width;
    const y = (paddedTop / 100) * height;
    const w = (paddedWidth / 100) * width;
    const h = (paddedHeight / 100) * height;

    ctx.fillRect(x, y, w, h);
  });

  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
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
