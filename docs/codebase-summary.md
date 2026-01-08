# Codebase Summary

## Project Name

**SlideDeconstruct AI** - AI-powered presentation reverse engineering tool.

## UI Language

All user-facing strings are in **English** (translated from Chinese in Phases 01-03):
- Phase 01: UI components (buttons, labels, tooltips)
- Phase 02: App.tsx main application strings
- Phase 03: Config files, services, and documentation

---

## Directory Structure

```
slidedeconstruct-ai/
├── App.tsx                 # Main application component (980 LOC)
├── index.tsx               # React entry point
├── index.html              # HTML template (lang="en")
├── types.ts                # TypeScript type definitions
├── vite.config.ts          # Vite configuration (English comments)
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── components/             # React UI components
│   ├── CorrectionCanvas.tsx
│   ├── EditorCanvas.tsx
│   ├── LayerList.tsx
│   ├── ReconstructionCanvas.tsx
│   ├── SettingsModal.tsx
│   ├── SlideSidebar.tsx
│   ├── UploadSection.tsx
│   └── VectorLayerList.tsx
├── services/               # Business logic services (English messages)
│   ├── geminiService.ts    # AI provider integration
│   └── fileService.ts      # File processing (English error messages)
├── utils/                  # Utility functions
│   ├── box-validation.ts   # Bounding box validation & deduplication
│   └── box-validation.test.ts # Unit tests (26 tests, 100% coverage)
└── docs/                   # Documentation
```

## Entry Points

| File | Purpose |
|------|---------|
| `index.html` | HTML shell with Tailwind CDN |
| `index.tsx` | React DOM render |
| `App.tsx` | Root component, state management, routing |

---

## Components

### App.tsx (980 LOC)
Main application orchestrator.

**State Management:**
- `slides: SlideWorkspace[]` - All uploaded slides
- `activeSlideId: string | null` - Current selection
- `aiSettings: AISettings` - Provider configuration
- `isProcessing / isExporting` - Loading states

**Key Handlers:**
- `handleFilesSelected()` - Process uploads
- `handleStartAnalysis()` - Trigger AI layout detection
- `handleConfirmCorrection()` - Finalize layout, remove text
- `handleExportPPT()` - Generate .pptx file

---

### CorrectionCanvas.tsx (384 LOC)
Interactive canvas for bounding box correction after AI analysis.

**Features:**
- Drag to move/resize boxes
- Right-click context menu (change type, delete)
- Draw new boxes on empty areas
- Confirm/Cancel actions

**Props:**
```typescript
{
  imageSrc: string;
  elements: (SlideTextElement | SlideVisualElement)[];
  onElementsChange: (elements) => void;
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

### EditorCanvas.tsx (299 LOC)
Main canvas for viewing processed slides with layer controls.

**Features:**
- 5 z-index layers: background, cleaned image, visuals, text, selection
- Erasure mode overlay
- Element selection and dragging

**Props:**
```typescript
{
  imageSrc: string;
  data: SlideAnalysisResult;
  selectedId: string | null;
  visibleLayers: LayerVisibility;
  isErasureMode: boolean;
  erasureBoxes: BoundingBox[];
  onSelect: (id) => void;
  onUpdateElement: (id, box) => void;
  onAddErasureBox: (box) => void;
}
```

---

### LayerList.tsx (270 LOC)
Right panel for layer management and AI actions.

**Features:**
- Toggle layer visibility (text, visual, background)
- Erasure mode toggle
- Per-element actions: refine, modify, delete
- Visual element history navigation

---

### ReconstructionCanvas.tsx (255 LOC)
Canvas for vector mode preview.

**Features:**
- Renders PPT shapes as SVG equivalents
- Shape type mapping (rect, ellipse, arrow, etc.)
- Text overlay rendering
- Fallback image display

---

### SettingsModal.tsx (232 LOC)
Modal for AI provider configuration.

**Features:**
- Provider tabs (Gemini, OpenAI)
- API key, base URL, model name inputs
- Connection test per model type
- Save to localStorage

---

### SlideSidebar.tsx (113 LOC)
Left sidebar for multi-slide navigation.

**Features:**
- Thumbnail grid
- Status indicator per slide
- Add more files button
- Remove slide button

---

### VectorLayerList.tsx (100 LOC)
Right panel for vector mode layer management.

**Features:**
- List shapes, texts, fallback images
- Toggle visibility
- Regenerate vector analysis

---

### UploadSection.tsx (48 LOC)
Drag-and-drop upload zone.

**Features:**
- File input trigger
- Drag-over styling
- Accepts PDF, PNG, JPG

---

## Services

### geminiService.ts (868 LOC)
Dual-provider AI integration layer.

**Exported Functions:**

| Function | Purpose |
|----------|---------|
| `updateSettings(settings)` | Update active AI config |
| `getSettings()` | Get current config |
| `testModel(type, provider, config)` | Test API connection |
| `analyzeLayout(base64Image)` | Step 1: Detect elements |
| `processConfirmedLayout(image, elements, bgColor)` | Step 3: Remove text |
| `removeTextFromImage(image, textElements)` | Surgical text erasure |
| `eraseAreasFromImage(image, boxes)` | Manual region erasure |
| `regenerateVisualElement(image, instruction)` | AI image modification |
| `refineElement(image, instruction)` | Split element into sub-elements |
| `analyzeVisualToVector(image)` | Determine if vectorizable |

**Internal Helpers:**
- `cleanJsonString()` - Strip markdown from JSON
- `tryParseJSON()` - Parse with repair attempts
- `normalizeElement()` - Standardize element format
- `callGeminiWithRetry()` - Rate limit handling
- `callOpenAIChat()` - OpenAI chat completion
- `callOpenAIImageGen()` - OpenAI/DALL-E image generation

---

### fileService.ts (82 LOC)
File upload processing.

**Exported Functions:**

| Function | Purpose |
|----------|---------|
| `processUploadedFiles(files)` | Convert files to base64 images |

**Internal Helpers:**
- `readFileAsBase64()` - File to data URL
- `renderPdfToImages()` - PDF pages to PNG

**PDF Processing:**
- Uses `pdfjs-dist` with web worker
- Renders at 2x scale for quality

---

## Utils

### box-validation.ts (63 LOC)
Bounding box validation and deduplication utilities.

**Exported Functions:**

| Function | Purpose |
|----------|---------|
| `isValidBox(box)` | Validates coordinates (0-100% range, min 0.5% size) |
| `calculateIoU(a, b)` | Calculates Intersection over Union for overlap detection |
| `expandBox(box, padding)` | Expands box by padding % (default 0.5%) |
| `deduplicateElements(elements, threshold)` | Removes duplicates based on IoU threshold (default 0.8) |

**Usage in geminiService.ts:**
- `analyzeLayout()` - validates and deduplicates AI-detected elements
- `removeTextFromImage()` - expands text boxes to ensure complete removal

---

## Key Types (types.ts)

### Element Types
```typescript
enum ElementType { TEXT, VISUAL }

interface BoundingBox {
  top: number;    // 0-100%
  left: number;   // 0-100%
  width: number;  // 0-100%
  height: number; // 0-100%
}

interface SlideTextElement {
  id: string;
  type: ElementType.TEXT;
  content: string;
  box: BoundingBox;
  style: { fontSize, fontWeight, color, alignment };
}

interface SlideVisualElement {
  id: string;
  type: ElementType.VISUAL;
  description: string;
  box: BoundingBox;
  originalBox: BoundingBox;
  customImage?: string;
  history?: string[];
  historyIndex?: number;
}
```

### Processing Types
```typescript
type ProcessingState =
  | 'idle'
  | 'analyzing'
  | 'correcting'
  | 'processing_final'
  | 'complete'
  | 'error';

interface SlideAnalysisResult {
  backgroundColor: string;
  elements: (SlideTextElement | SlideVisualElement)[];
  cleanedImage?: string | null;
}
```

### Workspace Types
```typescript
interface SlideWorkspace {
  id: string;
  name: string;
  originalImage: string;
  thumbnail: string;
  status: ProcessingState;
  slideData: SlideAnalysisResult | null;
  vectorData: ReconstructedSlideResult | null;
  viewMode: 'image' | 'vector';
  visibleLayers: LayerVisibility;
  selectedElementId: string | null;
  isErasureMode: boolean;
  erasureBoxes: BoundingBox[];
}
```

### Vector Types
```typescript
type PPTShapeType =
  | 'rect' | 'roundRect' | 'ellipse' | 'triangle'
  | 'arrowRight' | 'arrowLeft' | 'line' | 'star'
  | 'pentagon' | 'hexagon' | 'diamond' | 'callout';

interface PPTShapeElement {
  id: string;
  type: 'SHAPE';
  shapeType: PPTShapeType;
  box: BoundingBox;
  style: { fillColor, strokeColor, strokeWidth, opacity };
}
```

### Settings Types
```typescript
interface AISettings {
  currentProvider: 'gemini' | 'openai';
  gemini: ProviderConfig;
  openai: ProviderConfig;
}

interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  recognitionModel: string;
  drawingModel: string;
}
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.3 | UI framework |
| react-dom | ^19.2.3 | React DOM renderer |
| @google/genai | ^1.34.0 | Gemini AI SDK |
| pptxgenjs | ^4.0.1 | PPT file generation |
| pdfjs-dist | ^5.4.449 | PDF rendering |
| vite | ^7.3.0 | Build tool (production) |
| typescript | ~5.8.2 | Type checking |
| @vitejs/plugin-react | ^5.1.2 | React plugin for Vite |
| tailwindcss | (CDN) | Styling |
| vitest | (dev) | Unit testing framework |
| @vitest/coverage-v8 | (dev) | Test coverage reporting |

**NPM Scripts:**
- `npm test` - Run unit tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode

*Last verified: January 2026*
