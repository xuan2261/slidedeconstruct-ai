---
title: "Dual-Provider Architecture with Anthropic Support"
description: "Add Anthropic as third provider with per-task-type selection (Recognition vs Drawing)"
status: completed
priority: P1
effort: 5h
branch: main
tags: [backend, api, feature, anthropic]
created: 2026-01-09
---

## Problem

1. `gemini-3-pro-high` returns 429 on `:generateContent` but works on `:streamGenerateContent?alt=sse`
2. User needs Antigravity proxy support with Anthropic protocol to call Gemini models
3. Current architecture: single `currentProvider` for all tasks

## Solution

Add Anthropic as third provider with **per-task-type provider selection**:
- `recognitionProvider`: Provider for layout analysis (vision tasks)
- `drawingProvider`: Provider for image generation (inpainting tasks)

## Architecture Changes

```
Current:  currentProvider -> all tasks
Proposed: recognitionProvider -> analyzeLayout, refineElement, analyzeVisualToVector
          drawingProvider -> removeTextFromImage, regenerateVisualElement, eraseAreasFromImage
```

## Phases

| Phase | Description | Effort | Files |
|-------|-------------|--------|-------|
| 1 | Types Update | 30m | `types.ts` | ✅ DONE |
| 2 | Anthropic Integration | 2h | `services/geminiService.ts` | ✅ DONE |
| 3 | Settings UI | 1h | `components/SettingsModal.tsx` | ✅ DONE |
| 4 | Testing | 30m | Manual testing | ✅ DONE |

## Key Files

- `e:/AI_Google/slidedeconstruct-ai/types.ts` (172 LOC)
- `e:/AI_Google/slidedeconstruct-ai/services/geminiService.ts` (1098 LOC)
- `e:/AI_Google/slidedeconstruct-ai/components/SettingsModal.tsx` (319 LOC)

## Research References

- `plans/260109-0523-anthropic-provider-dual-architecture/research/researcher-01-anthropic-sdk-browser.md`
- `plans/260109-0523-anthropic-provider-dual-architecture/research/researcher-02-anthropic-response-format.md`

## Success Criteria

- [x] Anthropic SDK installed and working in browser
- [x] Per-task provider selection functional
- [x] Settings UI updated with Anthropic tab
- [x] All provider combinations tested

## Validation Summary

**Validated:** 2026-01-09
**Questions asked:** 4

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| Default Anthropic models | Claude Sonnet 4 native |
| Legacy `currentProvider` | Keep as fallback |
| Proxy unavailable | Show error only |
| Streaming support | **Full streaming** (scope expanded) |

### Action Items

- [ ] Update Phase 1: Set default models to `claude-sonnet-4-20250514`
- [ ] Update Phase 2: Keep `currentProvider` as fallback in routing helpers
- [ ] Update Phase 2: **Add streaming implementation** (new scope)
- [ ] Update effort estimate: +1h for streaming

### Scope Change

**⚠️ Streaming added to scope** - Phase 2 effort increased from 2h to 3h.

## Unresolved Questions

None - validation complete.
