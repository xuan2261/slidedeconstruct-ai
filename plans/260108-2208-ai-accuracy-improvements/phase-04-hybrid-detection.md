# Phase 04: Hybrid Detection (P3)

## Context
- Parent: [plan.md](plan.md)
- Depends on: [Phase 03](phase-03-advanced-inpainting.md)
- Research: [researcher-yolo-client-side.md](research/researcher-yolo-client-side.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-01-08 |
| Priority | P3 - Low |
| Effort | 16h |
| Status | completed |
| Review | [code-reviewer-260109-0354-phase4-hybrid-detection.md](../reports/code-reviewer-260109-0354-phase4-hybrid-detection.md) |
| Score | 8/10 |

## Key Insights (from Research)
1. YOLO detects WHERE text is, Tesseract reads WHAT it says - complementary
2. Tesseract.js: ~197KB core + 15MB lang data, 500-2000ms processing
3. YOLOv8n: ~13MB model + 10MB runtime, 50-200ms inference
4. Recommendation: Keep Gemini for accuracy, client-side is optional enhancement
5. Best use case: offline support, real-time preview, API cost reduction

## Requirements
- [x] Evaluate Tesseract.js for text extraction validation
- [ ] Optional YOLO integration for quick preview (deferred)
- [x] Hybrid pipeline with Gemini fallback
- [x] Graceful degradation on model load failure

## Related Code Files
| File | Lines | Purpose |
|------|-------|---------|
| services/geminiService.ts | 676-746 | analyzeLayout (primary) |
| App.tsx | 200-280 | Processing orchestration |

## Architecture
```
User uploads slide
       ↓
┌─────────────────────────────────────────────────┐
│              Hybrid Detection Pipeline           │
├─────────────────────────────────────────────────┤
│  [Optional] Tesseract.js                        │
│  - Quick text extraction                        │
│  - Provides text bounding boxes                 │
│  - Validates Gemini results                     │
├─────────────────────────────────────────────────┤
│  [Primary] Gemini Vision                        │
│  - Full layout analysis                         │
│  - Element classification                       │
│  - Style extraction                             │
├─────────────────────────────────────────────────┤
│  [Fusion] Merge results                         │
│  - IoU matching between sources                 │
│  - Prefer Tesseract boxes for TEXT elements     │
│  - Keep Gemini for VISUAL elements              │
└─────────────────────────────────────────────────┘
       ↓
   Final Layout
```

## Implementation Steps

### 4.1 Create services/tesseractService.ts
```typescript
import Tesseract from 'tesseract.js';
import { BoundingBox, SlideTextElement } from '../types';

let worker: Tesseract.Worker | null = null;

export const initTesseract = async (): Promise<void> => {
  if (worker) return;
  worker = await Tesseract.createWorker('eng');
};

export const extractTextBoxes = async (
  imageBase64: string
): Promise<SlideTextElement[]> => {
  if (!worker) await initTesseract();

  const { data } = await worker!.recognize(imageBase64);

  return data.words
    .filter(w => w.confidence > 60)
    .map(word => ({
      id: crypto.randomUUID(),
      type: 'TEXT' as const,
      content: word.text,
      confidence: word.confidence / 100,
      box: {
        top: (word.bbox.y0 / data.imageHeight) * 100,
        left: (word.bbox.x0 / data.imageWidth) * 100,
        width: ((word.bbox.x1 - word.bbox.x0) / data.imageWidth) * 100,
        height: ((word.bbox.y1 - word.bbox.y0) / data.imageHeight) * 100
      },
      style: {
        fontSize: 'body',
        fontWeight: 'normal',
        color: '#000000',
        alignment: 'left'
      }
    }));
};

export const terminateTesseract = async (): Promise<void> => {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
};
```

### 4.2 Create utils/detection-fusion.ts
```typescript
import { SlideTextElement, SlideVisualElement } from '../types';
import { calculateIoU } from './box-validation';

export const fuseDetections = (
  geminiElements: (SlideTextElement | SlideVisualElement)[],
  tesseractElements: SlideTextElement[],
  iouThreshold = 0.5
) => {
  const fused: (SlideTextElement | SlideVisualElement)[] = [];
  const usedTesseract = new Set<number>();

  for (const gEl of geminiElements) {
    if (gEl.type === 'VISUAL') {
      fused.push(gEl);
      continue;
    }

    let bestMatch = -1;
    let bestIoU = 0;

    tesseractElements.forEach((tEl, idx) => {
      if (usedTesseract.has(idx)) return;
      const iou = calculateIoU(gEl.box, tEl.box);
      if (iou > bestIoU && iou >= iouThreshold) {
        bestIoU = iou;
        bestMatch = idx;
      }
    });

    if (bestMatch >= 0) {
      const tEl = tesseractElements[bestMatch];
      usedTesseract.add(bestMatch);
      fused.push({
        ...gEl,
        box: tEl.box,
        confidence: Math.max(gEl.confidence ?? 0.8, tEl.confidence ?? 0.8)
      });
    } else {
      fused.push(gEl);
    }
  }

  tesseractElements.forEach((tEl, idx) => {
    if (!usedTesseract.has(idx)) fused.push(tEl);
  });

  return { elements: fused, source: tesseractElements.length > 0 ? 'fused' : 'gemini' };
};
```

### 4.3 Add hybrid mode to settings (types.ts)
```typescript
hybridDetection: {
  enabled: boolean;
  useTesseract: boolean;
  useYolo: boolean; // Future
  preferClientBoxes: boolean;
}
```

### 4.4 Update analyzeLayout for hybrid
```typescript
export const analyzeLayout = async (
  base64Image: string,
  useHybrid = false
): Promise<SlideData | null> => {
  // Run Tesseract in parallel with Gemini
  const tesseractPromise = useHybrid
    ? extractTextBoxes(base64Image).catch(() => [])
    : Promise.resolve([]);

  const geminiResult = await runGeminiAnalysis(base64Image);
  if (!geminiResult) return null;

  const tesseractElements = await tesseractPromise;

  if (useHybrid && tesseractElements.length > 0) {
    const fused = fuseDetections(geminiResult.elements, tesseractElements);
    geminiResult.elements = fused.elements;
  }

  return geminiResult;
};
```

## Todo List
- [x] Create services/tesseractService.ts
- [x] Create utils/detection-fusion.ts
- [x] Add hybridDetection to AISettings
- [x] Update analyzeLayout for optional hybrid mode
- [x] Add Tesseract.js dependency
- [ ] Create YOLO service stub (future) - Deferred per plan
- [x] Add UI toggle for hybrid mode
- [ ] Test fusion accuracy vs Gemini-only - Manual testing needed

## Success Criteria
- Tesseract provides fallback text boxes
- Fusion improves TEXT bounding box IoU
- No regression when hybrid disabled
- Graceful fallback on Tesseract failure

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Bundle size +15MB | Lazy load Tesseract on first use |
| Tesseract slower than Gemini | Run in parallel, don't block |
| Fusion conflicts | Prefer Gemini for semantics, Tesseract for boxes |
| YOLO complexity | Defer to future phase, stub only |

## Dependencies
```json
{
  "tesseract.js": "^5.0.0"
}
```

## Next Steps
- Implementation complete → Return to [plan.md](plan.md)
- YOLO integration → Separate future phase
