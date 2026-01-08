# Project Overview - SlideDeconstruct AI

## Project Information

| Field | Value |
|-------|-------|
| Name | SlideDeconstruct AI |
| Version | 1.0.0 |
| Year | 2026 |
| License | MIT |
| Author | yyy-OPS |

## Problem Statement

AI-generated PPT tools (e.g., Nanobanana, banana-slides) produce visually stunning slides but output **static images**. Users cannot:
- Edit text content after generation
- Adjust icon positions or colors
- Modify individual elements without regenerating entire slides

This creates an "easy to generate, hard to edit" problem that limits practical usability.

## Solution

SlideDeconstruct AI uses AI vision models (Gemini/OpenAI) to reverse-engineer static PPT screenshots into **editable layers**:
1. **Text Layer** - Extracted text with position, style, and content
2. **Visual Layer** - Icons, shapes, images with bounding boxes
3. **Background Layer** - Clean background with text surgically removed

The result exports as a fully editable `.pptx` file.

## Target Users

| User Type | Use Case |
|-----------|----------|
| Designers | Edit AI-generated PPT templates |
| Educators | Modify presentation materials |
| Business Users | Customize slide decks |
| Developers | Integrate PPT processing in workflows |

## Core Features

### 1. Multi-Format Upload
- PDF (converted to PNG per page)
- PNG/JPG images
- Drag-drop or paste from clipboard

### 2. AI Layout Analysis
- Detects text blocks with content, position, style
- Identifies visual elements (icons, shapes, images)
- Extracts dominant background color

### 3. Smart Text Removal (Advanced Inpainting)
- **Mask-Based Inpainting**: Binary mask (black=keep, white=remove) for precise text removal
- **Multi-Pass Processing**: Pass 1 coarse removal, Pass 2 edge refinement
- **Validation**: Checks result size, dimensions, and actual changes
- AI repairs background texture/color seamlessly
- Preserves visual elements untouched

### 4. Human Correction Workflow
- Interactive canvas for bounding box adjustment
- Right-click to change element type (TEXT/VISUAL)
- Drag to resize or create new boxes

### 5. Manual Erasure Mode
- User-defined regions for AI removal
- Snapshots visual elements before background changes

### 6. Vector Conversion (Beta)
- Analyzes visual elements for simple shapes
- Converts to native PPT shapes (rect, ellipse, arrow, etc.)
- Falls back to image for complex graphics

### 7. Element History
- Undo/redo for visual element modifications
- Version tracking per element

### 8. PPT Export
- Single page or batch export
- Preserves layer visibility settings
- Supports both Image Mode and Vector Mode

### 9. Multi-Provider Support
- Google Gemini (native SDK)
- OpenAI-compatible APIs (GPT-4o, DALL-E)
- Gemini via OpenAI proxy

---

## Product Development Requirements (PDR)

### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Upload PDF/PNG/JPG files | High | Done |
| FR-02 | AI layout analysis with bounding boxes | High | Done |
| FR-03 | Human correction interface | High | Done |
| FR-04 | Text removal from background (mask-based inpainting) | High | Done |
| FR-04a | Multi-pass inpainting with validation | High | Done |
| FR-05 | Manual erasure mode | Medium | Done |
| FR-06 | Vector shape conversion | Medium | Beta |
| FR-07 | Export to .pptx | High | Done |
| FR-08 | Multi-slide workspace | High | Done |
| FR-09 | Element history (undo/redo) | Medium | Done |
| FR-10 | Settings modal for API config | High | Done |
| FR-11 | Dark mode toggle | Low | Done |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Browser compatibility | Chrome, Edge, Firefox |
| NFR-02 | Response time for AI calls | < 30s per operation |
| NFR-03 | Export file size | Reasonable for slides |
| NFR-04 | No backend required | Pure frontend |
| NFR-05 | API key security | localStorage only |

### Technical Constraints

- **No Server**: Pure client-side application
- **API Dependency**: Requires Gemini or OpenAI API key
- **PPTX Input**: Not supported (must convert to PDF first)
- **Session Persistence**: Not implemented (data lost on refresh)

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `confidenceThreshold` | number | 0.6 | Filter elements below this confidence (0-1) |
| `enableMultiPassInpainting` | boolean | true | Enable 2-pass inpainting for higher quality (doubles API cost) |

### Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| No direct text editing | Medium | Edit in exported PPT |
| LaTeX renders as text | Low | Use MathType plugin |
| No batch AI processing | Medium | Process slides one-by-one |
| No save/resume | High | Complete workflow before closing |

---

## Future Roadmap

### Phase 1 - Stability (Planned)
- [ ] Session persistence (IndexedDB)
- [ ] Better error handling for API failures
- [ ] Progress indicators for batch operations

### Phase 2 - Editing (Planned)
- [ ] In-app text content editing
- [ ] Font selection for text elements
- [ ] Color picker for shapes

### Phase 3 - Advanced (Future)
- [ ] Backend API option for enterprise
- [ ] Team collaboration features
- [ ] Template library integration

### Completed Milestones
- [x] Phase 3: Advanced Inpainting - mask-based removal, multi-pass, validation (Jan 2026)
- [x] UI localization: Chinese to English (Jan 2026)
- [x] All core features implemented (FR-01 to FR-11)
- [x] Multi-provider AI support (Gemini + OpenAI)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Layout detection accuracy | > 85% |
| Text removal quality | Clean backgrounds |
| Export fidelity | Matches preview |
| User workflow completion | < 5 minutes per slide |
