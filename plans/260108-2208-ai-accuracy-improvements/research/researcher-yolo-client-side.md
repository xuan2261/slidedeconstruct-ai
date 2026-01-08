# Client-Side YOLO Implementation Research (2025/2026)

## Executive Summary

YOLO browser deployment is mature via ONNX Runtime Web + WASM. For text detection in slides, **YOLO detects regions, Tesseract.js recognizes text** - they complement, not compete.

---

## 1. YOLO Browser Implementation Options

### Primary Stack: ONNX Runtime Web
- **Recommended**: Export YOLO to ONNX format, run via `onnxruntime-web`
- **Backends**: WebGPU (fastest, Chromium only) → WASM fallback (universal)
- **Supporting libs**: OpenCV.js for preprocessing, separate NMS ONNX model

### Alternative Approaches
| Approach | Pros | Cons |
|----------|------|------|
| ONNX Runtime Web | Mature, WebGPU support | Requires ONNX export |
| TensorFlow.js | Good React integration | Slower than ONNX |
| Rust+WASM (Candle) | Minimal deps | Complex setup |

---

## 2. Bundle Size & Performance

### Model Sizes (ONNX format)
| Model | Size | Parameters | mAP | Browser Suitable |
|-------|------|------------|-----|------------------|
| YOLOv8n (nano) | ~13 MB | 3.2M | 37.3 | **Recommended** |
| YOLOv8s (small) | ~22 MB | 11.2M | 44.9 | OK with lazy load |
| YOLOv11n | ~10 MB | 2.6M | - | Best for mobile |

### Runtime Bundle
- `onnxruntime-web/wasm`: ~2-3 MB (conditional import)
- WASM binaries: ~8-15 MB (CDN cacheable)
- OpenCV.js: ~8 MB

### Performance Benchmarks
- **Inference**: 50-200ms per image (WASM), 20-50ms (WebGPU)
- **MacBook Pro**: YOLOv8n real-time capable
- **Mobile**: YOLOv11n recommended

---

## 3. Text/Document Detection Accuracy

### YOLO for Text Region Detection
- mAP 0.90, F1 0.89 reported for specialized text detection models
- Works best with preprocessing: grayscale, contrast enhancement, noise reduction
- Good for: slide text boxes, tables, headers

### Limitations
- YOLO detects WHERE text is, not WHAT it says
- Struggles with very small text
- Requires fine-tuned model for document-specific detection

---

## 4. React Integration

### Basic Setup
```typescript
// Conditional import for smaller bundle
import * as ort from 'onnxruntime-web/wasm';

// Set WASM path to CDN
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

// Load model
const session = await ort.InferenceSession.create('/models/yolov8n.onnx');
```

### Optimization Tips
1. Lazy load model on first use
2. Use Web Worker for inference (non-blocking)
3. Cache model in IndexedDB
4. Preload during idle time

---

## 5. YOLO vs Tesseract.js Comparison

| Aspect | YOLO | Tesseract.js |
|--------|------|--------------|
| **Purpose** | Object/region detection | Text recognition (OCR) |
| **Output** | Bounding boxes | Extracted text strings |
| **Bundle** | ~13MB model + 10MB runtime | ~197KB core + 15MB lang data |
| **Speed** | 50-200ms | 500-2000ms |
| **Use Case** | Find text regions | Read text content |

### Verdict: Complementary, Not Competitive
- **YOLO**: Detect text regions in slides (faster, accurate localization)
- **Tesseract.js**: Extract actual text from detected regions
- **Best Pipeline**: YOLO detect → crop region → Tesseract OCR

---

## 6. Recommendations for SlideDeconstruct

### Option A: Server-Side (Current) - Keep
- Gemini API already handles detection + OCR
- No bundle size increase
- Better accuracy for complex slides

### Option B: Hybrid Approach
- Use client-side YOLO for quick preview/validation
- Server-side Gemini for final accurate extraction
- Adds ~25MB to client bundle

### Option C: Full Client-Side
- YOLOv8n + Tesseract.js pipeline
- Privacy benefit, no API costs
- Lower accuracy than Gemini

### Recommendation
**Stay with server-side Gemini** for accuracy-critical text extraction. Client-side YOLO only beneficial if:
- Offline support required
- Real-time preview needed
- API cost reduction priority

---

## Unresolved Questions

1. Specific accuracy comparison: YOLO+Tesseract vs Gemini for slide text?
2. WebGPU adoption rate in target browsers?
3. Fine-tuned YOLO models for presentation/slide detection available?

---

## Sources

- [PyImageSearch - YOLO Browser](https://pyimagesearch.com)
- [ONNX Runtime Web Docs](https://onnxruntime.ai)
- [Ultralytics YOLO](https://ultralytics.com)
- [Tesseract.js GitHub](https://github.com/naptha/tesseract.js)
- [Bundlephobia - tesseract.js-core](https://bundlephobia.com)
