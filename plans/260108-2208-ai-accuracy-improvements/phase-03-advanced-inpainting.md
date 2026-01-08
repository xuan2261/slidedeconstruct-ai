# Phase 03: Advanced Inpainting (P2)

## Context
- Parent: [plan.md](plan.md)
- Depends on: [Phase 02](phase-02-enhanced-prompts.md)
- Research: [inpainting-techniques.md](research/researcher-inpainting-techniques.md)

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-01-08 |
| Priority | P2 - Medium |
| Effort | 12h |
| Status | done |

## Key Insights (from Research)
1. Mask-based inpainting is standard for text removal (2025)
2. Multi-pass: Pass 1 = coarse removal, Pass 2 = edge refinement
3. Gemini 2.5 Flash Image supports REFERENCE_TYPE_MASK
4. Padding: 5-20px based on background complexity
5. Validation: LPIPS < 0.15, text detection < 0.1

## Requirements
- [x] Mask generation utility
- [x] Mask-based inpainting with Gemini API
- [x] Multi-pass inpainting pipeline
- [x] Quality validation

## Related Code Files
| File | Lines | Purpose |
|------|-------|---------|
| services/geminiService.ts | 412-481 | removeTextFromImage |
| services/geminiService.ts | 486-545 | eraseAreasFromImage |

## Architecture
```
Text Boxes → generateMask() → Pass 1: Coarse Removal
                                    ↓
                              validateResult()
                                    ↓
                              Pass 2: Edge Refinement (if needed)
                                    ↓
                              Final Image
```

## Implementation Steps

### 3.1 Add mask generation to image-preprocessing.ts
```typescript
export const generateMaskImage = (
  boxes: BoundingBox[],
  width: number,
  height: number
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Black = keep, White = remove
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#FFFFFF';
  boxes.forEach(box => {
    const x = (box.left / 100) * width;
    const y = (box.top / 100) * height;
    const w = (box.width / 100) * width;
    const h = (box.height / 100) * height;
    ctx.fillRect(x, y, w, h);
  });

  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
};

export const getImageDimensions = (base64: string): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
  });
};
```

### 3.2 Update removeTextFromImage for mask-based approach
```typescript
export const removeTextFromImage = async (
  base64Image: string,
  detectedElements: SlideTextElement[]
): Promise<string | null> => {
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  
  // Get dimensions for mask
  const dims = await getImageDimensions(base64Image);
  
  // Generate mask from text boxes (with padding)
  const paddedBoxes = detectedElements.map(el => expandBox(el.box, 1.0));
  const maskBase64 = generateMaskImage(paddedBoxes, dims.width, dims.height);

  const prompt = `
Remove all content in the masked (white) regions.
Fill with surrounding background texture/color.
Preserve everything in black regions EXACTLY.
Output ONLY the processed image.
`;

  if (currentSettings.currentProvider === 'gemini') {
    const ai = getGeminiClient();
    const response = await callGeminiWithRetry(() => ai.models.generateContent({
      model: currentSettings.gemini.drawingModel,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { inlineData: { mimeType: 'image/png', data: maskBase64 } },
          { text: prompt }
        ]
      },
      // ... safety settings
    }));
    // Extract image from response...
  }
  // ... OpenAI fallback
};
```

### 3.3 Add multi-pass inpainting
```typescript
export const removeTextMultiPass = async (
  base64Image: string,
  textElements: SlideTextElement[]
): Promise<string | null> => {
  // Pass 1: Coarse removal with generous padding
  const pass1 = await removeTextFromImage(base64Image, textElements);
  if (!pass1) return null;

  // Simple validation: check if result looks different enough
  // (Full LPIPS would require additional library)
  
  // Pass 2: Refinement on edges
  const refinementPrompt = `
This image had text removed. Clean up any remaining:
- Shadow artifacts
- Color inconsistencies  
- Edge discontinuities
Make the background seamless. DO NOT add new elements.
Output ONLY the refined image.
`;

  const ai = getGeminiClient();
  const response = await callGeminiWithRetry(() => ai.models.generateContent({
    model: currentSettings.gemini.drawingModel,
    contents: { parts: [
      { inlineData: { mimeType: 'image/png', data: pass1 } },
      { text: refinementPrompt }
    ]},
    // ... safety settings
  }));
  
  // Extract and return refined image
};
```

### 3.4 Add validation utility
```typescript
export const validateInpainting = async (
  original: string,
  result: string,
  maskBoxes: BoundingBox[]
): Promise<{ valid: boolean; reason?: string }> => {
  // Basic validation without heavy ML libraries
  // 1. Check result is not empty
  if (!result || result.length < 1000) {
    return { valid: false, reason: 'Empty or too small result' };
  }
  
  // 2. Check result is different from original (something changed)
  if (result === original) {
    return { valid: false, reason: 'No change detected' };
  }
  
  // 3. Size sanity check
  const origDims = await getImageDimensions(original);
  const resultDims = await getImageDimensions(result);
  if (Math.abs(origDims.width - resultDims.width) > 10 ||
      Math.abs(origDims.height - resultDims.height) > 10) {
    return { valid: false, reason: 'Dimension mismatch' };
  }
  
  return { valid: true };
};
```

## Todo List
- [x] Add generateMaskImage to image-preprocessing.ts
- [x] Add getImageDimensions utility
- [x] Update removeTextFromImage for mask-based
- [x] Add removeTextMultiPass function
- [x] Add validateInpainting utility
- [x] Update processConfirmedLayout to use multi-pass
- [x] Add enableMultiPassInpainting setting to AISettings
- [x] Extract GEMINI_SAFETY_SETTINGS constant (DRY)
- [x] Add MIN_VALID_IMAGE_SIZE and MAX_DIMENSION_VARIANCE constants
- [ ] Test with complex backgrounds

## Success Criteria
- Text removal quality improves to 85%+
- No visible artifacts on simple backgrounds
- Graceful fallback on validation failure

## Risk Assessment
| Risk | Mitigation |
|------|------------|
| Mask size mismatch | Ensure exact dimension match |
| API cost increase (2 passes) | Make multi-pass optional |
| Gemini mask format change | Abstract mask generation |

## Next Steps
→ [Phase 04: Hybrid Detection](phase-04-hybrid-detection.md)
