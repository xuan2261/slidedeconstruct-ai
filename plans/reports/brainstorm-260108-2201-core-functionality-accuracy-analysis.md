# Brainstorm Report: Core Functionality & Accuracy Optimization

**Date:** 2026-01-08
**Type:** Deep Dive Analysis - AI Accuracy Focus
**Scope:** Core features, technology stack, accuracy improvements

---

## 1. Project Core Functionality Overview

### 1.1 Mission Statement

SlideDeconstruct AI giải quyết vấn đề "Easy to generate, hard to edit" của các công cụ AI tạo PPT. Nó reverse-engineer static PPT screenshots thành các layers có thể chỉnh sửa.

### 1.2 Core Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CORE PROCESSING PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────┐    ┌────────────────┐    ┌─────────────────┐    ┌───────────┐ │
│  │ UPLOAD  │───▶│ LAYOUT ANALYSIS│───▶│ HUMAN CORRECTION│───▶│ TEXT      │ │
│  │         │    │   (AI Vision)  │    │  (Manual Adjust)│    │ REMOVAL   │ │
│  └─────────┘    └────────────────┘    └─────────────────┘    │(Inpainting)│ │
│       │                │                       │              └─────┬─────┘ │
│       │                │                       │                    │       │
│       ▼                ▼                       ▼                    ▼       │
│  PDF→PNG        Elements JSON          Confirmed Layout      Cleaned BG    │
│  Image→Base64   Bounding Boxes         Precise Boxes         + Layers      │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         OPTIONAL FEATURES                                ││
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────────┐ ││
│  │  │ Refine      │  │ Modify       │  │ Erase      │  │ Vector         │ ││
│  │  │ Elements    │  │ Visual       │  │ Areas      │  │ Conversion     │ ││
│  │  │ (AI Split)  │  │ (AI Regen)   │  │ (Inpaint)  │  │ (Shape Detect) │ ││
│  │  └─────────────┘  └──────────────┘  └────────────┘  └────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│                           ┌───────────────┐                                 │
│                           │  PPT EXPORT   │                                 │
│                           │ (pptxgenjs)   │                                 │
│                           └───────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Core AI Functions Analysis

| Function | Purpose | Model Used | Input | Output | Accuracy Critical? |
|----------|---------|------------|-------|--------|-------------------|
| `analyzeLayout()` | Detect text + visual elements | Recognition | Image | JSON (boxes) | **HIGH** |
| `removeTextFromImage()` | Surgical text removal | Drawing | Image + boxes | Image | **HIGH** |
| `refineElement()` | Split parent into children | Recognition | Cropped img | JSON (sub-boxes) | Medium |
| `regenerateVisualElement()` | AI-edit visual | Drawing | Image + prompt | Image | Medium |
| `analyzeVisualToVector()` | Detect shape type | Recognition | Cropped img | JSON (shape info) | Medium |
| `eraseAreasFromImage()` | Remove user-defined areas | Drawing | Image + boxes | Image | **HIGH** |

---

## 2. Current Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI Framework |
| TypeScript | 5.8 | Type Safety |
| Vite | 7.x | Build Tool |
| Tailwind CSS | (implied) | Styling |
| pptxgenjs | 4.0.1 | PPT Generation |
| pdfjs-dist | 5.4.449 | PDF Parsing |

### 2.2 AI Integration

| Provider | Recognition Model | Drawing Model | SDK |
|----------|-------------------|---------------|-----|
| **Gemini** (Primary) | `gemini-3-pro-preview` | `gemini-2.5-flash-image` | @google/genai 1.34.0 |
| **OpenAI** (Alternative) | `gpt-4o` | `dall-e-3` | fetch() REST |

### 2.3 Model Capabilities Comparison

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    MODEL CAPABILITY MATRIX (2025/2026)                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  RECOGNITION MODELS (Layout Analysis)                                       │
│  ┌──────────────────────┬────────────────────┬───────────────────────────┐ │
│  │ Model                │ Vision Accuracy    │ Bounding Box Precision    │ │
│  ├──────────────────────┼────────────────────┼───────────────────────────┤ │
│  │ gemini-3-pro-preview │ 81.2% (MMMU-Pro)   │ Normalized 0-1000 coords  │ │
│  │ gemini-2.5-pro       │ 68.0% (MMMU-Pro)   │ Normalized 0-1000 coords  │ │
│  │ gpt-4o               │ ~75% estimated     │ Percentage-based          │ │
│  └──────────────────────┴────────────────────┴───────────────────────────┘ │
│                                                                             │
│  DRAWING MODELS (Inpainting)                                                │
│  ┌──────────────────────┬────────────────────┬───────────────────────────┐ │
│  │ Model                │ Inpainting Quality │ Image-to-Image Support    │ │
│  ├──────────────────────┼────────────────────┼───────────────────────────┤ │
│  │ gemini-2.5-flash-img │ Good               │ Yes (native)              │ │
│  │ dall-e-3             │ Limited            │ No (text-to-image only)   │ │
│  │ gpt-image-1          │ Better             │ Yes (edit mode)           │ │
│  └──────────────────────┴────────────────────┴───────────────────────────┘ │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Accuracy Analysis - Current State

### 3.1 Layout Analysis Accuracy Issues

**Current Prompt Analysis:**

```typescript
// geminiService.ts:676-688
const prompt = `
    Analyze the layout of this PPT slide using STRICT GEOMETRY.

    1. **Background**: Identify the dominant solid background color.
    2. **Elements Detection**: Identify ALL bounding boxes.

    IMPORTANT for Bounding Boxes:
    - Draw the TIGHTEST possible bounding box...
    - Use decimal values (e.g. 15.5) for higher precision.
    - Return coordinates in 0-100% relative to the image size.
`;
```

**Identified Issues:**

| Issue | Impact | Root Cause |
|-------|--------|------------|
| Inconsistent coordinate format | Boxes may be offset | Gemini returns 0-1000, code expects 0-100 |
| Missing element types | Some text marked as VISUAL | Prompt lacks explicit type criteria |
| Imprecise boxes | Boxes too large/small | No visual grounding examples in prompt |
| Overlapping elements | Duplicate detections | No deduplication logic |

### 3.2 Text Removal (Inpainting) Accuracy Issues

**Current Prompt Analysis:**

```typescript
// geminiService.ts:415-430
let prompt = "Strictly preserve the original aspect ratio (16:9)...";
prompt += " - Target Zone ${index + 1}: [Top: ${top.toFixed(2)}%...]";
prompt += "\nFill these erased text zones with the matching background...";
```

**Identified Issues:**

| Issue | Impact | Root Cause |
|-------|--------|------------|
| Background texture loss | Gradients become flat | Model simplifies complex textures |
| Visible artifacts | "Ghost" text shadows | Imprecise box boundaries |
| Color mismatch | Inpainted area differs | Model doesn't sample exact colors |
| Visual elements affected | Icons partially erased | Boxes overlap with visual elements |

### 3.3 Success Rate Estimation

| Operation | Current Estimated Accuracy | Target |
|-----------|---------------------------|--------|
| Element Detection (recall) | ~75-80% | 90%+ |
| Bounding Box Precision (IoU) | ~65-75% | 85%+ |
| Text Removal Quality | ~60-70% | 85%+ |
| Vector Shape Detection | ~50-60% | 75%+ |

---

## 4. Accuracy Improvement Strategies

### 4.1 Layout Analysis Improvements

#### A. Coordinate Normalization Fix

**Current Problem:** Gemini may return 0-1000, code has heuristic for 0-1.

```typescript
// Current heuristic is fragile
if (nBox.top <= 1 && nBox.left <= 1 && nBox.width <= 1 && nBox.height <= 1) {
    nBox.top *= 100; // Assumes 0-1 range
}
```

**Improvement:** Explicit coordinate format in prompt + schema.

```typescript
// Improved prompt
const prompt = `
    Return bounding boxes in PERCENTAGE format (0-100).
    Example: { "top": 15.5, "left": 10.2, "width": 50.0, "height": 20.1 }

    DO NOT use 0-1 normalized or 0-1000 pixel coordinates.
`;
```

#### B. Enhanced Element Type Detection

**Current Problem:** Simple text/visual classification.

**Improvement:** Multi-class detection with confidence scores.

```typescript
const improvedSchema = {
    elements: [{
        type: { enum: ["TEXT_TITLE", "TEXT_BODY", "TEXT_CAPTION", "ICON", "SHAPE", "IMAGE", "CHART"] },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        content: { type: "string" },  // For text
        description: { type: "string" }, // For visual
        box: { ... }
    }]
};
```

#### C. Few-Shot Examples in Prompt

Research shows few-shot prompting improves bounding box accuracy significantly.

```typescript
const prompt = `
    Analyze this PPT slide.

    EXAMPLE INPUT: [Sample slide image description]
    EXAMPLE OUTPUT:
    {
        "backgroundColor": "#1a1a2e",
        "elements": [
            { "type": "TEXT_TITLE", "content": "Welcome", "box": { "top": 8.5, "left": 5.0, "width": 90.0, "height": 12.0 } },
            { "type": "ICON", "description": "Blue circular icon", "box": { "top": 30.0, "left": 10.0, "width": 8.0, "height": 14.0 } }
        ]
    }

    NOW ANALYZE THE PROVIDED IMAGE:
`;
```

#### D. Image Preprocessing

Based on OCR research, preprocessing improves accuracy 20-30%.

```typescript
// Before sending to AI
const preprocessImage = async (base64: string): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 1. Ensure consistent size (1920x1080 for 16:9)
    canvas.width = 1920;
    canvas.height = 1080;

    // 2. Apply contrast enhancement (optional)
    // ctx.filter = 'contrast(1.1)';

    // 3. Draw and export
    ctx.drawImage(img, 0, 0, 1920, 1080);
    return canvas.toDataURL('image/png');
};
```

### 4.2 Text Removal (Inpainting) Improvements

#### A. Mask-Based Inpainting

Current approach relies on text coordinates. Better: Generate actual mask.

```typescript
// Create binary mask image
const createMaskImage = (boxes: BoundingBox[], width: number, height: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Black background (keep)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // White areas (remove)
    ctx.fillStyle = '#FFFFFF';
    boxes.forEach(box => {
        const x = (box.left / 100) * width;
        const y = (box.top / 100) * height;
        const w = (box.width / 100) * width;
        const h = (box.height / 100) * height;
        ctx.fillRect(x, y, w, h);
    });

    return canvas.toDataURL('image/png');
};

// Send both original + mask to AI
const prompt = `
    Using the provided mask (white = areas to remove),
    inpaint the original image by removing content in white regions.

    [Image 1: Original]
    [Image 2: Mask]
`;
```

#### B. Box Padding/Margin

Slightly expand text boxes to catch shadows and anti-aliased edges.

```typescript
const expandBox = (box: BoundingBox, padding: number = 0.5): BoundingBox => ({
    top: Math.max(0, box.top - padding),
    left: Math.max(0, box.left - padding),
    width: Math.min(100 - box.left, box.width + padding * 2),
    height: Math.min(100 - box.top, box.height + padding * 2)
});
```

#### C. Multi-Pass Inpainting

For complex backgrounds, use iterative refinement.

```typescript
// Pass 1: Remove text (may leave artifacts)
const pass1 = await removeTextFromImage(original, textElements);

// Pass 2: Touch-up pass focusing on edges
const touchupPrompt = `
    This image had text removed. Clean up any remaining artifacts,
    shadows, or color inconsistencies. Make the background seamless.
    DO NOT add any new elements.
`;
const pass2 = await refineInpainting(pass1, touchupPrompt);
```

### 4.3 Alternative Model Strategies

#### A. Hybrid Approach: YOLO + Gemini

Research indicates specialized models outperform general VLMs for detection.

```
┌─────────────────────────────────────────────────────────────────┐
│                   HYBRID DETECTION PIPELINE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐        │
│  │ Input      │──────│ YOLO v11   │──────│ Gemini     │        │
│  │ Image      │      │ Text Det.  │      │ Semantic   │        │
│  └────────────┘      └────────────┘      └────────────┘        │
│                            │                    │               │
│                            ▼                    ▼               │
│                      Precise Boxes      Content + Style        │
│                      (IoU 95%+)         (Meaning, Type)        │
│                            │                    │               │
│                            └────────┬───────────┘               │
│                                     ▼                           │
│                             Merged Results                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Pros:** Best of both worlds - precision + understanding
**Cons:** Added complexity, need to serve YOLO model (WASM or backend)

#### B. Use Gemini 3 Pro for All Recognition

Current: `gemini-3-pro-preview`
Gemini 3 Pro significantly outperforms 2.5 on vision tasks (81.2% vs 68.0% MMMU-Pro).

#### C. Specialized OCR Pipeline

For text detection, consider dedicated OCR before Gemini analysis.

```typescript
// Option 1: Tesseract.js (client-side)
import Tesseract from 'tesseract.js';

const ocrResults = await Tesseract.recognize(imageBase64, 'eng+vie');
const textBoxes = ocrResults.data.words.map(word => ({
    type: 'TEXT',
    content: word.text,
    box: {
        top: (word.bbox.y0 / imageHeight) * 100,
        left: (word.bbox.x0 / imageWidth) * 100,
        width: ((word.bbox.x1 - word.bbox.x0) / imageWidth) * 100,
        height: ((word.bbox.y1 - word.bbox.y0) / imageHeight) * 100
    },
    confidence: word.confidence
}));

// Then use Gemini only for visual element detection
```

### 4.4 Validation & Quality Assurance

#### A. Confidence Thresholds

```typescript
const filterByConfidence = (elements: Element[], threshold = 0.7) =>
    elements.filter(el => el.confidence >= threshold);
```

#### B. Box Sanity Checks

```typescript
const isValidBox = (box: BoundingBox): boolean => {
    return (
        box.top >= 0 && box.top <= 100 &&
        box.left >= 0 && box.left <= 100 &&
        box.width > 0.5 && box.width <= 100 &&  // Min 0.5% width
        box.height > 0.5 && box.height <= 100 && // Min 0.5% height
        box.top + box.height <= 100 &&
        box.left + box.width <= 100
    );
};
```

#### C. Overlap Deduplication

```typescript
const removeDuplicates = (elements: Element[], iouThreshold = 0.8) => {
    // Sort by confidence descending
    const sorted = [...elements].sort((a, b) => b.confidence - a.confidence);
    const kept: Element[] = [];

    for (const el of sorted) {
        const isDuplicate = kept.some(existing =>
            calculateIoU(el.box, existing.box) > iouThreshold
        );
        if (!isDuplicate) kept.push(el);
    }

    return kept;
};
```

---

## 5. Recommended Implementation Approach

### Priority Matrix

| Improvement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Fix coordinate normalization | High | Low | **P0** |
| Add box padding for inpainting | High | Low | **P0** |
| Few-shot examples in prompt | High | Medium | **P1** |
| Image preprocessing | Medium | Low | **P1** |
| Confidence filtering | Medium | Low | **P1** |
| Multi-pass inpainting | High | Medium | **P2** |
| Mask-based inpainting | High | Medium | **P2** |
| Hybrid YOLO + Gemini | Very High | High | **P3** (Future) |

### Quick Wins (Implement First)

1. **Explicit coordinate format in prompt** - Add "Return values as 0-100 percentages"
2. **Box padding** - Expand text boxes by 0.5% before inpainting
3. **Sanity checks** - Filter invalid boxes before processing
4. **Overlap removal** - Deduplicate detected elements

### Prompt Engineering Improvements

```typescript
// IMPROVED analyzeLayout prompt
const improvedLayoutPrompt = `
You are a precise document layout analyzer.

TASK: Detect all text and visual elements in this PowerPoint slide.

OUTPUT FORMAT: JSON with this exact structure:
{
    "backgroundColor": "#hexcolor",
    "elements": [
        {
            "type": "TEXT" | "VISUAL",
            "content": "text content (for TEXT only)",
            "description": "element description (for VISUAL only)",
            "box": {
                "top": <0-100 percentage>,
                "left": <0-100 percentage>,
                "width": <0-100 percentage>,
                "height": <0-100 percentage>
            },
            "confidence": <0-1>,
            "style": {
                "fontSize": "small" | "medium" | "large" | "title",
                "fontWeight": "normal" | "bold",
                "color": "#hexcolor",
                "alignment": "left" | "center" | "right"
            }
        }
    ]
}

CRITICAL RULES:
1. Coordinates are PERCENTAGES (0-100), NOT pixels or 0-1 normalized
2. Bounding boxes must be TIGHT - no extra padding or whitespace
3. TEXT = any readable characters, numbers, or symbols
4. VISUAL = icons, shapes, images, diagrams, charts (NOT text)
5. Confidence: 1.0 = certain, 0.5 = uncertain
6. Include ALL visible elements, even small icons

EXAMPLE:
For a slide with title "Hello" at top-center and a blue icon at bottom-left:
{
    "backgroundColor": "#ffffff",
    "elements": [
        { "type": "TEXT", "content": "Hello", "box": { "top": 5, "left": 30, "width": 40, "height": 8 }, "confidence": 0.95, "style": { "fontSize": "title", "fontWeight": "bold", "color": "#333333", "alignment": "center" } },
        { "type": "VISUAL", "description": "Blue circular icon", "box": { "top": 80, "left": 5, "width": 6, "height": 10 }, "confidence": 0.9 }
    ]
}

NOW ANALYZE THE PROVIDED IMAGE:
`;
```

---

## 6. Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Element Detection Recall | ~75% | 90%+ | Manual audit of 50 slides |
| Bounding Box IoU | ~65% | 85%+ | Compare to ground truth |
| Text Removal Quality (1-5) | ~3.0 | 4.0+ | User satisfaction survey |
| False Positive Rate | ~15% | <5% | Count incorrect detections |
| Processing Success Rate | ~85% | 95%+ | Track errors in production |

---

## 7. Conclusion

SlideDeconstruct AI có nền tảng tốt nhưng độ chính xác có thể cải thiện đáng kể thông qua:

1. **Quick Wins:** Prompt engineering tốt hơn, box padding, validation checks
2. **Medium Term:** Mask-based inpainting, multi-pass refinement
3. **Long Term:** Hybrid approach với YOLO cho detection chính xác hơn

**Key Insight:** Gemini rất mạnh về "understanding" (hiểu ngữ nghĩa) nhưng precision của bounding box là điểm yếu. Giải pháp tối ưu là kết hợp: dùng specialized detector cho boxes + Gemini cho semantic understanding.

---

## Sources

- [Gemini Vision Best Practices - Medium](https://medium.com)
- [AI Image Inpainting Techniques - MDPI](https://mdpi.com)
- [OCR Accuracy Improvement 2025 - SparkCo](https://sparkco.ai)
- [Gemini 3 vs 2.5 Comparison - Skywork.ai](https://skywork.ai)
- [Ultralytics YOLO Integration](https://ultralytics.com)

---

## Unresolved Questions

1. Should we add YOLO.js (WASM) for client-side object detection? (Adds ~5MB bundle size)
2. Is Tesseract.js OCR accurate enough for Vietnamese text?
3. Should mask images be sent as separate parts or encoded in prompt?
4. What's the acceptable processing time increase for multi-pass inpainting?
5. Should we expose confidence scores to users for transparency?
