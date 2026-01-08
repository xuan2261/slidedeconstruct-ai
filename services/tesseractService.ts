import Tesseract from 'tesseract.js';
import { SlideTextElement, ElementType } from '../types';

let worker: Tesseract.Worker | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize Tesseract worker with English language support
 * Lazy-loaded on first use to minimize initial bundle impact
 * Uses Promise-based lock to prevent race conditions
 */
export const initTesseract = async (): Promise<void> => {
  if (worker) return;

  // Use Promise-based lock instead of busy-wait
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      worker = await Tesseract.createWorker('eng');
    } catch (error) {
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
};

/**
 * Get image dimensions from base64 string
 */
const getImageDimensionsFromBase64 = (base64: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
  });
};

/**
 * Extract text bounding boxes from image using Tesseract OCR
 * Returns detected text elements with positions in percentage coordinates (0-100)
 */
export const extractTextBoxes = async (
  imageBase64: string
): Promise<SlideTextElement[]> => {
  await initTesseract();

  // Explicit null check after initialization
  if (!worker) {
    throw new Error('Tesseract worker failed to initialize');
  }

  // Ensure base64 has proper data URL prefix for Tesseract
  const imageData = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/png;base64,${imageBase64}`;

  // Get image dimensions separately since Tesseract.js Page type doesn't expose them directly
  const dims = await getImageDimensionsFromBase64(imageData);

  const { data } = await worker.recognize(imageData);

  // Group words into lines for better bounding boxes
  const lines = data.lines || [];

  return lines
    .filter(line => line.confidence > 60 && line.text.trim().length > 0)
    .map((line, index) => ({
      id: `tesseract-${Date.now()}-${index}`,
      type: ElementType.TEXT,
      content: line.text.trim(),
      confidence: line.confidence / 100,
      box: {
        top: (line.bbox.y0 / dims.height) * 100,
        left: (line.bbox.x0 / dims.width) * 100,
        width: ((line.bbox.x1 - line.bbox.x0) / dims.width) * 100,
        height: ((line.bbox.y1 - line.bbox.y0) / dims.height) * 100
      },
      style: {
        fontSize: inferFontSize(line.bbox.y1 - line.bbox.y0, dims.height),
        fontWeight: 'normal' as const,
        color: '#000000',
        alignment: 'left' as const
      }
    }));
};

/**
 * Infer font size category based on text height relative to image
 */
const inferFontSize = (heightPx: number, imageHeight: number): 'small' | 'medium' | 'large' | 'title' => {
  const heightPercent = (heightPx / imageHeight) * 100;
  if (heightPercent > 8) return 'title';
  if (heightPercent > 5) return 'large';
  if (heightPercent > 3) return 'medium';
  return 'small';
};

/**
 * Terminate Tesseract worker to free resources
 * Call when hybrid detection is disabled or app cleanup
 */
export const terminateTesseract = async (): Promise<void> => {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
};

/**
 * Check if Tesseract worker is ready
 */
export const isTesseractReady = (): boolean => worker !== null;
