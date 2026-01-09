# Brainstorm: Anthropic Provider + Streaming Fix

**Date:** 2026-01-09 05:17
**Status:** Approved
**Priority:** High

---

## Problem Statement

### Issue 1: gemini-3-pro-high 429 Error
- `gemini-3-pro-image` works with `:generateContent` endpoint
- `gemini-3-pro-high` fails (429) on `:generateContent`
- `gemini-3-pro-high` works on `:streamGenerateContent?alt=sse` (Cherry Studio)
- **Root cause:** Proxy rate-limits differ by model+endpoint combination

### Issue 2: Need More Provider Flexibility
- User wants to use Antigravity proxy with Anthropic protocol
- Antigravity supports calling Gemini models via Anthropic SDK
- Future: Claude models support

---

## Solution: Dual-Provider Architecture

### Architecture Overview

```
AISettings
├── recognitionProvider: 'gemini' | 'openai' | 'anthropic'
├── drawingProvider: 'gemini' | 'openai' | 'anthropic'
├── gemini: ProviderConfig
├── openai: ProviderConfig
└── anthropic: ProviderConfig (NEW)
```

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Provider scope | Per-task-type | Max flexibility for Recognition vs Drawing |
| Anthropic for both | Yes | User confirmed proxy works for both |
| Dependency | Add @anthropic-ai/sdk | User approved |
| Streaming | Optional enhancement | Anthropic solves 429 via proxy |

---

## Implementation Scope

### Files to Modify

| File | Changes | LOC Est. |
|------|---------|----------|
| `types.ts` | Add `anthropic` config, separate provider fields | ~30 |
| `services/geminiService.ts` | Add Anthropic API calls, update provider routing | ~120 |
| `components/SettingsModal.tsx` | Add Anthropic tab, separate provider dropdowns | ~80 |
| `package.json` | Add `@anthropic-ai/sdk` | ~1 |

**Total estimated: ~230 lines**

### New Types (types.ts)

```typescript
export interface AISettings {
  // Separate providers per task type
  recognitionProvider: 'gemini' | 'openai' | 'anthropic';
  drawingProvider: 'gemini' | 'openai' | 'anthropic';

  gemini: ProviderConfig;
  openai: ProviderConfig;
  anthropic: ProviderConfig; // NEW

  // ... existing fields
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  recognitionProvider: 'gemini',
  drawingProvider: 'gemini',
  gemini: { /* existing */ },
  openai: { /* existing */ },
  anthropic: {
    apiKey: '',
    baseUrl: 'http://127.0.0.1:8045',
    recognitionModel: 'gemini-3-pro-high',
    drawingModel: 'gemini-3-pro-image',
  },
  // ...
};
```

### Anthropic API Integration (geminiService.ts)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const getAnthropicClient = (config?: ProviderConfig) => {
  const cfg = config || currentSettings.anthropic;
  return new Anthropic({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseUrl,
  });
};

const callAnthropicChat = async (
  prompt: string,
  imageBase64?: string
): Promise<string> => {
  const client = getAnthropicClient();
  const config = currentSettings.anthropic;

  const content: any[] = [{ type: 'text', text: prompt }];
  if (imageBase64) {
    content.unshift({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: imageBase64 }
    });
  }

  const response = await client.messages.create({
    model: config.recognitionModel,
    max_tokens: 16384,
    messages: [{ role: 'user', content }]
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
};
```

### Provider Routing Logic

```typescript
// In analyzeLayout, removeTextFromImage, etc.
const getRecognitionProvider = () => currentSettings.recognitionProvider;
const getDrawingProvider = () => currentSettings.drawingProvider;

// Example usage in analyzeLayout
if (getRecognitionProvider() === 'anthropic') {
  jsonText = await callAnthropicChat(prompt, cleanBase64);
} else if (getRecognitionProvider() === 'gemini') {
  // existing Gemini code
} else {
  // existing OpenAI code
}
```

---

## UI Design (SettingsModal)

### Layout

```
┌─────────────────────────────────────────────────┐
│ AI Settings                               [X]   │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Recognition Task                            │ │
│ │ Provider: [Dropdown: Gemini|OpenAI|Anthro] │ │
│ │ Model:    [________________]                │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Drawing Task                                │ │
│ │ Provider: [Dropdown: Gemini|OpenAI|Anthro] │ │
│ │ Model:    [________________]                │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Provider Configs (Tabs)                     │ │
│ │ [Gemini] [OpenAI] [Anthropic]               │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ API Key: [________________________]     │ │ │
│ │ │ Base URL: [_______________________]     │ │ │
│ │ │ [Test Connection]                       │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────┘ │
│                              [Cancel] [Save]    │
└─────────────────────────────────────────────────┘
```

---

## Risk Assessment

| Risk | Prob | Impact | Mitigation |
|------|------|--------|------------|
| Anthropic SDK browser compatibility | Low | High | Test in browser env, fallback to fetch |
| Image response format differs | Medium | Medium | Normalize response handling |
| Proxy downtime | Low | High | Fallback to native Gemini |
| Rate limit on Anthropic endpoint | Low | Medium | Retry logic with exponential backoff |

---

## Success Metrics

1. ✅ gemini-3-pro-high works for Recognition via Anthropic provider
2. ✅ Drawing tasks work via Anthropic provider
3. ✅ User can configure separate providers for Recognition/Drawing
4. ✅ All existing tests pass
5. ✅ Settings persist correctly

---

## Dependencies

- `@anthropic-ai/sdk` - Anthropic official SDK
- Antigravity proxy running at configured baseUrl

---

## Next Steps

1. Add Anthropic SDK dependency
2. Update types.ts with new config structure
3. Implement Anthropic API calls in geminiService.ts
4. Update SettingsModal UI
5. Test all provider combinations
6. Update documentation

---

## Unresolved Questions

1. Does Anthropic SDK work in browser environment? (May need to use fetch directly)
2. Image generation response format from Antigravity proxy - same as Claude or Gemini?
