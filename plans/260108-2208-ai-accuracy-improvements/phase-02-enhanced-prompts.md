# Phase 02: Enhanced Prompts & Preprocessing (P1)

## Context
- Parent: [plan.md](plan.md)
- Depends on: [Phase 01](phase-01-quick-wins.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-01-08 |
| Priority | P1 - High |
| Effort | 8h |
| Status | done |

## Key Insights
1. Few-shot examples significantly improve bounding box accuracy
2. Standardized image size (1920x1080) improves consistency
3. Confidence scores enable quality filtering
4. Multi-class types improve element categorization

## Requirements
- [x] Few-shot examples in analyzeLayout prompt
- [x] Image preprocessing (standardize resolution)
- [x] Confidence field in schema + filtering
- [x] Improved element type detection

## Related Code Files
| File | Lines | Purpose |
|------|-------|---------|
| services/geminiService.ts | 633-670 | processImageSchema |
| services/geminiService.ts | 676-746 | analyzeLayout |
| types.ts | 14-41 | Element interfaces |

## Implementation Steps

### 2.1 Create utils/image-preprocessing.ts
```typescript
export const standardizeImage = async (
  base64: string,
  targetWidth = 1920,
  targetHeight = 1080
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failed'));
      
      // Maintain aspect ratio, center
      const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
      const x = (targetWidth - img.width * scale) / 2;
      const y = (targetHeight - img.height * scale) / 2;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = base64;
  });
};
```

### 2.2 Add confidence to types.ts
```typescript
interface SlideTextElement {
  // ... existing fields
  confidence?: number; // 0-1
}

interface SlideVisualElement {
  // ... existing fields
  confidence?: number; // 0-1
}
```

### 2.3 Update processImageSchema (geminiService.ts:633)
```typescript
const processImageSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    backgroundColor: { type: Type.STRING },
    elements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['TEXT', 'VISUAL'] },
          confidence: { type: Type.NUMBER }, // NEW
          content: { type: Type.STRING },
          description: { type: Type.STRING },
          box: { /* ... */ },
          style: { /* ... */ }
        },
        required: ['type', 'box', 'confidence'] // ADD confidence
      }
    }
  }
};
```

### 2.4 Few-shot prompt (geminiService.ts:676)
```typescript
const prompt = `
You are a precise document layout analyzer.

TASK: Detect all text and visual elements in this PowerPoint slide.

COORDINATE FORMAT:
- All values are PERCENTAGES (0-100), NOT pixels
- Use decimal precision (e.g., 15.5)

EXAMPLE OUTPUT:
{
  "backgroundColor": "#1a1a2e",
  "elements": [
    {
      "type": "TEXT",
      "content": "Welcome to Our Company",
      "confidence": 0.95,
      "box": { "top": 8.5, "left": 5.0, "width": 90.0, "height": 12.0 },
      "style": { "fontSize": "title", "fontWeight": "bold", "color": "#ffffff", "alignment": "center" }
    },
    {
      "type": "VISUAL",
      "description": "Blue circular icon with checkmark",
      "confidence": 0.9,
      "box": { "top": 30.0, "left": 10.0, "width": 8.0, "height": 14.0 }
    }
  ]
}

RULES:
1. TEXT = readable characters, numbers, symbols
2. VISUAL = icons, shapes, images, charts (NOT text)
3. confidence: 1.0 = certain, 0.5 = uncertain
4. Include ALL visible elements

NOW ANALYZE THE PROVIDED IMAGE:
`;
```

### 2.5 Add confidence filtering
```typescript
const CONFIDENCE_THRESHOLD = 0.6;

const processedElements = rawElements
  .map(normalizeElement)
  .filter(el => isValidBox(el.box))
  .filter(el => (el.confidence ?? 1) >= CONFIDENCE_THRESHOLD);
```

## Todo List
- [x] Create utils/image-preprocessing.ts
- [x] Add confidence to types.ts
- [x] Update processImageSchema with confidence
- [x] Add few-shot example to prompt
- [x] Add confidence filtering
- [x] Apply preprocessing in analyzeLayout

## Success Criteria
- Bounding boxes more precise with few-shot
- Low-confidence elements filtered out
- Consistent image processing

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Few-shot bias | Use diverse examples |
| Confidence too strict | Make threshold configurable |

## Next Steps
→ [Phase 03: Advanced Inpainting](phase-03-advanced-inpainting.md)
