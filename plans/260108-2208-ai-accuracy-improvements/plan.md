---
title: "AI Accuracy Improvements"
description: "Improve layout detection, bounding box precision, and text removal quality"
status: in-progress
priority: P1
effort: 40h
branch: main
tags: [ai, accuracy, gemini, inpainting, validation]
created: 2026-01-08
---

# AI Accuracy Improvements Plan

## Objective

Improve SlideDeconstruct AI accuracy metrics:
- Element Detection Recall: 75% → 90%+
- Bounding Box IoU: 65% → 85%+
- Text Removal Quality: 60-70% → 85%+

## Research Summary

| Topic | Key Finding | Source |
|-------|-------------|--------|
| Inpainting | Mask-based is standard; 2-pass recommended | [researcher-inpainting-techniques.md](research/researcher-inpainting-techniques.md) |
| Client YOLO | Keep Gemini for accuracy; YOLO optional | [researcher-yolo-client-side.md](research/researcher-yolo-client-side.md) |

## Implementation Phases

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| [Phase 1](phase-01-quick-wins.md) | P0: Coordinate fix, padding, validation | 4h | done |
| [Phase 2](phase-02-enhanced-prompts.md) | P1: Few-shot, preprocessing, confidence | 8h | done |
| [Phase 3](phase-03-advanced-inpainting.md) | P2: Mask-based, multi-pass inpainting | 12h | pending |
| [Phase 4](phase-04-hybrid-detection.md) | P3: Tesseract.js, optional YOLO | 16h | pending |

## Files to Modify

| File | Changes |
|------|---------|
| `services/geminiService.ts` | Prompts, schemas, mask support |
| `types.ts` | Add confidence, expanded types |
| `utils/box-validation.ts` | NEW: Sanity checks, IoU, dedup |
| `utils/image-preprocessing.ts` | NEW: Standardize, mask generation |

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Element Detection Recall | ~75% | 90%+ |
| Bounding Box IoU | ~65% | 85%+ |
| Text Removal Quality | ~65% | 85%+ |

## Risks

- Gemini API changes may break mask format
- Bundle size increase if P3 implemented

## Validation Summary

**Validated:** 2026-01-08
**Questions asked:** 4

### Confirmed Decisions
| Decision | User Choice |
|----------|-------------|
| Box padding approach | Fixed 0.5% padding |
| Confidence threshold | 0.6 (filter low-confidence) |
| Multi-pass inpainting | Always 2-pass for quality |
| Phase 4 inclusion | Include Tesseract.js hybrid detection |

### Action Items
- [x] Plan validated - no changes needed
- [x] Phase 1 implementation completed (2026-01-09)
- [x] Phase 2 implementation completed (2026-01-09)
- [ ] Proceed with Phase 3 implementation
