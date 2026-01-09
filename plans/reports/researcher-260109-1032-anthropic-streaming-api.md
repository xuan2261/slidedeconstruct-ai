# Anthropic SDK Streaming Implementation for Browser/TypeScript

## Summary

Research on implementing streaming for `@anthropic-ai/sdk` in browser environment with proxy at `localhost:8045`.

---

## 1. Streaming API Methods

### Method A: `client.messages.stream()` (Recommended)
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: 'your-key',
  baseURL: 'http://127.0.0.1:8045',
  dangerouslyAllowBrowser: true,
});

const stream = client.messages.stream({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 16384,
  system: 'JSON Generator',
  messages: [{ role: 'user', content: [...] }],
});

// Event-based handling
stream.on('text', (textDelta, textSnapshot) => {
  console.log('Delta:', textDelta);       // Incremental text
  console.log('Accumulated:', textSnapshot); // Full text so far
});

stream.on('message', (message) => {
  console.log('Complete:', message);
});

stream.on('error', (error) => {
  console.error('Stream error:', error);
});

// Get final result
const finalMessage = await stream.finalMessage();
const finalText = await stream.finalText();
```

### Method B: `client.messages.create({ stream: true })`
```typescript
const stream = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 16384,
  messages: [{ role: 'user', content: 'Hello' }],
  stream: true,
});

for await (const event of stream) {
  if (event.type === 'content_block_delta') {
    if (event.delta.type === 'text_delta') {
      console.log(event.delta.text);
    }
  }
}
```

**Key Difference:**
| Method | Memory | Features |
|--------|--------|----------|
| `messages.stream()` | Higher (accumulates) | Event handlers, `finalMessage()`, `finalText()` |
| `messages.create({ stream: true })` | Lower | Async iterator only |

---

## 2. Event Types & Response Format

### Event Flow
```
message_start -> content_block_start -> content_block_delta* -> content_block_stop -> message_delta -> message_stop
```

### Delta Types
```typescript
// Text delta
{ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Hello' } }

// Input JSON delta (tool use)
{ type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"key":' } }

// Thinking delta (extended thinking)
{ type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: 'Let me...' } }
```

### MessageStream Events
| Event | Callback Signature | Description |
|-------|-------------------|-------------|
| `connect` | `() => void` | Connection established |
| `text` | `(textDelta, textSnapshot) => void` | Text chunk received |
| `message` | `(message) => void` | Message complete |
| `contentBlock` | `(block) => void` | Content block complete |
| `error` | `(error) => void` | Error occurred |
| `abort` | `(error) => void` | Stream aborted |
| `end` | `() => void` | Stream ended |

---

## 3. Image Handling in Streaming

**Important:** Anthropic API does NOT support streaming image generation natively.

Current project uses proxy (Antigravity) that may route to Gemini for image generation. For streaming:

```typescript
// Text responses stream normally
// Image responses come as complete blocks at end

interface AnthropicContentBlock {
  type: 'text' | 'image';
  text?: string;
  source?: { type: string; media_type: string; data: string };
}

// In streaming, images appear in finalMessage only
const result = await stream.finalMessage();
for (const block of result.content) {
  if (block.type === 'text') {
    // Text content
  } else if (block.type === 'image') {
    // Image base64 in block.source.data (proxy-dependent)
  }
}
```

---

## 4. Error Handling Best Practices

```typescript
import Anthropic from '@anthropic-ai/sdk';

const callAnthropicStreaming = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 2000
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Rate limit detection
    const isRateLimit =
      error?.status === 429 ||
      error?.error?.type === 'rate_limit_error' ||
      error instanceof Anthropic.RateLimitError ||
      (error?.message?.includes('429') || error?.message?.includes('overloaded'));

    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit. Retry in ${delay}ms (${retries} left)`);
      await new Promise(r => setTimeout(r, delay));
      return callAnthropicStreaming(fn, retries - 1, delay * 2);
    }

    // Handle specific errors
    if (error instanceof Anthropic.APIError) {
      console.error(`API Error ${error.status}: ${error.message}`);
    }

    throw error;
  }
};

// Stream-specific error handling
stream.on('error', (error) => {
  if (error instanceof Anthropic.APIError) {
    // Handle API errors (4xx, 5xx)
  } else if (error instanceof Anthropic.APIConnectionError) {
    // Network issues
  }
});
```

### SSE Error Events
```json
{ "type": "error", "error": { "type": "overloaded_error", "message": "Overloaded" } }
```

---

## 5. Accumulation Pattern for Project

### Recommended Implementation
```typescript
interface StreamingResult {
  text: string | null;
  image: string | null;
}

const callAnthropicChatStreaming = async (
  systemPrompt: string,
  userPrompt: string,
  imageBase64?: string,
  model?: string,
  onTextDelta?: (delta: string, snapshot: string) => void
): Promise<StreamingResult> => {
  const config = currentSettings.anthropic;
  const client = getAnthropicClient();

  const content: any[] = [];
  if (imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: imageBase64 },
    });
  }
  content.push({ type: 'text', text: userPrompt });

  const stream = client.messages.stream({
    model: model || config.recognitionModel,
    max_tokens: 16384,
    system: systemPrompt,
    messages: [{ role: 'user', content }],
  });

  // Real-time text updates
  if (onTextDelta) {
    stream.on('text', onTextDelta);
  }

  // Error handling
  stream.on('error', (error) => {
    console.error('Stream error:', error);
  });

  // Wait for completion
  const finalMessage = await stream.finalMessage();

  // Extract results
  let text: string | null = null;
  let image: string | null = null;

  for (const block of finalMessage.content) {
    if (block.type === 'text') {
      text = block.text;
    } else if (block.type === 'image' && 'source' in block) {
      image = (block as any).source?.data || null;
    }
  }

  return { text, image };
};
```

### Usage in analyzeLayout
```typescript
export const analyzeLayoutStreaming = async (
  base64Image: string,
  onProgress?: (text: string) => void
): Promise<SlideAnalysisResult> => {
  const cleanBase64 = extractBase64(await standardizeImage(base64Image));

  const result = await callAnthropicChatStreaming(
    'JSON Generator',
    LAYOUT_PROMPT,
    cleanBase64,
    currentSettings.anthropic.recognitionModel,
    (delta, snapshot) => {
      onProgress?.(snapshot); // Update UI with partial JSON
    }
  );

  // Parse final JSON
  const data = tryParseJSON(cleanJsonString(result.text || ''));
  // ... rest of processing
};
```

---

## 6. Cancellation

```typescript
// Method 1: Break from loop
for await (const event of stream) {
  if (shouldCancel) break;
}

// Method 2: Abort controller
stream.abort(); // or stream.controller.abort()
```

---

## Key Recommendations

1. **Use `messages.stream()`** for long operations - provides better UX with real-time feedback
2. **Keep non-streaming for short calls** like `testModel()` - less overhead
3. **Images don't stream** - proxy returns complete image at end
4. **Wrap with retry logic** - same pattern as existing `callAnthropicWithRetry`
5. **Pass `onTextDelta` callback** to UI for progress updates

---

## Sources

- [Anthropic SDK TypeScript](https://github.com/anthropics/anthropic-sdk-typescript)
- [Streaming Helpers Documentation](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/helpers.md)
- [Messages Streaming API](https://platform.claude.com/docs/en/api/messages-streaming)
