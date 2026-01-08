# AI Image Inpainting & Text Removal Best Practices (2025/2026)

## 1. Mask-Based vs Coordinate-Based Inpainting

### Mask-Based (Recommended)
- **Dominant approach** for general inpainting in 2025
- User/system provides binary mask indicating regions to fill
- Works with CNNs, GANs, Diffusion models (Stable Diffusion, Gemini)
- **Pros**: Precise control, semantic context preservation, iterative refinement
- **Cons**: Mask quality directly impacts result quality

### Coordinate-Based
- Niche use case: pose-guided human image generation, texture mapping
- Estimates source location for each surface element instead of direct pixel synthesis
- Less blurred details in high-uncertainty scenarios
- **Not recommended** for general text removal tasks

**Recommendation**: Use mask-based approach for text removal workflows.

## 2. Multi-Pass Inpainting Techniques

### Strategies for Artifact Removal
1. **Coarse-to-Fine**: Initial pass for structure, refinement pass for details
2. **Cascaded Inpainting**: Combine detection + inpainting in pipeline
3. **Adaptive Multi-Method**: Switch between methods based on artifact type
4. **ControlNet + Differential Diffusion**: ComfyUI workflows with 32+ inpainting options

### Implementation Pattern
```
Pass 1: Remove text with generous mask padding
Pass 2: Refine edges with tighter mask on residual artifacts
Pass 3: (Optional) Color/texture harmonization
```

### Key Insight
- Automatic artifact detection mechanism between passes
- Dynamic adjustment based on artifact nature (blur vs edge vs color)

## 3. Gemini API Best Practices for Inpainting

### Model Selection (2025)
- **Gemini 2.0 Flash**: Conversational editing, natural language instructions
- **Gemini 2.5 Flash Image**: Fast, low-latency, masked edits, multi-image fusion
- **Imagen 3**: Explicit mask required (mask-free editing deprecated)

### Mask Parameter Usage
```javascript
referenceImages: [
  { type: 'REFERENCE_TYPE_RAW', image: baseImageBase64 },
  { type: 'REFERENCE_TYPE_MASK', image: maskImageBase64, maskImageConfig: { maskMode: 'MASK_MODE_USER_PROVIDED' } }
]
```

### Mask Specifications
- Format: Black/white image (non-zero = edit region)
- Encoding: Base64
- Size: <=10MB, **must match base image dimensions exactly**
- Modes: `USER_PROVIDED`, `BACKGROUND`, `FOREGROUND`

### Conversational Alternative
- Gemini 2.0 Flash supports localized edits via natural language
- No explicit mask needed for simple removals
- Example prompt: "Remove the text from this slide while preserving the background"

## 4. Box Padding Strategies for Text Removal

### Padding Guidelines
| Background Complexity | Recommended Padding |
|-----------------------|---------------------|
| Uniform/solid color   | 2-5 pixels          |
| Gradient              | 5-10 pixels         |
| Textured/pattern      | 10-20 pixels        |
| Complex scene         | 15-25 pixels        |

### Best Practices
1. **Avoid tight masks**: Model needs context for seamless reconstruction
2. **Avoid excessive padding**: Increases synthesis area, more inconsistencies
3. **Adaptive padding**: Adjust per-text-region based on local complexity
4. **Shape optimization**: Non-rectangular masks outperform simple boxes for complex backgrounds
5. **Include stroke edges**: Ensure anti-aliased text edges are fully within mask

### Formula Suggestion
```
padding = base_padding + (background_complexity_score * multiplier)
// base_padding = 5px, multiplier = 3-5
```

## 5. Quality Metrics & Validation

### Metrics Comparison
| Metric | Measures | Human Correlation | Speed |
|--------|----------|-------------------|-------|
| PSNR   | Pixel fidelity | Low | Fast |
| SSIM   | Structural similarity | Medium | Fast |
| LPIPS  | Perceptual similarity | High | Medium |
| FID    | Distribution distance | High | Slow |

### Recommended Validation Pipeline
1. **Automated Checks**:
   - LPIPS < 0.15 (good perceptual similarity)
   - SSIM > 0.85 (structural preservation)
   - Text detection confidence < 0.1 on inpainted region (verify removal)

2. **Visual Validation**:
   - Edge artifact detection (Sobel filter on inpainted boundaries)
   - Color histogram comparison (original vs inpainted region surroundings)

3. **Fallback Strategy**:
   - If metrics fail threshold, trigger second inpainting pass
   - If second pass fails, return original with warning

### Practical Implementation
```javascript
const validateInpainting = (original, result, mask) => {
  const lpips = computeLPIPS(original, result);
  const textConfidence = detectText(result, mask);
  return lpips < 0.15 && textConfidence < 0.1;
};
```

## Actionable Recommendations

1. **Use mask-based inpainting** with Gemini 2.0/2.5 Flash for text removal
2. **Implement 2-pass pipeline**: coarse removal + edge refinement
3. **Apply adaptive padding**: 5-20px based on background complexity
4. **Validate with LPIPS + text detection** before returning results
5. **Fallback to conversational editing** for simple cases without explicit masks
6. **Cache mask generation** for repeated text positions in slide templates

## Sources
- [MDPI - Image Inpainting Survey](https://mdpi.com)
- [Google AI Blog - Gemini Updates](https://googleblog.com)
- [Google Developers - Gemini API](https://google.dev)
- [arXiv - CVPR 2025 Inpainting Papers](https://arxiv.org)
- [ResearchGate - Text Removal Methods](https://researchgate.net)
