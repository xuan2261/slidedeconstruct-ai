# Brainstorm Report: SlideDeconstruct AI - Workflow & Performance Improvement Analysis

**Date:** 2026-01-08
**Type:** Architecture & Workflow Review
**Scope:** Full codebase analysis for quality and performance improvements

---

## 1. Problem Statement

SlideDeconstruct AI là một ứng dụng pure client-side React dùng AI vision để reverse-engineer PPT screenshots thành các layers có thể chỉnh sửa. Dựa trên phân tích codebase, cần xác định các điểm cần cải thiện về:
- Architecture & Code Quality
- Performance & Optimization
- User Experience & Workflow
- Maintainability & Scalability

---

## 2. Current State Analysis

### 2.1 Architecture Overview

```
Root
├── App.tsx (~980 lines) - Monolithic component
├── types.ts - Type definitions
├── services/
│   ├── geminiService.ts (~876 lines) - AI integration
│   └── fileService.ts (~83 lines) - File processing
└── components/
    ├── CorrectionCanvas.tsx
    ├── EditorCanvas.tsx
    ├── LayerList.tsx
    ├── ReconstructionCanvas.tsx
    ├── SettingsModal.tsx
    ├── SlideSidebar.tsx
    ├── UploadSection.tsx
    └── VectorLayerList.tsx
```

### 2.2 Processing Pipeline

```
Upload → Analyze Layout → Human Correction → Text Removal → Complete → Export
  │         │                  │                  │            │
idle    analyzing          correcting      processing_final  complete
```

---

## 3. Identified Issues & Improvement Opportunities

### 3.1 Architecture Issues (High Priority)

| Issue | Location | Impact | Recommendation |
|-------|----------|--------|----------------|
| **Monolithic App.tsx** | App.tsx:980 lines | Hard to maintain, test, navigate | Split into custom hooks + smaller components |
| **No State Management** | App.tsx | Prop drilling, complex updates | Consider Zustand or React Context |
| **Global Mutable State** | geminiService.ts:5 | Race conditions, testing difficulty | Inject settings via params or context |
| **Tight Service Coupling** | geminiService.ts | Hard to mock, test | Dependency injection pattern |

#### 3.1.1 App.tsx Decomposition Proposal

```
hooks/
├── useSlideWorkspace.ts    - Slide CRUD, state management
├── useAIOperations.ts      - AI calls (analyze, refine, erase)
├── useExport.ts            - PPT export logic
├── useImageCrop.ts         - Image cropping utilities
└── useKeyboardShortcuts.ts - Hotkeys

contexts/
├── AISettingsContext.tsx   - Settings provider
└── WorkspaceContext.tsx    - Workspace state provider
```

### 3.2 Code Quality Issues (Medium Priority)

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Excessive `any` types | geminiService.ts:45, 83, 111 | Add proper typing |
| Duplicate cropImage logic | App.tsx:245-282 | Extract to utility |
| No error boundaries | Components | Add React error boundaries |
| Inconsistent error handling | Multiple | Standardize error types |
| Magic numbers | Multiple | Extract to constants |

#### Code Smells Detected

1. **Repeated element update patterns** in App.tsx:
   - `handleToggleElementVisibility` (lines 179-201)
   - `handleUpdateElementBox` (lines 203-223)
   - Similar map/filter patterns duplicated

2. **tryParseJSON** repair logic is fragile:
   ```typescript
   // geminiService.ts:45-72
   // Attempts to "fix" broken JSON - brittle approach
   ```

3. **Shape type mapping** duplicated in:
   - App.tsx:700-711 (export)
   - Could be in shared constants

### 3.3 Performance Issues (High Priority)

| Issue | Impact | Solution |
|-------|--------|----------|
| **No image compression** | Large API payloads, slow uploads | Compress before AI calls |
| **Base64 in state** | High memory usage | Use Blob URLs, compress thumbnails |
| **No result caching** | Repeated AI calls waste tokens | Cache analyzed layouts |
| **PDF scale fixed at 2.0** | Over-quality for some use cases | Make configurable |
| **No lazy loading** | Slow initial load | Lazy load heavy components |
| **No request debouncing** | Potential duplicate calls | Debounce user actions |

#### Memory Optimization Opportunities

```typescript
// Current: Full image stored as thumbnail
thumbnail: base64  // Same as originalImage

// Better: Generate smaller thumbnail
thumbnail: await resizeImage(base64, 200)  // 200px width

// Best: Use Blob URLs instead of base64 strings
originalImageUrl: URL.createObjectURL(blob)
```

#### Image Compression Before AI

```typescript
// Before sending to Gemini
const compressedBase64 = await compressImage(originalBase64, {
  maxWidth: 1920,
  quality: 0.85,
  format: 'webp'
});
```

### 3.4 UX/Workflow Issues (High Priority)

| Issue | User Impact | Priority | Solution |
|-------|-------------|----------|----------|
| **No session persistence** | Data lost on refresh | Critical | IndexedDB storage |
| **No progress indicators** | User uncertainty during long ops | High | Progress bars, step indicators |
| **No keyboard shortcuts** | Slower workflow | Medium | Add hotkeys (Delete, Undo, etc.) |
| **No batch processing** | Manual slide-by-slide | Medium | Queue-based batch processing |
| **Limited undo/redo** | Only element history, not global | Medium | Global action history |
| **No auto-save** | Risk of data loss | High | Periodic auto-save |

#### Session Persistence Design

```typescript
// IndexedDB Schema
interface StoredSession {
  id: string;
  version: number;
  lastModified: Date;
  slides: SlideWorkspace[];
  aiSettings: AISettings;
}

// Auto-save on significant changes
useEffect(() => {
  const timer = setTimeout(() => saveToIndexedDB(slides), 2000);
  return () => clearTimeout(timer);
}, [slides]);
```

### 3.5 Error Handling Issues (Medium Priority)

| Current Behavior | Problem | Improvement |
|------------------|---------|-------------|
| `alert()` for errors | Poor UX | Toast notifications |
| Silent fails in some cases | User confusion | Consistent error display |
| No retry UI for failed ops | Manual refresh needed | Retry buttons with context |
| Console.error only | Not user-visible | Error boundary + UI feedback |

#### Proposed Error Handling Pattern

```typescript
interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

// Toast notification system
const { showError, showSuccess } = useNotifications();
```

### 3.6 Missing Features (From Roadmap)

| Feature | Status | Effort | Value |
|---------|--------|--------|-------|
| Session persistence (IndexedDB) | Planned | Medium | High |
| Better error handling | Planned | Low | High |
| Progress indicators | Planned | Low | Medium |
| In-app text editing | Planned | High | Medium |
| Batch AI processing | Not planned | Medium | High |
| Keyboard shortcuts | Not planned | Low | Medium |

### 3.7 Build & DevEx Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| Duplicate vite in deps | Potential conflicts | Remove from dependencies |
| No linting config | Code consistency | Add ESLint + Prettier |
| No testing setup | No test coverage | Add Vitest |
| No pre-commit hooks | Quality control | Add Husky + lint-staged |

---

## 4. Prioritized Recommendations

### Phase 1: Quick Wins (1-2 days effort each)

1. **Add image compression before AI calls**
   - Reduces API payload size
   - Faster uploads, lower costs
   - ~50-70% reduction in base64 size

2. **Add toast notification system**
   - Replace all `alert()` calls
   - Better UX for errors and success

3. **Generate proper thumbnails**
   - Resize to 200px width for sidebar
   - Significant memory reduction

4. **Add keyboard shortcuts**
   - Delete, Esc, Ctrl+Z basics
   - Improves power user workflow

5. **Fix duplicate vite dependency**
   - Clean up package.json

### Phase 2: Architecture Refactor (1-2 weeks)

1. **Extract custom hooks from App.tsx**
   - `useSlideWorkspace` - slide state management
   - `useAIOperations` - AI service calls
   - `useExport` - PPT export logic
   - Reduces App.tsx from 980 to ~300 lines

2. **Add React Context for settings**
   - Remove global mutable `currentSettings`
   - Cleaner dependency injection

3. **Add error boundaries**
   - Prevent full app crash on component errors
   - Better error recovery

### Phase 3: Session Persistence (3-5 days)

1. **Implement IndexedDB storage**
   - Auto-save workspace state
   - Resume on page load
   - Clear stale sessions

2. **Add progress indicators**
   - Step-based progress for multi-step ops
   - Percentage for long-running tasks

### Phase 4: Performance Optimization (1 week)

1. **Implement result caching**
   - Cache layout analysis results
   - Prevent re-analysis of same image

2. **Use Blob URLs instead of base64**
   - Reduce memory footprint
   - Better garbage collection

3. **Lazy load heavy components**
   - ReconstructionCanvas
   - VectorLayerList
   - SettingsModal

### Phase 5: Testing & Quality (Ongoing)

1. **Add Vitest for unit tests**
2. **Add ESLint + Prettier**
3. **Add pre-commit hooks**
4. **Add integration tests for AI service**

---

## 5. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| IndexedDB quota limits | Low | Medium | Implement cleanup of old sessions |
| Image compression quality loss | Medium | Low | Make quality configurable |
| Refactor breaking existing features | Medium | High | Add tests before refactoring |
| Browser compatibility | Low | Medium | Test on Chrome, Firefox, Edge |

---

## 6. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| App.tsx lines | 980 | <300 |
| Average memory usage | High (unmeasured) | -50% |
| Session recovery | None | 100% on refresh |
| Error visibility | Console only | 100% UI feedback |
| Test coverage | 0% | >60% |
| User workflow time | ~5 min/slide | <3 min/slide |

---

## 7. Conclusion

SlideDeconstruct AI has solid core functionality but needs architectural improvements for maintainability and UX enhancements for user satisfaction. Key priorities:

1. **Immediate:** Image compression, toast notifications, thumbnails
2. **Short-term:** Extract hooks, session persistence
3. **Medium-term:** Caching, lazy loading, testing

The monolithic App.tsx is the biggest technical debt - refactoring into hooks will unlock easier feature development and testing.

---

## 8. Next Steps

Recommend proceeding with **Phase 1 Quick Wins** first as they provide immediate value with low risk. Then tackle **Phase 2 Architecture Refactor** to establish a cleaner foundation for future development.

---

## Unresolved Questions

1. Is there a performance budget or memory limit target?
2. Should session persistence store full images or just metadata + file references?
3. Are there plans to add backend support for enterprise features?
4. What's the target browser support matrix?
5. Should batch processing be parallel or sequential to avoid rate limits?
