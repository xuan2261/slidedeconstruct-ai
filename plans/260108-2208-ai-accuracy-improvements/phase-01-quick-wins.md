# Phase 01: Quick Wins (P0)

## Context
- Parent: [plan.md](plan.md)
- Brainstorm: [accuracy-analysis](../reports/brainstorm-260108-2201-core-functionality-accuracy-analysis.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-01-08 |
| Priority | P0 - Critical |
| Effort | 4h |
| Status | done |
| Completed | 2026-01-09 |

## Key Insights
1. Gemini returns 0-1000 coords, code expects 0-100 (fragile heuristic)
2. Text shadows missed due to tight boxes
3. No validation for invalid boxes
4. No deduplication for overlapping elements

## Requirements
- [x] Explicit coordinate format in prompts (0-100%)
- [x] Box padding before text removal (0.5%)
- [x] Sanity checks for box validity
- [x] IoU-based overlap deduplication

## Related Code Files
| File | Lines | Purpose |
|------|-------|---------|
| services/geminiService.ts | 676-746 | analyzeLayout prompt |
| services/geminiService.ts | 111-160 | normalizeElement |
| services/geminiService.ts | 412-481 | removeTextFromImage |

## Implementation Steps

### 1.1 Create utils/box-validation.ts
```typescript
import { BoundingBox } from '../types';

export const isValidBox = (box: BoundingBox): boolean => (
  box.top >= 0 && box.top <= 100 &&
  box.left >= 0 && box.left <= 100 &&
  box.width > 0.5 && box.width <= 100 &&
  box.height > 0.5 && box.height <= 100 &&
  box.top + box.height <= 100 &&
  box.left + box.width <= 100
);

export const calculateIoU = (a: BoundingBox, b: BoundingBox): number => {
  const x1 = Math.max(a.left, b.left);
  const y1 = Math.max(a.top, b.top);
  const x2 = Math.min(a.left + a.width, b.left + b.width);
  const y2 = Math.min(a.top + a.height, b.top + b.height);
  if (x2 <= x1 || y2 <= y1) return 0;
  const inter = (x2 - x1) * (y2 - y1);
  return inter / (a.width * a.height + b.width * b.height - inter);
};

export const expandBox = (box: BoundingBox, padding = 0.5): BoundingBox => ({
  top: Math.max(0, box.top - padding),
  left: Math.max(0, box.left - padding),
  width: Math.min(100 - box.left + padding, box.width + padding * 2),
  height: Math.min(100 - box.top + padding, box.height + padding * 2)
});

export const deduplicateElements = <T extends { box: BoundingBox }>(
  elements: T[], threshold = 0.8
): T[] => {
  const kept: T[] = [];
  for (const el of elements) {
    if (!kept.some(k => calculateIoU(el.box, k.box) > threshold)) kept.push(el);
  }
  return kept;
};
```

### 1.2 Update analyzeLayout prompt (geminiService.ts:676)
Add explicit coordinate format instruction:
```
COORDINATE FORMAT:
- All values MUST be PERCENTAGES (0-100)
- Example: { "top": 15.5, "left": 10.2, "width": 50.0, "height": 20.1 }
- DO NOT use 0-1 normalized or 0-1000 pixel values
```

### 1.3 Apply validation in normalizeElement (line 732)
```typescript
import { isValidBox, deduplicateElements } from '../utils/box-validation';

const processedElements = rawElements
  .map(normalizeElement)
  .filter(el => isValidBox(el.box));
const finalElements = deduplicateElements(processedElements);
```

### 1.4 Apply padding in removeTextFromImage (line 418)
```typescript
import { expandBox } from '../utils/box-validation';
const paddedElements = detectedElements.map(el => ({
  ...el,
  box: expandBox(el.box, 0.5)
}));
```

## Todo List
- [x] Create utils/box-validation.ts
- [x] Update analyzeLayout prompt
- [x] Add validation + dedup in analyzeLayout
- [x] Add expandBox in removeTextFromImage
- [x] Unit tests (26 tests, 100% coverage)

## Success Criteria
- No boxes with invalid coordinates
- No duplicate elements (IoU > 0.8)
- Text removal includes shadows/edges

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Over-aggressive dedup | Tune IoU threshold (0.7-0.9) |
| Padding removes icons | Check VISUAL element overlap |

## Next Steps
→ [Phase 02: Enhanced Prompts](phase-02-enhanced-prompts.md)
