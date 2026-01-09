# Components and Services Analysis Report

**Generated:** 2026-01-08 | **Scout ID:** a97b259

---

## 1. Component Architecture Overview

```
+------------------------------------------------------------------+
|                        App.tsx (Main)                             |
+-------------+---------------------------------+-------------------+
| SlideSidebar|         Canvas Area             |   LayerList/      |
|  (Left)     |  +-------------------------+    | VectorLayerList   |
|             |  | UploadSection (Initial) |    |    (Right)        |
|             |  | CorrectionCanvas (Step2)|    |                   |
|             |  | EditorCanvas (Step3)    |    |                   |
|             |  | ReconstructionCanvas    |    |                   |
|             |  +-------------------------+    |                   |
+-------------+---------------------------------+-------------------+
|                      SettingsModal (Overlay)                      |
+-------------------------------------------------------------------+
```

**Workflow States:**
1. Upload - UploadSection
2. AI Analysis - CorrectionCanvas (manual bbox correction)
3. Editor View - EditorCanvas + LayerList
4. Vector Mode - ReconstructionCanvas + VectorLayerList

---

## 2. Component Details

### 2.1 UploadSection.tsx (48 LOC)
**Purpose:** Initial file upload interface

**Key Features:**
- Drag-drop + click-to-upload UI
- Accepts: image/*, .pdf, .ppt, .pptx
- Multi-file support
- Clipboard paste hint

**Props:**
- onFilesSelected: (files: FileList) => void

---

### 2.2 SlideSidebar.tsx (113 LOC)
**Purpose:** Multi-slide navigation panel (left sidebar)

**Key Features:**
- Thumbnail grid of uploaded slides
- Status indicators (analyzing, correcting, complete, error)
- Page number badges
- Add/remove slide actions
- Processing state handling

---

### 2.3 CorrectionCanvas.tsx (384 LOC)
**Purpose:** Manual bounding box correction after AI analysis (Step 2/3)

**Key Features:**
- Interactive bbox manipulation (move, resize via 4-corner handles)
- Draw new bounding boxes on background click-drag
- Context menu: change type (TEXT/VISUAL), delete element
- Element statistics display (text count, visual count)
- Color-coded elements (blue=text, orange=visual, green=drawing)

---

### 2.4 EditorCanvas.tsx (299 LOC)
**Purpose:** Main editing canvas after confirmation (Step 3)

**Key Features:**
- Layered rendering (background, visuals, text)
- Element drag-to-move
- Erasure mode: draw boxes to mark areas for AI removal
- Uses cleaned image (text removed) as background
- Visual overlap detection for source image selection

**Layer System:**
- z-0: Background (solid color or cleaned image)
- z-10: Visual elements
- z-20: Text elements
- z-40: Erasure overlays
- z-50: Current drawing box

---

### 2.5 ReconstructionCanvas.tsx (255 LOC)
**Purpose:** Vector/editable mode canvas for PPT export

**Key Features:**
- Renders PPT-compatible shapes (SVG-based)
- Shape types: rect, roundRect, ellipse, triangle, line, arrows, star, pentagon, hexagon, diamond, callout
- Drag-to-move for all elements
- Supports fallback images for non-vectorizable elements
- Text layer with style preservation

---

### 2.6 LayerList.tsx (270 LOC)
**Purpose:** Right panel for element/layer management

**Key Features:**
- Global layer toggles (background, text, visual)
- Erasure mode controls
- Per-element visibility toggle
- Selected element actions: Delete, Refine/Split (AI), Modify/Generate (AI)
- Visual element history versions (thumbnails)
- Instruction textarea for AI commands

---

### 2.7 VectorLayerList.tsx (100 LOC)
**Purpose:** Layer panel for vector/reconstruction mode

**Key Features:**
- Unified list: shapes + images + texts
- Regenerate vector button for shapes/images
- Visibility toggle per element
- Shape type display

---

### 2.8 SettingsModal.tsx (232 LOC)
**Purpose:** AI service configuration UI

**Key Features:**
- Provider selection: Gemini / OpenAI
- Tab-based config (Gemini settings, OpenAI settings)
- Fields: API Key, Base URL, Recognition Model, Drawing Model
- Per-model test buttons with status
- Calls testModel() from geminiService

---

## 3. Service Layer

### 3.1 fileService.ts (82 LOC)
**Purpose:** File upload processing

| Function | Description |
|----------|-------------|
| processUploadedFiles(files) | Main entry, routes by file type |
| readFileAsBase64(file) | Convert file to base64 data URL |
| renderPdfToImages(file) | PDF to PNG images via pdf.js |

**Supported Types:**
- application/pdf - Multi-page render at 2x scale
- image/* - Direct base64 conversion
- .ppt/.pptx - Error (requires PDF conversion)

---

### 3.2 geminiService.ts (868 LOC)
**Purpose:** AI integration layer (Gemini + OpenAI compatible)

#### Core AI Functions

| Function | Purpose | Model |
|----------|---------|-------|
| analyzeLayout(base64) | Step 1: Detect elements + bboxes | Recognition |
| processConfirmedLayout(base64, elements, bgColor) | Step 3: Generate cleaned background | Drawing |
| removeTextFromImage(base64, textElements) | Inpaint text areas | Drawing |
| eraseAreasFromImage(base64, boxes) | User-defined area removal | Drawing |
| regenerateVisualElement(base64, instruction) | Modify visual with prompt | Drawing |
| refineElement(base64, instruction) | Split/detect sub-elements | Recognition |
| analyzeVisualToVector(base64) | Determine if vectorizable | Recognition |
| testModel(type, provider, config) | Test API connectivity | Both |

#### Provider Abstraction

**Gemini (Native SDK):**
- Uses @google/genai SDK
- JSON schema validation via responseSchema
- Safety settings: BLOCK_NONE for all categories

**OpenAI Compatible:**
- REST API calls to /chat/completions, /images/generations
- Supports Gemini-via-OpenAI proxy
- JSON mode via response_format

#### Helper Functions
- cleanJsonString() - Strip markdown, extract JSON
- tryParseJSON() - Parse with auto-repair
- normalizeElement() - Standardize bbox format
- callGeminiWithRetry() - Exponential backoff for 429

---

## 4. Data Flow

```
UploadSection --> fileService.processUploadedFiles() --> base64[]
     |
     v
App.tsx (SlideWorkspace state)
     |
     v
geminiService.analyzeLayout() --> elements[]
     |
     v
CorrectionCanvas (user edits bboxes)
     |
     v
geminiService.processConfirmedLayout() --> cleanedImage
     |
     v
EditorCanvas + LayerList (user actions)
     |
     v
geminiService (regenerate, refine, erase)
```

---

## 5. Summary Table

| Component | LOC | Role | AI Dependency |
|-----------|-----|------|---------------|
| CorrectionCanvas | 384 | Bbox editor | None |
| EditorCanvas | 299 | Main canvas | Indirect |
| LayerList | 270 | Layer panel | Triggers AI |
| ReconstructionCanvas | 255 | Vector canvas | None |
| SettingsModal | 232 | Config UI | testModel() |
| SlideSidebar | 113 | Navigation | None |
| VectorLayerList | 100 | Vector layers | Triggers AI |
| UploadSection | 48 | Upload UI | None |
| geminiService | 868 | AI core | Primary |
| fileService | 82 | File processing | None |

---

## Unresolved Questions

1. Where is types.ts located? (Referenced but not in task file list)
2. How does App.tsx orchestrate the workflow states?
3. Is there a PPT export function? (ReconstructionCanvas implies PPT output)
