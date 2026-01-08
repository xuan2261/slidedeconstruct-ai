import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractBase64 } from './image-preprocessing';

// Note: standardizeImage and getImageDimensions use browser APIs (Image, document.createElement)
// which are not available in Node.js test environment without jsdom.
// Testing extractBase64 which is a pure function.

describe('image-preprocessing utilities', () => {

  describe('extractBase64', () => {
    it('should extract base64 from PNG data URI', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ';
      const result = extractBase64(dataUri);
      expect(result).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ');
    });

    it('should extract base64 from JPEG data URI', () => {
      const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
      const result = extractBase64(dataUri);
      expect(result).toBe('/9j/4AAQSkZJRgABAQAAAQABAAD');
    });

    it('should extract base64 from JPG data URI', () => {
      const dataUri = 'data:image/jpg;base64,/9j/4AAQSkZJRgABAQEASABI';
      const result = extractBase64(dataUri);
      expect(result).toBe('/9j/4AAQSkZJRgABAQEASABI');
    });

    it('should extract base64 from WebP data URI', () => {
      const dataUri = 'data:image/webp;base64,UklGRl4AAABXRUJQVlA4TFE';
      const result = extractBase64(dataUri);
      expect(result).toBe('UklGRl4AAABXRUJQVlA4TFE');
    });

    it('should return input unchanged if no data URI prefix', () => {
      const rawBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ';
      const result = extractBase64(rawBase64);
      expect(result).toBe(rawBase64);
    });

    it('should handle empty string', () => {
      const result = extractBase64('');
      expect(result).toBe('');
    });

    it('should handle data URI with special characters in base64', () => {
      const dataUri = 'data:image/png;base64,abc+def/ghi=';
      const result = extractBase64(dataUri);
      expect(result).toBe('abc+def/ghi=');
    });
  });

});
