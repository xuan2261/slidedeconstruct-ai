import { describe, it, expect } from 'vitest';
import {
  fuseDetections,
  isTesseractResultValid,
  DEFAULT_FUSION_IOU_THRESHOLD,
  FusionOptions
} from './detection-fusion';
import { SlideTextElement, SlideVisualElement, ElementType } from '../types';

// Helper to create a text element
const createTextElement = (
  id: string,
  box: { top: number; left: number; width: number; height: number },
  content = 'Test Text',
  confidence = 0.9
): SlideTextElement => ({
  id,
  type: ElementType.TEXT,
  content,
  confidence,
  box,
  style: {
    fontSize: 'medium',
    fontWeight: 'normal',
    color: '#000000',
    alignment: 'left'
  }
});

// Helper to create a visual element
const createVisualElement = (
  id: string,
  box: { top: number; left: number; width: number; height: number },
  confidence = 0.9
): SlideVisualElement => ({
  id,
  type: ElementType.VISUAL,
  description: 'Test Visual',
  confidence,
  box,
  originalBox: box
});

describe('detection-fusion', () => {
  describe('DEFAULT_FUSION_IOU_THRESHOLD', () => {
    it('should be 0.3', () => {
      expect(DEFAULT_FUSION_IOU_THRESHOLD).toBe(0.3);
    });
  });

  describe('fuseDetections', () => {
    it('should return gemini-only when no tesseract elements', () => {
      const gemini = [
        createTextElement('g1', { top: 10, left: 10, width: 20, height: 5 })
      ];
      const result = fuseDetections(gemini, []);

      expect(result.source).toBe('gemini');
      expect(result.elements).toHaveLength(1);
      expect(result.stats.geminiCount).toBe(1);
      expect(result.stats.tesseractCount).toBe(0);
      expect(result.stats.matchedCount).toBe(0);
    });

    it('should keep VISUAL elements from Gemini unchanged', () => {
      const gemini = [
        createVisualElement('v1', { top: 10, left: 10, width: 20, height: 20 })
      ];
      const tesseract = [
        createTextElement('t1', { top: 10, left: 10, width: 20, height: 20 })
      ];
      const result = fuseDetections(gemini, tesseract);

      expect(result.elements).toHaveLength(2);
      expect(result.elements[0].type).toBe(ElementType.VISUAL);
      expect(result.elements[0].id).toBe('v1');
    });

    it('should match TEXT elements by IoU and use Tesseract box when preferClientBoxes=true', () => {
      const geminiBox = { top: 10, left: 10, width: 30, height: 10 };
      const tesseractBox = { top: 11, left: 11, width: 28, height: 8 }; // Slightly different, high IoU

      const gemini = [createTextElement('g1', geminiBox, 'Gemini Text')];
      const tesseract = [createTextElement('t1', tesseractBox, 'Tesseract Text')];

      const result = fuseDetections(gemini, tesseract, { preferClientBoxes: true });

      expect(result.source).toBe('fused');
      expect(result.stats.matchedCount).toBe(1);
      expect(result.elements).toHaveLength(1);
      // Should use Tesseract's box
      expect(result.elements[0].box).toEqual(tesseractBox);
      // Should keep Gemini's content
      expect((result.elements[0] as SlideTextElement).content).toBe('Gemini Text');
    });

    it('should keep Gemini box when preferClientBoxes=false', () => {
      const geminiBox = { top: 10, left: 10, width: 30, height: 10 };
      const tesseractBox = { top: 11, left: 11, width: 28, height: 8 };

      const gemini = [createTextElement('g1', geminiBox)];
      const tesseract = [createTextElement('t1', tesseractBox)];

      const result = fuseDetections(gemini, tesseract, { preferClientBoxes: false });

      expect(result.elements[0].box).toEqual(geminiBox);
    });

    it('should add unmatched Tesseract elements as new detections', () => {
      const gemini = [
        createTextElement('g1', { top: 10, left: 10, width: 20, height: 5 })
      ];
      const tesseract = [
        createTextElement('t1', { top: 50, left: 50, width: 20, height: 5 }) // No overlap
      ];

      const result = fuseDetections(gemini, tesseract);

      expect(result.elements).toHaveLength(2);
      expect(result.stats.addedFromTesseract).toBe(1);
    });

    it('should not add Tesseract element if it overlaps with existing element', () => {
      const box = { top: 10, left: 10, width: 20, height: 5 };
      const gemini = [createTextElement('g1', box)];
      const tesseract = [
        createTextElement('t1', box), // Exact same box - will match
        createTextElement('t2', { top: 11, left: 11, width: 18, height: 4 }) // High overlap
      ];

      const result = fuseDetections(gemini, tesseract);

      // t1 matches g1, t2 overlaps with merged result - should not be added
      expect(result.stats.matchedCount).toBe(1);
      expect(result.stats.addedFromTesseract).toBe(0);
    });

    it('should use higher confidence from both sources', () => {
      const box = { top: 10, left: 10, width: 20, height: 5 };
      const gemini = [createTextElement('g1', box, 'Text', 0.7)];
      const tesseract = [createTextElement('t1', box, 'Text', 0.95)];

      const result = fuseDetections(gemini, tesseract);

      expect(result.elements[0].confidence).toBe(0.95);
    });

    it('should support legacy number parameter for iouThreshold', () => {
      const gemini = [
        createTextElement('g1', { top: 10, left: 10, width: 20, height: 5 })
      ];
      const tesseract = [
        createTextElement('t1', { top: 10, left: 10, width: 20, height: 5 })
      ];

      const result = fuseDetections(gemini, tesseract, 0.5);

      expect(result.stats.matchedCount).toBe(1);
    });

    it('should respect custom iouThreshold', () => {
      const geminiBox = { top: 10, left: 10, width: 20, height: 10 };
      const tesseractBox = { top: 25, left: 25, width: 20, height: 10 }; // Very low overlap

      const gemini = [createTextElement('g1', geminiBox)];
      const tesseract = [createTextElement('t1', tesseractBox)];

      // With high threshold (0.8), should not match - boxes barely overlap
      const highThreshold = fuseDetections(gemini, tesseract, { iouThreshold: 0.8 });
      expect(highThreshold.stats.matchedCount).toBe(0);

      // With very low threshold (0.01), still won't match if IoU is 0
      // Let's use overlapping boxes instead
      const overlappingTesseract = [createTextElement('t1', { top: 15, left: 15, width: 20, height: 10 })];
      const lowThreshold = fuseDetections(gemini, overlappingTesseract, { iouThreshold: 0.1 });
      expect(lowThreshold.stats.matchedCount).toBe(1);
    });
  });

  describe('isTesseractResultValid', () => {
    it('should return false when Tesseract found nothing but Gemini found text', () => {
      expect(isTesseractResultValid([], 5)).toBe(false);
    });

    it('should return true when both found nothing', () => {
      expect(isTesseractResultValid([], 0)).toBe(true);
    });

    it('should return false when Tesseract found 10x more than Gemini', () => {
      const tesseract = Array(50).fill(null).map((_, i) =>
        createTextElement(`t${i}`, { top: i, left: 0, width: 10, height: 5 })
      );
      expect(isTesseractResultValid(tesseract, 4)).toBe(false);
    });

    it('should return true when counts are reasonable', () => {
      const tesseract = [
        createTextElement('t1', { top: 10, left: 10, width: 20, height: 5 }),
        createTextElement('t2', { top: 20, left: 10, width: 20, height: 5 })
      ];
      expect(isTesseractResultValid(tesseract, 3)).toBe(true);
    });

    it('should return true when Tesseract found more but less than 10x', () => {
      const tesseract = Array(9).fill(null).map((_, i) =>
        createTextElement(`t${i}`, { top: i * 10, left: 0, width: 10, height: 5 })
      );
      expect(isTesseractResultValid(tesseract, 1)).toBe(true);
    });
  });
});
