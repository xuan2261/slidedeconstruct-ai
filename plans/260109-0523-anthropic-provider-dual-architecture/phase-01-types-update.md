# Phase 1: Types Update

## Context Links
- Plan: [plan.md](./plan.md)
- Research: [researcher-01-anthropic-sdk-browser.md](./research/researcher-01-anthropic-sdk-browser.md)

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 |
| Status | ✅ DONE |
| Completed | 2026-01-09 06:11 |
| Effort | 30m |
| Description | Add Anthropic provider config and per-task provider selection to types |

## Key Insights

1. Current `currentProvider: 'gemini' | 'openai'` controls ALL tasks
2. Need separate `recognitionProvider` and `drawingProvider` fields
3. Add `anthropic: ProviderConfig` alongside existing gemini/openai
4. Maintain backward compatibility with existing settings

## Requirements

- [ ] Add `anthropic` to provider union type
- [ ] Add `recognitionProvider` field
- [ ] Add `drawingProvider` field
- [ ] Add `anthropic: ProviderConfig` configuration
- [ ] Update `DEFAULT_AI_SETTINGS` with defaults
- [ ] Keep `currentProvider` for backward compat (deprecated)

## Related Code Files

| File | Purpose |
|------|---------|
| `e:/AI_Google/slidedeconstruct-ai/types.ts` | Type definitions |

## Implementation Steps

### 1. Update Provider Type (Line ~69)

```typescript
// Before
export interface AISettings {
  currentProvider: 'gemini' | 'openai';
  gemini: ProviderConfig;
  openai: ProviderConfig;
  // ...
}

// After
export type ProviderType = 'gemini' | 'openai' | 'anthropic';

export interface AISettings {
  // Legacy - kept for backward compatibility, will be removed in future
  currentProvider: ProviderType;

  // NEW: Per-task provider selection
  recognitionProvider: ProviderType;
  drawingProvider: ProviderType;

  // Provider configurations
  gemini: ProviderConfig;
  openai: ProviderConfig;
  anthropic: ProviderConfig; // NEW

  confidenceThreshold: number;
  enableMultiPassInpainting: boolean;
  hybridDetection: HybridDetectionSettings;
}
```

### 2. Update DEFAULT_AI_SETTINGS (Line ~77-98)

```typescript
export const DEFAULT_AI_SETTINGS: AISettings = {
  currentProvider: 'gemini', // Legacy
  recognitionProvider: 'gemini', // NEW
  drawingProvider: 'gemini',     // NEW
  gemini: {
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com',
    recognitionModel: 'gemini-3-pro-preview',
    drawingModel: 'gemini-2.5-flash-image',
  },
  openai: {
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    recognitionModel: 'gpt-4o',
    drawingModel: 'dall-e-3',
  },
  anthropic: { // NEW
    apiKey: '',
    baseUrl: 'http://127.0.0.1:8045', // Antigravity proxy default
    recognitionModel: 'claude-sonnet-4-20250514',
    drawingModel: 'claude-sonnet-4-20250514',
  },
  confidenceThreshold: 0.6,
  enableMultiPassInpainting: true,
  hybridDetection: {
    enabled: false,
    useTesseract: true,
    preferClientBoxes: true,
  },
};
```

### 3. Add Migration Helper (Optional)

```typescript
// Helper to migrate old settings to new format
export const migrateSettings = (old: Partial<AISettings>): AISettings => {
  const defaults = { ...DEFAULT_AI_SETTINGS };

  // If old settings exist without new fields, use currentProvider for both
  if (old.currentProvider && !old.recognitionProvider) {
    defaults.recognitionProvider = old.currentProvider;
    defaults.drawingProvider = old.currentProvider;
  }

  return { ...defaults, ...old };
};
```

## Todo List

- [ ] Add `ProviderType` type alias
- [ ] Add `recognitionProvider` to AISettings
- [ ] Add `drawingProvider` to AISettings
- [ ] Add `anthropic: ProviderConfig` to AISettings
- [ ] Update DEFAULT_AI_SETTINGS with anthropic defaults
- [ ] Add migration helper for backward compat

## Success Criteria

- [ ] TypeScript compiles without errors
- [ ] New fields accessible in code
- [ ] Default values set correctly
- [ ] Existing code continues to work

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing saved settings | Medium | Low | Migration helper auto-fills new fields |
| Type conflicts | Low | Medium | Keep `currentProvider` temporarily |
