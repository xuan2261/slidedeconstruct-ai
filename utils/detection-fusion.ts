import { SlideTextElement, SlideVisualElement, ElementType } from '../types';
import { calculateIoU } from './box-validation';

/** Default IoU threshold for matching elements between Gemini and Tesseract */
export const DEFAULT_FUSION_IOU_THRESHOLD = 0.3;

export interface FusionResult {
  elements: (SlideTextElement | SlideVisualElement)[];
  source: 'gemini' | 'tesseract' | 'fused';
  stats: {
    geminiCount: number;
    tesseractCount: number;
    matchedCount: number;
    addedFromTesseract: number;
  };
}

export interface FusionOptions {
  iouThreshold?: number;
  preferClientBoxes?: boolean; // When true, always use Tesseract boxes for matched TEXT elements
}

/**
 * Fuses detection results from Gemini and Tesseract
 * Strategy:
 * - Keep all VISUAL elements from Gemini (Tesseract doesn't detect these)
 * - For TEXT elements, prefer Tesseract bounding boxes when IoU match found
 * - Add unmatched Tesseract detections as new elements
 */
export const fuseDetections = (
  geminiElements: (SlideTextElement | SlideVisualElement)[],
  tesseractElements: SlideTextElement[],
  options: FusionOptions | number = DEFAULT_FUSION_IOU_THRESHOLD
): FusionResult => {
  // Support legacy number parameter for backwards compatibility
  const opts: FusionOptions = typeof options === 'number'
    ? { iouThreshold: options }
    : options;

  const iouThreshold = opts.iouThreshold ?? DEFAULT_FUSION_IOU_THRESHOLD;
  const preferClientBoxes = opts.preferClientBoxes ?? true;

  const fused: (SlideTextElement | SlideVisualElement)[] = [];
  const usedTesseract = new Set<number>();
  let matchedCount = 0;

  for (const gEl of geminiElements) {
    // Keep VISUAL elements as-is from Gemini
    if (gEl.type === ElementType.VISUAL) {
      fused.push(gEl);
      continue;
    }

    // For TEXT elements, try to find matching Tesseract detection
    let bestMatch = -1;
    let bestIoU = 0;

    tesseractElements.forEach((tEl, idx) => {
      if (usedTesseract.has(idx)) return;
      const iou = calculateIoU(gEl.box, tEl.box);
      if (iou > bestIoU && iou >= iouThreshold) {
        bestIoU = iou;
        bestMatch = idx;
      }
    });

    if (bestMatch >= 0) {
      // Match found - use Tesseract's more precise bounding box if preferClientBoxes
      const tEl = tesseractElements[bestMatch];
      usedTesseract.add(bestMatch);
      matchedCount++;

      fused.push({
        ...gEl,
        // Use Tesseract's tighter bounding box for TEXT if preferred
        box: preferClientBoxes ? tEl.box : gEl.box,
        // Keep higher confidence between the two sources
        confidence: Math.max(gEl.confidence ?? 0.8, tEl.confidence ?? 0.8),
        // Prefer Gemini's content (semantic understanding) over Tesseract's raw OCR
        content: gEl.content || tEl.content
      } as SlideTextElement);
    } else {
      // No match - keep Gemini's detection
      fused.push(gEl);
    }
  }

  // Add unmatched Tesseract detections as new elements
  // These might be text that Gemini missed
  let addedFromTesseract = 0;
  tesseractElements.forEach((tEl, idx) => {
    if (!usedTesseract.has(idx)) {
      // Only add if it doesn't overlap significantly with existing elements
      const hasOverlap = fused.some(
        el => el.type === ElementType.TEXT && calculateIoU(el.box, tEl.box) > iouThreshold
      );
      if (!hasOverlap) {
        fused.push({
          ...tEl,
          id: `tesseract-added-${Date.now()}-${idx}`
        });
        addedFromTesseract++;
      }
    }
  });

  const source = tesseractElements.length === 0
    ? 'gemini'
    : matchedCount > 0 || addedFromTesseract > 0
      ? 'fused'
      : 'gemini';

  return {
    elements: fused,
    source,
    stats: {
      geminiCount: geminiElements.length,
      tesseractCount: tesseractElements.length,
      matchedCount,
      addedFromTesseract
    }
  };
};

/**
 * Validates if Tesseract results are usable for fusion
 * Returns false if Tesseract detected too few or too many elements
 */
export const isTesseractResultValid = (
  tesseractElements: SlideTextElement[],
  geminiTextCount: number
): boolean => {
  // If Tesseract found nothing but Gemini found text, Tesseract likely failed
  if (tesseractElements.length === 0 && geminiTextCount > 0) {
    return false;
  }

  // If Tesseract found way more elements than Gemini (10x), likely noise
  if (tesseractElements.length > geminiTextCount * 10 && geminiTextCount > 0) {
    return false;
  }

  return true;
};
