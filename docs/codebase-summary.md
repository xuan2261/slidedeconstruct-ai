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
├── vite.config.ts          # Vite configuration
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
├── services/               # Business logic services
│   ├── geminiService.ts    # AI provider integration (supports hybrid detection)
│   ├── tesseractService.ts # Tesseract.js OCR worker management
│   └── fileService.ts      # File processing
├── utils/                  # Utility functions
│   ├── box-validation.ts   # Bounding box validation & deduplication
│   ├── box-validation.test.ts # Unit tests (26 tests)
│   ├── detection-fusion.ts # Gemini + Tesseract detection fusion
│   └── detection-fusion.test.ts # Fusion unit tests (15 tests)
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

### SettingsModal.tsx
Modal for AI provider configuration.

**Features:**
- Provider tabs (Gemini, OpenAI, Anthropic) with accessibility (role="tab", aria-selected)
- Per-task provider dropdowns: Recognition provider, Drawing provider
- API key, base URL, model name inputs per provider
- Connection test per model type
- Hybrid detection settings (beta) - Phase 4
- Save to localStorage

**Phase 3 Updates:**
- Added Anthropic tab
- Per-task provider selection (Recognition/Drawing tasks)
- Improved accessibility attributes
- Uses shared `ProviderType` from types.ts

---

## Services

### geminiService.ts
Multi-provider AI integration layer (Gemini, OpenAI, Anthropic) with optional hybrid detection.

**Exported Functions:**

| Function | Purpose |
|----------|---------|
| `updateSettings(settings)` | Update active AI config |
| `getSettings()` | Get current config |
| `testModel(type, provider, config)` | Test API connection (supports Anthropic) |
| `analyzeLayout(base64Image)` | Detect elements (optionally fuses with Tesseract) |
| `processConfirmedLayout(image, elements, bgColor)` | Remove text |
| `removeTextFromImage(image, textElements)` | Surgical text erasure |
| `eraseAreasFromImage(image, boxes)` | Manual region erasure |
| `regenerateVisualElement(image, instruction)` | AI image modification |
| `refineElement(image, instruction)` | Split element into sub-elements |
| `analyzeVisualToVector(image)` | Determine if vectorizable |

**Internal Helpers (Anthropic):**

| Function | Purpose |
|----------|---------|
| `getAnthropicClient(config?)` | Create Anthropic SDK client (warns on non-localhost proxy) |
| `callAnthropicWithRetry(fn, retries, delay)` | Retry wrapper for rate limits |
| `callAnthropicChat(system, user, image?, model?)` | Text/vision requests via Anthropic |
| `getRecognitionProvider()` | Route to recognition provider |
| `getDrawingProvider()` | Route to drawing provider |

---

### tesseractService.ts (119 LOC)
Tesseract.js OCR worker management for hybrid detection (Phase 4).

**Exported Functions:**

| Function | Purpose |
|----------|---------|
| `initTesseract()` | Lazy-load Tesseract worker (~15MB on first use) |
| `extractTextBoxes(imageBase64)` | OCR text detection with bounding boxes |
| `terminateTesseract()` | Clean up worker resources |
| `isTesseractReady()` | Check worker initialization status |

**Features:**
- Promise-based lock prevents race conditions
- Returns percentage coordinates (0-100%)
- Filters low-confidence results (< 60%)

---

### fileService.ts (82 LOC)
File upload processing.

| Function | Purpose |
|----------|---------|
| `processUploadedFiles(files)` | Convert files to base64 images |

---

## Utils

### box-validation.ts (63 LOC)
Bounding box validation and deduplication utilities.

| Function | Purpose |
|----------|---------|
| `isValidBox(box)` | Validates coordinates (0-100% range, min 0.5% size) |
| `calculateIoU(a, b)` | Calculates Intersection over Union for overlap detection |
| `expandBox(box, padding)` | Expands box by padding % (default 0.5%) |
| `deduplicateElements(elements, threshold)` | Removes duplicates based on IoU threshold (default 0.8) |

---

### detection-fusion.ts (145 LOC)
Fusion logic for hybrid detection - Gemini + Tesseract (Phase 4).

| Function | Purpose |
|----------|---------|
| `fuseDetections(gemini, tesseract, options)` | Merge detections using IoU matching |
| `isTesseractResultValid(tesseract, geminiCount)` | Validate Tesseract results before fusion |

**Fusion Strategy:**
- Keep all VISUAL elements from Gemini (Tesseract only detects text)
- For TEXT elements, prefer Tesseract bounding boxes when IoU match found
- Add unmatched Tesseract detections as new elements
- Default IoU threshold: 0.3

---

## Key Types (types.ts)

### Hybrid Detection Settings (Phase 4)
```typescript
interface HybridDetectionSettings {
  enabled: boolean;           // Master toggle (default: false)
  useTesseract: boolean;      // Use Tesseract.js for text validation
  preferClientBoxes: boolean; // Prefer Tesseract boxes over Gemini
}
```

### Settings Types
```typescript
interface AISettings {
  currentProvider: ProviderType;           // Deprecated, use per-task providers
  recognitionProvider: ProviderType;       // Provider for layout/text detection
  drawingProvider: ProviderType;           // Provider for inpainting/generation
  gemini: ProviderConfig;
  openai: ProviderConfig;
  anthropic: ProviderConfig;               // Phase 2: Anthropic integration
  confidenceThreshold: number;             // 0-1, filter low-confidence elements
  enableMultiPassInpainting: boolean;      // 2-pass inpainting
  hybridDetection: HybridDetectionSettings; // Phase 4
}

type ProviderType = 'gemini' | 'openai' | 'anthropic';
```

### Element Types
```typescript
interface SlideTextElement {
  id: string;
  type: ElementType.TEXT;
  content: string;
  box: BoundingBox;
  style: { fontSize, fontWeight, color, alignment };
  confidence?: number; // 0-1
}

interface SlideVisualElement {
  id: string;
  type: ElementType.VISUAL;
  description: string;
  box: BoundingBox;
  originalBox: BoundingBox;
  confidence?: number; // 0-1
  customImage?: string;
  history?: string[];
  historyIndex?: number;
}
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.3 | UI framework |
| react-dom | ^19.2.3 | React DOM renderer |
| @google/genai | ^1.34.0 | Gemini AI SDK |
| @anthropic-ai/sdk | ^x.x.x | Anthropic Claude SDK |
| tesseract.js | ^6.x | Client-side OCR (hybrid detection) |
| pptxgenjs | ^4.0.1 | PPT file generation |
| pdfjs-dist | ^5.4.449 | PDF rendering |
| vite | ^7.3.0 | Build tool |
| typescript | ~5.8.2 | Type checking |
| vitest | (dev) | Unit testing (41 tests total) |

**NPM Scripts:**
- `npm test` - Run unit tests
- `npm run test:coverage` - Run tests with coverage report

*Last verified: January 2026*
