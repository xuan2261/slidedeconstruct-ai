import { describe, it, expect } from 'vitest';
import { isValidBox, deduplicateElements } from './box-validation';
import { BoundingBox, ElementType } from '../types';

/**
 * Tests for confidence filtering logic as implemented in geminiService.ts
 * The filtering chain is: normalize -> isValidBox -> confidence filter -> deduplicate
 */

const CONFIDENCE_THRESHOLD = 0.6;

// Helper to simulate the confidence filtering applied in analyzeLayout
const filterByConfidence = <T extends { confidence?: number }>(
  elements: T[],
  threshold = CONFIDENCE_THRESHOLD
): T[] => elements.filter(el => (el.confidence ?? 1) >= threshold);

describe('Confidence Filtering Logic', () => {

  describe('filterByConfidence', () => {
    it('should keep elements with confidence >= threshold', () => {
      const elements = [
        { id: '1', confidence: 0.9, box: { top: 10, left: 10, width: 20, height: 20 } },
        { id: '2', confidence: 0.7, box: { top: 30, left: 30, width: 20, height: 20 } },
        { id: '3', confidence: 0.6, box: { top: 50, left: 50, width: 20, height: 20 } },
      ];
      const result = filterByConfidence(elements);
      expect(result).toHaveLength(3);
    });

    it('should remove elements with confidence < threshold', () => {
      const elements = [
        { id: '1', confidence: 0.5, box: { top: 10, left: 10, width: 20, height: 20 } },
        { id: '2', confidence: 0.3, box: { top: 30, left: 30, width: 20, height: 20 } },
        { id: '3', confidence: 0.59, box: { top: 50, left: 50, width: 20, height: 20 } },
      ];
      const result = filterByConfidence(elements);
      expect(result).toHaveLength(0);
    });

    it('should treat undefined confidence as 1.0 (high confidence)', () => {
      const elements = [
        { id: '1', box: { top: 10, left: 10, width: 20, height: 20 } }, // no confidence
        { id: '2', confidence: undefined, box: { top: 30, left: 30, width: 20, height: 20 } },
      ];
      const result = filterByConfidence(elements);
      expect(result).toHaveLength(2);
    });

    it('should handle mixed confidence values', () => {
      const elements = [
        { id: '1', confidence: 0.95, box: { top: 10, left: 10, width: 20, height: 20 } },
        { id: '2', confidence: 0.4, box: { top: 30, left: 30, width: 20, height: 20 } },
        { id: '3', confidence: 0.8, box: { top: 50, left: 50, width: 20, height: 20 } },
        { id: '4', confidence: 0.2, box: { top: 70, left: 70, width: 10, height: 10 } },
      ];
      const result = filterByConfidence(elements);
      expect(result).toHaveLength(2);
      expect(result.map(e => e.id)).toEqual(['1', '3']);
    });

    it('should use custom threshold when provided', () => {
      const elements = [
        { id: '1', confidence: 0.9, box: { top: 10, left: 10, width: 20, height: 20 } },
        { id: '2', confidence: 0.7, box: { top: 30, left: 30, width: 20, height: 20 } },
      ];
      const result = filterByConfidence(elements, 0.8);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should handle empty array', () => {
      const result = filterByConfidence([]);
      expect(result).toEqual([]);
    });

    it('should handle boundary confidence value (exactly threshold)', () => {
      const elements = [
        { id: '1', confidence: 0.6, box: { top: 10, left: 10, width: 20, height: 20 } },
      ];
      const result = filterByConfidence(elements, 0.6);
      expect(result).toHaveLength(1);
    });

    it('should handle confidence of 0', () => {
      const elements = [
        { id: '1', confidence: 0, box: { top: 10, left: 10, width: 20, height: 20 } },
      ];
      const result = filterByConfidence(elements);
      expect(result).toHaveLength(0);
    });

    it('should handle confidence of 1', () => {
      const elements = [
        { id: '1', confidence: 1, box: { top: 10, left: 10, width: 20, height: 20 } },
      ];
      const result = filterByConfidence(elements);
      expect(result).toHaveLength(1);
    });
  });

  describe('Full Pipeline: isValidBox + confidence + deduplicate', () => {
    it('should filter invalid boxes, low confidence, and duplicates', () => {
      const elements = [
        // Valid, high confidence
        { id: '1', confidence: 0.9, box: { top: 10, left: 10, width: 20, height: 20 } },
        // Invalid box (exceeds 100%)
        { id: '2', confidence: 0.9, box: { top: 90, left: 10, width: 20, height: 20 } },
        // Low confidence
        { id: '3', confidence: 0.3, box: { top: 30, left: 30, width: 20, height: 20 } },
        // Duplicate of id:1 (same box)
        { id: '4', confidence: 0.85, box: { top: 10, left: 10, width: 20, height: 20 } },
        // Valid, high confidence, unique
        { id: '5', confidence: 0.75, box: { top: 60, left: 60, width: 15, height: 15 } },
      ];

      // Apply pipeline
      const afterValidation = elements.filter(el => isValidBox(el.box));
      const afterConfidence = filterByConfidence(afterValidation);
      const final = deduplicateElements(afterConfidence);

      expect(final).toHaveLength(2);
      expect(final.map(e => e.id)).toContain('1');
      expect(final.map(e => e.id)).toContain('5');
    });

    it('should preserve order - first element wins in deduplication', () => {
      const elements = [
        { id: 'first', confidence: 0.7, box: { top: 10, left: 10, width: 20, height: 20 } },
        { id: 'second', confidence: 0.95, box: { top: 10, left: 10, width: 20, height: 20 } },
      ];

      const filtered = filterByConfidence(elements);
      const deduped = deduplicateElements(filtered);

      expect(deduped).toHaveLength(1);
      expect(deduped[0].id).toBe('first'); // First wins, not highest confidence
    });
  });

});
