# Phase 2: Anthropic API Integration

## Context Links
- Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-types-update.md](./phase-01-types-update.md)
- Research: [researcher-02-anthropic-response-format.md](./research/researcher-02-anthropic-response-format.md)

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 |
| Status | ✅ DONE |
| Effort | 2h |
| Completed | 2026-01-09 06:30 |
| Description | Add Anthropic SDK client, response extraction, and provider routing |

## Key Insights

1. Anthropic SDK works in browser with `dangerouslyAllowBrowser: true`
2. Response format: `response.content[].type` = "text" | "image"
3. Text extraction: `response.content.find(b => b.type === "text")?.text`
4. Image extraction: `response.content.find(b => b.type === "image")?.source?.data`
5. Need to route by task type: recognition vs drawing

## Requirements

- [x] Install `@anthropic-ai/sdk` package
- [x] Add `getAnthropicClient()` function
- [x] Add `callAnthropicChat()` for text/vision tasks
- [x] Add `callAnthropicImageGen()` for image generation
- [x] Add `extractAnthropicContent()` for response normalization
- [x] Update provider routing in all AI functions
- [x] Update `testModel()` for Anthropic

## Related Code Files

| File | Purpose |
|------|---------|
| `e:/AI_Google/slidedeconstruct-ai/services/geminiService.ts` | AI service layer |
| `e:/AI_Google/slidedeconstruct-ai/package.json` | Dependencies |

## Implementation Steps

### 1. Install Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

### 2. Add Imports (Top of geminiService.ts)

```typescript
import Anthropic from '@anthropic-ai/sdk';
```

### 3. Add Anthropic Client Factory (~Line 345)

```typescript
const getAnthropicClient = (overrideConfig?: ProviderConfig) => {
  const config = overrideConfig || currentSettings.anthropic;
  if (!config.apiKey) throw new Error("Anthropic API Key is missing.");

  return new Anthropic({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || 'http://127.0.0.1:8045',
    dangerouslyAllowBrowser: true,
  });
};
```

### 4. Add Anthropic Chat Function (~Line 355)

```typescript
interface AnthropicContentBlock {
  type: 'text' | 'image';
  text?: string;
  source?: { type: string; media_type: string; data: string };
}

const callAnthropicChat = async (
  systemPrompt: string,
  userPrompt: string,
  imageBase64?: string,
  model?: string
): Promise<{ text: string | null; image: string | null }> => {
  const config = currentSettings.anthropic;
  const client = getAnthropicClient();

  const content: any[] = [{ type: 'text', text: userPrompt }];

  if (imageBase64) {
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: imageBase64,
      },
    });
  }

  const response = await client.messages.create({
    model: model || config.recognitionModel,
    max_tokens: 16384,
    system: systemPrompt,
    messages: [{ role: 'user', content }],
  });

  // Extract content from response
  let text: string | null = null;
  let image: string | null = null;

  for (const block of response.content as AnthropicContentBlock[]) {
    if (block.type === 'text') text = block.text || null;
    if (block.type === 'image') image = block.source?.data || null;
  }

  return { text, image };
};
```

### 5. Add Provider Routing Helper

```typescript
const getRecognitionProvider = () => currentSettings.recognitionProvider || currentSettings.currentProvider;
const getDrawingProvider = () => currentSettings.drawingProvider || currentSettings.currentProvider;

const getProviderConfig = (provider: ProviderType): ProviderConfig => {
  return currentSettings[provider];
};
```

### 6. Update analyzeLayout() (Line ~816)

Replace single provider check with per-task routing:

```typescript
export const analyzeLayout = async (base64Image: string): Promise<SlideAnalysisResult> => {
  // ... existing preprocessing code ...

  const provider = getRecognitionProvider();
  let jsonText = "";

  try {
    if (provider === 'gemini') {
      // Existing Gemini code...
    } else if (provider === 'anthropic') {
      const result = await callAnthropicChat(
        "JSON Generator",
        prompt + " Strictly follow the JSON schema.",
        cleanBase64,
        currentSettings.anthropic.recognitionModel
      );
      jsonText = result.text || "";
    } else {
      // Existing OpenAI code...
    }
    // ... rest of function ...
  }
};
```

### 7. Update removeTextFromImage() (Line ~430)

```typescript
export const removeTextFromImage = async (...) => {
  // ... existing code ...

  const provider = getDrawingProvider();

  try {
    if (provider === 'gemini') {
      // Existing Gemini code...
    } else if (provider === 'anthropic') {
      const result = await callAnthropicChat(
        "Image Editor",
        prompt,
        cleanBase64,
        currentSettings.anthropic.drawingModel
      );
      return result.image;
    } else {
      // Existing OpenAI code...
    }
  }
};
```

### 8. Update testModel() (Line ~359)

```typescript
export const testModel = async (
  type: 'recognition' | 'drawing',
  provider: 'gemini' | 'openai' | 'anthropic',
  config: ProviderConfig
): Promise<{ success: boolean; message: string }> => {
  try {
    if (!config.apiKey) return { success: false, message: "API Key Missing" };

    if (provider === 'anthropic') {
      const client = getAnthropicClient(config);
      const modelName = type === 'recognition' ? config.recognitionModel : config.drawingModel;

      try {
        await client.messages.create({
          model: modelName,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }],
        });
        return { success: true, message: "Connected" };
      } catch (e: any) {
        if (e.status === 401) return { success: false, message: "401 Unauthorized" };
        if (e.status === 404) return { success: false, message: `Model '${modelName}' not found` };
        throw e;
      }
    }

    // Existing gemini/openai code...
  }
};
```

### 9. Functions to Update (Provider Routing)

| Function | Task Type | Use Provider |
|----------|-----------|--------------|
| `analyzeLayout` | Recognition | `recognitionProvider` |
| `refineElement` | Recognition | `recognitionProvider` |
| `analyzeVisualToVector` | Recognition | `recognitionProvider` |
| `removeTextFromImage` | Drawing | `drawingProvider` |
| `removeTextMultiPass` | Drawing | `drawingProvider` |
| `eraseAreasFromImage` | Drawing | `drawingProvider` |
| `regenerateVisualElement` | Drawing | `drawingProvider` |

## Todo List

- [ ] Run `npm install @anthropic-ai/sdk`
- [ ] Add Anthropic import
- [ ] Add `getAnthropicClient()` function
- [ ] Add `callAnthropicChat()` function
- [ ] Add provider routing helpers
- [ ] Update `analyzeLayout()` with Anthropic branch
- [ ] Update `refineElement()` with Anthropic branch
- [ ] Update `analyzeVisualToVector()` with Anthropic branch
- [ ] Update `removeTextFromImage()` with Anthropic branch
- [ ] Update `removeTextMultiPass()` with Anthropic branch
- [ ] Update `eraseAreasFromImage()` with Anthropic branch
- [ ] Update `regenerateVisualElement()` with Anthropic branch
- [ ] Update `testModel()` for Anthropic

## Success Criteria

- [x] Anthropic SDK installed without errors
- [x] `callAnthropicChat()` returns text/image correctly
- [x] Provider routing works for all functions
- [x] `testModel()` validates Anthropic connection
- [x] No TypeScript errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SDK bundle size impact | Low | Low | Tree-shakeable, ~50KB gzipped |
| Proxy CORS issues | Medium | High | Proxy handles CORS headers |
| Response format mismatch | Low | Medium | Research documented format |
| Rate limiting | Low | Medium | Existing retry logic applies |
