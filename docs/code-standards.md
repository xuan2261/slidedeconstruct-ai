# Code Standards

## Overview

This document defines the coding conventions and patterns used in the SlideDeconstruct AI project.

---

## TypeScript Configuration

### Compiler Options

| Option | Value | Rationale |
|--------|-------|-----------|
| target | ES2022 | Modern JS features, top-level await |
| module | ESNext | ES modules for Vite |
| jsx | react-jsx | React 17+ JSX transform |
| moduleResolution | bundler | Vite-optimized resolution |
| strict | (default) | Type safety |
| noEmit | true | Vite handles compilation |

### Path Aliases

```json
{
  "paths": {
    "@/*": ["./*"]
  }
}
```

Usage: `import { types } from '@/types'`

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase.tsx | `EditorCanvas.tsx` |
| Services | camelCase.ts | `geminiService.ts` |
| Types | camelCase.ts | `types.ts` |
| Config | camelCase.config.ts | `vite.config.ts` |

---

## Component Patterns

### Functional Components

All components use functional components with hooks.

```typescript
import React, { useState, useEffect } from 'react';

interface Props {
  imageSrc: string;
  onSelect: (id: string) => void;
}

const MyComponent: React.FC<Props> = ({ imageSrc, onSelect }) => {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // side effects
  }, []);

  return <div>{/* JSX */}</div>;
};

export default MyComponent;
```

### Props Interface

- Define `Props` interface above component
- Use `React.FC<Props>` for type safety
- Destructure props in function signature

### State Management

- Use `useState` for local state
- Use `useEffect` for side effects
- No external state library (Redux, Zustand)

**State Location:**
- Global state (slides, settings) in `App.tsx`
- Pass down via props
- Callbacks for child-to-parent communication

---

## Naming Conventions

### Variables and Functions

| Type | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `activeSlide` |
| Functions | camelCase | `handleFilesSelected` |
| Constants | UPPER_SNAKE | `DEFAULT_AI_SETTINGS` |
| Types/Interfaces | PascalCase | `SlideWorkspace` |
| Enums | PascalCase | `ElementType` |
| Enum Values | UPPER_SNAKE | `ElementType.TEXT` |

### Event Handlers

Prefix with `handle` for component-level handlers:
```typescript
const handleClick = () => {};
const handleFilesSelected = (files: FileList) => {};
```

Prefix with `on` for prop callbacks:
```typescript
interface Props {
  onSelect: (id: string) => void;
  onConfirm: () => void;
}
```

---

## Type Definitions

### Location

All shared types in `types.ts` at project root.

### Patterns

**Enums for fixed values:**
```typescript
export enum ElementType {
  TEXT = 'TEXT',
  VISUAL = 'VISUAL',
}
```

**Interfaces for objects:**
```typescript
export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}
```

**Type unions for variants:**
```typescript
export type ProcessingState =
  | 'idle'
  | 'analyzing'
  | 'correcting'
  | 'processing_final'
  | 'complete'
  | 'error';
```

**Default values as constants:**
```typescript
export const DEFAULT_AI_SETTINGS: AISettings = {
  currentProvider: 'gemini',  // Deprecated
  recognitionProvider: 'gemini',
  drawingProvider: 'gemini',
  gemini: { /* ... */ },
  openai: { /* ... */ },
  anthropic: { /* ... */ },
};
```

**Migration helpers for backward compat:**
```typescript
export const migrateSettings = (old: Partial<AISettings>): AISettings => {
  const merged = { ...DEFAULT_AI_SETTINGS, ...old };
  // If old settings without new fields, use currentProvider for both
  if (old.currentProvider && !old.recognitionProvider) {
    merged.recognitionProvider = old.currentProvider;
    merged.drawingProvider = old.currentProvider;
  }
  return merged;
};
```

---

## Service Layer Patterns

### Module Structure

```typescript
// 1. Imports
import { ExternalLib } from 'external';
import { LocalType } from '../types';

// 2. Module state
let currentSettings: AISettings = { ...DEFAULT_AI_SETTINGS };

// 3. Exported functions
export const updateSettings = (settings: AISettings) => {
  currentSettings = settings;
};

// 4. Internal helpers (not exported)
const cleanJsonString = (str: string): string => { /* ... */ };
```

### Error Handling

```typescript
export const apiCall = async (): Promise<Result> => {
  try {
    const response = await fetch(/* ... */);
    if (!response.ok) {
      throw new Error(`API Error (${response.status})`);
    }
    return response.json();
  } catch (error) {
    console.error('Operation failed:', error);
    throw error; // Re-throw for UI handling
  }
};
```

### Retry Logic

```typescript
const callWithRetry = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 2000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (isRetryable(error) && retries > 0) {
      await new Promise(r => setTimeout(r, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};
```

---

## Styling Patterns

### Tailwind CSS

Used via CDN in `index.html`. No custom CSS files.

**Class Organization:**
```typescript
<div className="
  flex items-center justify-between
  px-6 py-4
  bg-white dark:bg-slate-800
  border-b border-slate-200
  transition-colors duration-200
">
```

Order:
1. Layout (flex, grid, position)
2. Spacing (padding, margin)
3. Colors (background, text)
4. Borders
5. Effects (transition, shadow)

### Dark Mode

Toggle class on `<html>` element:
```typescript
useEffect(() => {
  const root = document.documentElement;
  if (isDarkMode) root.classList.add('dark');
  else root.classList.remove('dark');
}, [isDarkMode]);
```

Use `dark:` prefix for dark variants:
```typescript
className="bg-white dark:bg-slate-800"
```

---

## Canvas Operations

### Coordinate System

All bounding boxes use percentage-based coordinates (0-100):
```typescript
interface BoundingBox {
  top: number;    // 0-100% from top
  left: number;   // 0-100% from left
  width: number;  // 0-100% of container width
  height: number; // 0-100% of container height
}
```

### Image Cropping

```typescript
const cropImage = async (
  sourceImage: string,
  box: BoundingBox
): Promise<string> => {
  const img = new Image();
  img.src = sourceImage;
  await new Promise(r => img.onload = r);

  const canvas = document.createElement('canvas');
  const x = (box.left / 100) * img.naturalWidth;
  const y = (box.top / 100) * img.naturalHeight;
  const w = (box.width / 100) * img.naturalWidth;
  const h = (box.height / 100) * img.naturalHeight;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);

  return canvas.toDataURL('image/png');
};
```

---

## State Update Patterns

### Immutable Updates

```typescript
// Array update
setSlides(prev => prev.map(s =>
  s.id === targetId ? { ...s, ...updates } : s
));

// Nested object update
updateActiveSlide({
  slideData: {
    ...activeSlide.slideData,
    elements: updatedElements
  }
});
```

### Helper Functions

```typescript
const updateActiveSlide = (updates: Partial<SlideWorkspace>) => {
  if (!activeSlideId) return;
  setSlides(prev => prev.map(s =>
    s.id === activeSlideId ? { ...s, ...updates } : s
  ));
};
```

---

## Import Organization

Order:
1. React imports
2. External library imports
3. Local type imports
4. Local component imports
5. Local service imports

```typescript
import React, { useState, useEffect } from 'react';
import PptxGenJS from 'pptxgenjs';
import { SlideWorkspace, ElementType } from './types';
import EditorCanvas from './components/EditorCanvas';
import { analyzeLayout } from './services/geminiService';
```

---

## Comments

### When to Comment

- Complex algorithms
- Non-obvious business logic
- API quirks or workarounds
- TODO items

### Format

```typescript
// Single line for brief notes

/**
 * Multi-line for function documentation.
 * Explains purpose and important details.
 */
const complexFunction = () => { /* ... */ };

// TODO: Add feature X when API supports it
```

---

## Environment Variables

### Vite Prefix

All env vars must use `VITE_` prefix for browser access:
```env
VITE_API_KEY=your_key_here
```

### Access

```typescript
if (import.meta.env.VITE_API_KEY) {
  currentSettings.gemini.apiKey = import.meta.env.VITE_API_KEY;
}
```

---

## Build Configuration

### Vite Settings

```typescript
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: { target: 'esnext' }
  },
  build: { target: 'esnext' },
  server: { host: true, port: 3000 }
});
```

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

---

## Testing Guidelines

### Current Status
No formal test suite implemented. Future considerations:

| Type | Tool | Priority |
|------|------|----------|
| Unit | Vitest | Medium |
| Component | React Testing Library | Medium |
| E2E | Playwright | Low |

### Manual Testing Checklist
- Upload PDF/PNG/JPG files
- AI layout analysis returns valid boxes
- Bounding box editing works (drag, resize, context menu)
- Text removal produces clean background
- PPT export opens correctly in PowerPoint

---

## Accessibility Notes

### Current Implementation
- Semantic HTML where applicable
- Dark mode support for visual comfort
- Keyboard navigation limited (canvas interactions mouse-only)

### Future Improvements
- Add ARIA labels for canvas elements
- Keyboard shortcuts for common actions
- Screen reader support for layer list
