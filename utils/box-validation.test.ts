import { describe, it, expect } from 'vitest';
import { isValidBox, calculateIoU, expandBox, deduplicateElements } from './box-validation';
import { BoundingBox } from '../types';

describe('box-validation utilities', () => {

  describe('isValidBox', () => {
    it('should return true for valid box within 0-100% range', () => {
      const box: BoundingBox = { top: 10, left: 20, width: 30, height: 40 };
      expect(isValidBox(box)).toBe(true);
    });

    it('should return true for box at edge boundaries', () => {
      const box: BoundingBox = { top: 0, left: 0, width: 100, height: 100 };
      expect(isValidBox(box)).toBe(true);
    });

    it('should return true for box with decimal values', () => {
      const box: BoundingBox = { top: 15.5, left: 10.2, width: 50.0, height: 20.1 };
      expect(isValidBox(box)).toBe(true);
    });

    it('should return false for box with negative top', () => {
      const box: BoundingBox = { top: -5, left: 10, width: 20, height: 20 };
      expect(isValidBox(box)).toBe(false);
    });

    it('should return false for box with negative left', () => {
      const box: BoundingBox = { top: 10, left: -5, width: 20, height: 20 };
      expect(isValidBox(box)).toBe(false);
    });

    it('should return false for box exceeding 100% boundary', () => {
      const box: BoundingBox = { top: 90, left: 10, width: 20, height: 20 };
      expect(isValidBox(box)).toBe(false); // top + height = 110 > 100
    });

    it('should return false for box with width <= 0.5%', () => {
      const box: BoundingBox = { top: 10, left: 10, width: 0.3, height: 20 };
      expect(isValidBox(box)).toBe(false);
    });

    it('should return false for box with height <= 0.5%', () => {
      const box: BoundingBox = { top: 10, left: 10, width: 20, height: 0.4 };
      expect(isValidBox(box)).toBe(false);
    });

    it('should return true for minimum valid size (0.51%)', () => {
      const box: BoundingBox = { top: 10, left: 10, width: 0.51, height: 0.51 };
      expect(isValidBox(box)).toBe(true);
    });
  });

  describe('calculateIoU', () => {
    it('should return 1 for identical boxes', () => {
      const box: BoundingBox = { top: 10, left: 10, width: 20, height: 20 };
      expect(calculateIoU(box, box)).toBe(1);
    });

    it('should return 0 for non-overlapping boxes', () => {
      const a: BoundingBox = { top: 0, left: 0, width: 10, height: 10 };
      const b: BoundingBox = { top: 50, left: 50, width: 10, height: 10 };
      expect(calculateIoU(a, b)).toBe(0);
    });

    it('should return 0 for adjacent boxes (no overlap)', () => {
      const a: BoundingBox = { top: 0, left: 0, width: 10, height: 10 };
      const b: BoundingBox = { top: 0, left: 10, width: 10, height: 10 };
      expect(calculateIoU(a, b)).toBe(0);
    });

    it('should calculate correct IoU for partial overlap', () => {
      const a: BoundingBox = { top: 0, left: 0, width: 20, height: 20 };
      const b: BoundingBox = { top: 10, left: 10, width: 20, height: 20 };
      // Intersection: 10x10 = 100
      // Union: 400 + 400 - 100 = 700
      // IoU = 100/700 = 0.1428...
      const iou = calculateIoU(a, b);
      expect(iou).toBeCloseTo(100 / 700, 4);
    });

    it('should handle box fully contained in another', () => {
      const outer: BoundingBox = { top: 0, left: 0, width: 50, height: 50 };
      const inner: BoundingBox = { top: 10, left: 10, width: 10, height: 10 };
      // Intersection = 100, Union = 2500 + 100 - 100 = 2500
      // IoU = 100/2500 = 0.04
      const iou = calculateIoU(outer, inner);
      expect(iou).toBeCloseTo(0.04, 4);
    });
  });

  describe('expandBox', () => {
    it('should expand box by default padding (0.5%)', () => {
      const box: BoundingBox = { top: 10, left: 10, width: 20, height: 20 };
      const expanded = expandBox(box);
      expect(expanded.top).toBe(9.5);
      expect(expanded.left).toBe(9.5);
      expect(expanded.width).toBe(21);
      expect(expanded.height).toBe(21);
    });

    it('should expand box by custom padding', () => {
      const box: BoundingBox = { top: 10, left: 10, width: 20, height: 20 };
      const expanded = expandBox(box, 2);
      expect(expanded.top).toBe(8);
      expect(expanded.left).toBe(8);
      expect(expanded.width).toBe(24);
      expect(expanded.height).toBe(24);
    });

    it('should clamp top/left to 0 when padding would go negative', () => {
      const box: BoundingBox = { top: 0.2, left: 0.3, width: 20, height: 20 };
      const expanded = expandBox(box, 1);
      expect(expanded.top).toBe(0);
      expect(expanded.left).toBe(0);
    });

    it('should clamp width/height to not exceed 100%', () => {
      const box: BoundingBox = { top: 90, left: 90, width: 8, height: 8 };
      const expanded = expandBox(box, 1);
      // top becomes 89, left becomes 89
      // width should be min(100 - 89, 8 + 2) = min(11, 10) = 10
      // height should be min(100 - 89, 8 + 2) = min(11, 10) = 10
      expect(expanded.width).toBe(10);
      expect(expanded.height).toBe(10);
    });

    it('should handle edge case at boundary', () => {
      const box: BoundingBox = { top: 0, left: 0, width: 100, height: 100 };
      const expanded = expandBox(box, 1);
      expect(expanded.top).toBe(0);
      expect(expanded.left).toBe(0);
      expect(expanded.width).toBe(100);
      expect(expanded.height).toBe(100);
    });
  });

  describe('deduplicateElements', () => {
    it('should return empty array for empty input', () => {
      const result = deduplicateElements([]);
      expect(result).toEqual([]);
    });

    it('should keep single element', () => {
      const elements = [{ id: '1', box: { top: 10, left: 10, width: 20, height: 20 } }];
      const result = deduplicateElements(elements);
      expect(result).toHaveLength(1);
    });

    it('should keep non-overlapping elements', () => {
      const elements = [
        { id: '1', box: { top: 0, left: 0, width: 10, height: 10 } },
        { id: '2', box: { top: 50, left: 50, width: 10, height: 10 } },
      ];
      const result = deduplicateElements(elements);
      expect(result).toHaveLength(2);
    });

    it('should remove duplicate with IoU > 0.8', () => {
      const elements = [
        { id: '1', box: { top: 10, left: 10, width: 20, height: 20 } },
        { id: '2', box: { top: 10, left: 10, width: 20, height: 20 } }, // identical
      ];
      const result = deduplicateElements(elements);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1'); // keeps first
    });

    it('should keep elements with IoU <= threshold', () => {
      const elements = [
        { id: '1', box: { top: 0, left: 0, width: 20, height: 20 } },
        { id: '2', box: { top: 10, left: 10, width: 20, height: 20 } }, // partial overlap
      ];
      const result = deduplicateElements(elements);
      expect(result).toHaveLength(2);
    });

    it('should use custom threshold', () => {
      const elements = [
        { id: '1', box: { top: 0, left: 0, width: 20, height: 20 } },
        { id: '2', box: { top: 5, left: 5, width: 20, height: 20 } },
      ];
      // With very low threshold, more duplicates are removed
      const result = deduplicateElements(elements, 0.1);
      expect(result).toHaveLength(1);
    });

    it('should handle multiple duplicates correctly', () => {
      const baseBox = { top: 10, left: 10, width: 20, height: 20 };
      const elements = [
        { id: '1', box: baseBox },
        { id: '2', box: baseBox },
        { id: '3', box: baseBox },
        { id: '4', box: { top: 80, left: 80, width: 10, height: 10 } }, // different
      ];
      const result = deduplicateElements(elements);
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toContain('1');
      expect(result.map(e => e.id)).toContain('4');
    });
  });
});
