import { BoundingBox } from '../types';

/**
 * Validates if a bounding box has valid coordinates (0-100% range)
 * and minimum size requirements (0.5% width/height)
 */
export const isValidBox = (box: BoundingBox): boolean => (
  box.top >= 0 && box.top <= 100 &&
  box.left >= 0 && box.left <= 100 &&
  box.width > 0.5 && box.width <= 100 &&
  box.height > 0.5 && box.height <= 100 &&
  box.top + box.height <= 100 &&
  box.left + box.width <= 100
);

/**
 * Calculates Intersection over Union (IoU) between two bounding boxes
 * Used for detecting duplicate/overlapping elements
 */
export const calculateIoU = (a: BoundingBox, b: BoundingBox): number => {
  const x1 = Math.max(a.left, b.left);
  const y1 = Math.max(a.top, b.top);
  const x2 = Math.min(a.left + a.width, b.left + b.width);
  const y2 = Math.min(a.top + a.height, b.top + b.height);

  if (x2 <= x1 || y2 <= y1) return 0;

  const intersection = (x2 - x1) * (y2 - y1);
  const areaA = a.width * a.height;
  const areaB = b.width * b.height;
  const union = areaA + areaB - intersection;

  return intersection / union;
};

/**
 * Expands a bounding box by a fixed padding percentage
 * Used to ensure text shadows/edges are included in removal
 */
export const expandBox = (box: BoundingBox, padding = 0.5): BoundingBox => ({
  top: Math.max(0, box.top - padding),
  left: Math.max(0, box.left - padding),
  width: Math.min(100 - Math.max(0, box.left - padding), box.width + padding * 2),
  height: Math.min(100 - Math.max(0, box.top - padding), box.height + padding * 2)
});

/**
 * Removes duplicate elements based on IoU threshold
 * Keeps the first occurrence when overlap exceeds threshold
 */
export const deduplicateElements = <T extends { box: BoundingBox }>(
  elements: T[],
  threshold = 0.8
): T[] => {
  const kept: T[] = [];
  for (const el of elements) {
    if (!kept.some(k => calculateIoU(el.box, k.box) > threshold)) {
      kept.push(el);
    }
  }
  return kept;
};
