
export enum ElementType {
  TEXT = 'TEXT',
  VISUAL = 'VISUAL',
}

export interface BoundingBox {
  top: number; // Percentage 0-100 (relative to PPT slide area)
  left: number; // Percentage 0-100
  width: number; // Percentage 0-100
  height: number; // Percentage 0-100
}

export interface SlideTextElement {
  id: string;
  type: ElementType.TEXT;
  content: string; // Text content (markdown/latex)
  box: BoundingBox;
  style: {
    fontSize: 'small' | 'medium' | 'large' | 'title';
    fontWeight: 'normal' | 'bold';
    color: string; // Approximate hex
    alignment: 'left' | 'center' | 'right';
  };
  confidence?: number; // 0-1, AI confidence in detection accuracy
  isHidden?: boolean;
}

export interface SlideVisualElement {
  id: string;
  type: ElementType.VISUAL;
  description: string;
  box: BoundingBox;
  originalBox: BoundingBox; // The original position for correct background cropping
  confidence?: number; // 0-1, AI confidence in detection accuracy
  isHidden?: boolean;
  customImage?: string; // Base64 of currently active image
  originalId?: string; // Link back to original element for regeneration

  // History Management
  history?: string[]; // Array of base64 strings representing versions
  historyIndex?: number; // Current active index in history
}

export interface SlideAnalysisResult {
  backgroundColor: string;
  elements: (SlideTextElement | SlideVisualElement)[];
  cleanedImage?: string | null; // Base64 of image with text removed
  rawResponse?: string; // For debugging
}

// Updated state to include 'correcting'
export type ProcessingState = 'idle' | 'analyzing' | 'correcting' | 'processing_final' | 'complete' | 'error';

export interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  recognitionModel: string;
  drawingModel: string;
}

export interface HybridDetectionSettings {
  enabled: boolean; // Master toggle for hybrid detection
  useTesseract: boolean; // Use Tesseract.js for text box validation
  preferClientBoxes: boolean; // Prefer Tesseract boxes over Gemini for TEXT elements
}

export interface AISettings {
  currentProvider: 'gemini' | 'openai';
  gemini: ProviderConfig;
  openai: ProviderConfig;
  confidenceThreshold: number; // 0-1, filter elements below this confidence
  enableMultiPassInpainting: boolean; // Enable 2-pass inpainting for higher quality (doubles API cost)
  hybridDetection: HybridDetectionSettings; // Hybrid detection settings
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  currentProvider: 'gemini',
  gemini: {
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com',
    recognitionModel: 'gemini-3-pro-preview',
    drawingModel: 'gemini-2.5-flash-image',
  },
  openai: {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    recognitionModel: 'gpt-4o',
    drawingModel: 'dall-e-3',
  },
  confidenceThreshold: 0.6,
  enableMultiPassInpainting: true, // Default enabled for best quality
  hybridDetection: {
    enabled: false, // Disabled by default (optional enhancement)
    useTesseract: true, // Use Tesseract when hybrid enabled
    preferClientBoxes: true, // Prefer Tesseract's tighter boxes for text
  },
};

// --- Vector / Reconstructed Types ---

// Expanded shape types
export type PPTShapeType = 
  | 'rect' 
  | 'roundRect' 
  | 'ellipse' 
  | 'triangle' 
  | 'arrowRight' 
  | 'arrowLeft'
  | 'line' 
  | 'star'
  | 'pentagon'
  | 'hexagon'
  | 'diamond'
  | 'callout';

export interface PPTShapeElement {
  id: string;
  type: 'SHAPE';
  shapeType: PPTShapeType;
  box: BoundingBox;
  style: {
    fillColor: string; // Hex or 'transparent'
    strokeColor: string; // Hex
    strokeWidth: number; // pt
    opacity: number; // 0-1
  };
  text?: string; // Optional text content attached to shape
  isHidden?: boolean;
  originalId?: string; // Link back to original visual element
}

export interface ReconstructedSlideResult {
  backgroundColor: string;
  shapes: PPTShapeElement[];
  // We reuse SlideTextElement for standalone text that didn't merge into shapes
  texts: SlideTextElement[]; 
  // Visual elements that couldn't be vectorized (fallback to image)
  images: SlideVisualElement[];
}

export interface LayerVisibility {
  text: boolean;
  visual: boolean;
  background: boolean;
}

// --- NEW: Multi-Slide Workspace Types ---

export interface SlideWorkspace {
  id: string;
  name: string;
  originalImage: string; // Base64 source
  thumbnail: string;     // Small Base64 for sidebar
  
  // Per-slide processing state
  status: ProcessingState;
  errorDetails?: { message: string; raw?: string } | null;
  
  // Data
  slideData: SlideAnalysisResult | null;
  vectorData: ReconstructedSlideResult | null;
  
  // UI State
  viewMode: 'image' | 'vector';
  visibleLayers: LayerVisibility;
  selectedElementId: string | null;
  
  // Erasure State
  isErasureMode: boolean;
  erasureBoxes: BoundingBox[];
}