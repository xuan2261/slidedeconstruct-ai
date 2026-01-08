# System Architecture

## Overview

SlideDeconstruct AI is a **pure client-side** React application that uses AI vision APIs to deconstruct PPT screenshots into editable layers.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      React App                             │  │
│  │  ┌─────────┐  ┌─────────────┐  ┌───────────────────────┐  │  │
│  │  │ Upload  │─▶│  Services   │─▶│  AI Provider APIs     │  │  │
│  │  │ Section │  │             │  │  (Gemini / OpenAI)    │  │  │
│  │  └─────────┘  └─────────────┘  └───────────────────────┘  │  │
│  │       │              │                    │                │  │
│  │       ▼              ▼                    ▼                │  │
│  │  ┌─────────┐  ┌─────────────┐  ┌───────────────────────┐  │  │
│  │  │ Canvas  │◀─│    State    │◀─│   AI Response         │  │  │
│  │  │ Views   │  │  (App.tsx)  │  │   (JSON + Images)     │  │  │
│  │  └─────────┘  └─────────────┘  └───────────────────────┘  │  │
│  │       │                                                    │  │
│  │       ▼                                                    │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │                  pptxgenjs                           │  │  │
│  │  │              (Export to .pptx)                       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

```
App.tsx (Root)
├── SettingsModal
├── SlideSidebar
│   └── Thumbnail list
└── Main Content
    ├── UploadSection (when no slides)
    └── Active Slide View
        ├── CorrectionCanvas (status: correcting)
        ├── EditorCanvas + LayerList (status: complete, mode: image)
        └── ReconstructionCanvas + VectorLayerList (status: complete, mode: vector)
```

### Component Responsibilities

| Component | Role |
|-----------|------|
| App.tsx | State management, orchestration, export logic |
| SlideSidebar | Multi-slide navigation, add/remove slides |
| UploadSection | File drag-drop, triggers file processing |
| CorrectionCanvas | Bounding box editing before final processing |
| EditorCanvas | Display processed slide, element selection, erasure |
| LayerList | Layer visibility, AI actions (refine, modify) |
| ReconstructionCanvas | Vector mode preview with SVG shapes |
| VectorLayerList | Vector layer management |
| SettingsModal | API configuration UI |

---

## Data Flow

### Upload Flow

```
User drops file
       │
       ▼
┌──────────────────┐
│  fileService.ts  │
│  processUploads  │
└────────┬─────────┘
         │
         ▼
    PDF? ──Yes──▶ pdfjs-dist ──▶ PNG per page
         │
         No (Image)
         │
         ▼
    FileReader.readAsDataURL
         │
         ▼
┌──────────────────┐
│  SlideWorkspace  │
│  {id, name,      │
│   originalImage, │
│   status: idle}  │
└──────────────────┘
         │
         ▼
    Added to slides[]
```

### Processing Pipeline

```
┌───────────┐     ┌────────────┐     ┌─────────────┐     ┌──────────┐
│   idle    │────▶│ analyzing  │────▶│ correcting  │────▶│processing│
│           │     │            │     │             │     │  _final  │
└───────────┘     └────────────┘     └─────────────┘     └──────────┘
                        │                   │                  │
                        ▼                   ▼                  ▼
                  analyzeLayout()     User edits        processConfirmed
                  returns elements    bounding boxes    Layout() removes
                  + backgroundColor                     text from image
                                                              │
                                                              ▼
                                                       ┌──────────┐
                                                       │ complete │
                                                       │ or error │
                                                       └──────────┘
```

### State Transitions

| Current State | Trigger | Next State |
|---------------|---------|------------|
| idle | Click "Analyze Layout" | analyzing |
| analyzing | AI returns layout | correcting |
| analyzing | AI error | error |
| correcting | Click "Confirm" | processing_final |
| correcting | Click "Cancel" | (slide removed) |
| processing_final | Text removal done | complete |
| processing_final | Text removal error | error |
| error | Click "Retry" | analyzing |
| complete | (stable) | complete |

---

## AI Integration Architecture

### Multi-Provider Support (Tri-Provider Architecture)

The system supports **per-task provider selection** - different providers for recognition vs drawing tasks.

```
┌──────────────────────────────────────────────────────────────────┐
│                      AI Provider Layer                            │
│                                                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐ │
│  │ Gemini Path   │  │ OpenAI Path   │  │ Anthropic Path        │ │
│  │               │  │               │  │                       │ │
│  │ GoogleGenAI   │  │ fetch() REST  │  │ Anthropic SDK         │ │
│  │ SDK           │  │ /completions  │  │ via proxy (localhost) │ │
│  └───────┬───────┘  └───────┬───────┘  └───────────┬───────────┘ │
│          │                  │                      │              │
│          └──────────────────┼──────────────────────┘              │
│                             ▼                                     │
│              recognitionProvider → Recognition tasks              │
│              drawingProvider     → Drawing/inpainting tasks       │
└──────────────────────────────────────────────────────────────────┘
```

**ProviderType**: `'gemini' | 'openai' | 'anthropic'`

| Field | Purpose |
|-------|---------|
| `recognitionProvider` | Provider for layout analysis, text detection, vector analysis |
| `drawingProvider` | Provider for inpainting, text removal, image generation |
| `currentProvider` | **Deprecated** - kept for backward compat via `migrateSettings()` |

### Anthropic Integration Details (Phase 2)

| Component | Implementation |
|-----------|----------------|
| Client | `@anthropic-ai/sdk` with `dangerouslyAllowBrowser: true` |
| Base URL | Default: `http://127.0.0.1:8045` (localhost proxy) |
| Security | Warns on non-localhost URLs (API key exposure risk) |
| Retry | `callAnthropicWithRetry()` - 3 retries, exponential backoff |
| Vision | Image-first content ordering for vision requests |
| Image Gen | Depends on proxy capabilities (native API doesn't support) |

### AI Function Mapping

| Function | Recognition Model | Drawing Model |
|----------|-------------------|---------------|
| analyzeLayout | Yes | No |
| processConfirmedLayout | No | Yes |
| removeTextFromImage | No | Yes |
| eraseAreasFromImage | No | Yes |
| regenerateVisualElement | No | Yes |
| refineElement | Yes | No |
| analyzeVisualToVector | Yes | No |
| testModel | Yes | Yes |

### Request/Response Flow

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  Base64      │────▶│  AI Prompt    │────▶│  API Call    │
│  Image       │     │  + Schema     │     │  (retry x3)  │
└──────────────┘     └───────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│ Normalized   │◀────│ Parse + Clean │◀────│ JSON/Image   │
│ Elements     │     │ JSON Response │     │ Response     │
└──────────────┘     └───────────────┘     └──────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│              Validation Layer (box-validation.ts)         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │ isValidBox  │  │calculateIoU│  │deduplicateElements│  │
│  │ (0-100%,    │  │ (overlap   │  │ (IoU > 0.8       │  │
│  │  min 0.5%)  │  │  detection)│  │  = duplicate)    │  │
│  └─────────────┘  └─────────────┘  └──────────────────┘  │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────┐
│ Valid, Unique│
│ Elements     │
└──────────────┘
```

### Validation Layer

The `utils/box-validation.ts` module provides post-processing for AI responses:

| Function | Purpose | Applied In |
|----------|---------|------------|
| `isValidBox()` | Filters invalid coordinates (outside 0-100%, too small) | `analyzeLayout()` |
| `calculateIoU()` | Measures overlap between two boxes | `deduplicateElements()` |
| `deduplicateElements()` | Removes near-duplicate detections (IoU > 0.8) | `analyzeLayout()` |
| `expandBox()` | Adds padding to ensure complete text removal | `removeTextFromImage()` |

---

## State Management

### Global State (App.tsx)

```typescript
// Slide collection
slides: SlideWorkspace[]
activeSlideId: string | null

// UI state
isProcessing: boolean
isExporting: boolean
isSettingsOpen: boolean

// Configuration
aiSettings: AISettings  // Loaded via migrateSettings() for backward compat
isDarkMode: boolean
```

### Per-Slide State (SlideWorkspace)

```typescript
{
  id: string
  name: string
  originalImage: string      // Source image
  thumbnail: string          // Sidebar preview

  status: ProcessingState    // Current pipeline stage
  errorDetails?: object      // Error info if failed

  slideData: SlideAnalysisResult | null   // Image mode data
  vectorData: ReconstructedSlideResult | null  // Vector mode data

  viewMode: 'image' | 'vector'
  visibleLayers: LayerVisibility
  selectedElementId: string | null

  isErasureMode: boolean
  erasureBoxes: BoundingBox[]
}
```

### State Update Pattern

```
User Action
     │
     ▼
Event Handler (App.tsx)
     │
     ▼
updateActiveSlide({ key: value })
     │
     ▼
setSlides(prev => prev.map(...))
     │
     ▼
React re-renders affected components
```

---

## Export Architecture

### PPT Generation Flow

```
┌─────────────┐
│ Export Call │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ For each slide in selection:         │
│   ├─ Get viewMode (image/vector)     │
│   ├─ Get visibleLayers               │
│   │                                   │
│   ├─ Image Mode:                      │
│   │   ├─ Add background (cleaned)    │
│   │   ├─ Add visible visuals         │
│   │   └─ Add visible text            │
│   │                                   │
│   └─ Vector Mode:                     │
│       ├─ Add background color        │
│       ├─ Add shapes (pptx.addShape)  │
│       ├─ Add fallback images         │
│       └─ Add text elements           │
└──────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│ pptxgenjs   │
│ writeFile() │
└──────┬──────┘
       │
       ▼
   .pptx download
```

### Shape Type Mapping

| App Shape | PptxGenJS Shape |
|-----------|-----------------|
| rect | ShapeType.rect |
| roundRect | ShapeType.roundRect |
| ellipse | ShapeType.ellipse |
| triangle | ShapeType.triangle |
| arrowRight | ShapeType.rightArrow |
| arrowLeft | ShapeType.leftArrow |
| line | ShapeType.line |
| star | ShapeType.star5 |
| pentagon | ShapeType.pentagon |
| hexagon | ShapeType.hexagon |
| diamond | ShapeType.diamond |
| callout | ShapeType.callout1 |

---

## Canvas Layer System

### EditorCanvas Z-Index Stack

```
┌─────────────────────────────┐  z-50: Selection overlay
├─────────────────────────────┤  z-40: Erasure boxes
├─────────────────────────────┤  z-30: Text elements
├─────────────────────────────┤  z-20: Visual elements
├─────────────────────────────┤  z-10: Cleaned background
└─────────────────────────────┘  z-0:  Original image
```

### Layer Visibility Control

```typescript
interface LayerVisibility {
  text: boolean;      // Show/hide text layer
  visual: boolean;    // Show/hide visual layer
  background: boolean; // Show cleaned vs original
}
```

---

## Error Handling Strategy

### Levels

| Level | Handler | User Feedback |
|-------|---------|---------------|
| API Error | try/catch in service | Status: error, retry button |
| Parse Error | tryParseJSON fallback | Logs warning, attempts repair |
| Rate Limit | callGeminiWithRetry | Auto-retry with backoff |
| File Error | processUploadedFiles | Alert with message |
| Export Error | handleExportPPT | Alert with message |

### Fallback Behaviors

| Scenario | Fallback |
|----------|----------|
| Text removal fails | Use original image as background |
| Vector analysis fails | Treat as image element |
| JSON truncated | Attempt repair, add missing brackets |
| Crop fails | Return 1x1 transparent pixel |

---

## Security Considerations

### API Key Storage

- Stored in localStorage (client-side only)
- Never transmitted except to configured API endpoints
- No server-side storage or logging

### Content Security

- All processing happens in browser
- Images stay as base64 data URLs
- No external image hosting

### Input Validation

- File type checking before processing
- PPTX files rejected with user guidance
- Malformed JSON handled gracefully

---

## Performance Considerations

### Optimizations

| Technique | Location | Benefit |
|-----------|----------|---------|
| Chunked processing | handleGenerateVectors | Limits concurrent API calls |
| Image reuse | thumbnail = originalImage | Avoids resize overhead |
| Lazy vectorization | On-demand per element | Reduces initial load |
| Rate limit retry | callGeminiWithRetry | Handles quota gracefully |

### Bottlenecks

| Operation | Typical Time | Cause |
|-----------|--------------|-------|
| Layout analysis | 5-15s | AI inference |
| Text removal | 10-30s | Image generation |
| Vector analysis | 3-8s per element | AI inference |
| PDF rendering | 1-3s per page | Canvas operations |

---

## Internationalization (i18n)

### Current Status
- **UI Language**: English (fully translated from Chinese, Jan 2026)
- **Translation Scope**: All user-facing strings in components, App.tsx, config files
- **No i18n Framework**: Strings are hardcoded in English (no dynamic language switching)

### Affected Files
- `components/*.tsx` - Button labels, tooltips, status messages
- `App.tsx` - Main application strings
- `services/*.ts` - Error messages, console logs
- `vite.config.ts` - Code comments
