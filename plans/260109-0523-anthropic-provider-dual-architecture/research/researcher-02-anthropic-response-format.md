# Research: Anthropic Proxy Response Format

**Date:** 2026-01-09 | **Task:** Antigravity proxy response format analysis

## 1. Anthropic Messages API Response Structure

Standard Anthropic response format:

```typescript
interface AnthropicResponse {
  id: string;                    // "msg_01XFDUDYJgAACzvnptvVoYEL"
  type: "message";
  role: "assistant";
  content: ContentBlock[];       // Array of content blocks
  model: string;
  stop_reason: "end_turn" | "max_tokens" | "stop_sequence" | "tool_use";
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

type ContentBlock = TextBlock | ImageBlock | ToolUseBlock;

interface TextBlock {
  type: "text";
  text: string;
}

interface ImageBlock {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
    data: string;  // base64 encoded
  };
}
```

## 2. Gemini SDK Response Structure (Current)

```typescript
interface GeminiResponse {
  candidates: [{
    content: {
      parts: Part[];
      role: "model";
    };
    finishReason: string;
  }];
  usageMetadata: {...};
}

type Part = TextPart | InlineDataPart;

interface TextPart {
  text: string;
}

interface InlineDataPart {
  inlineData: {
    mimeType: string;
    data: string;  // base64
  };
}
```

## 3. Response Access Patterns

| Task Type | Anthropic Format | Gemini Format |
|-----------|------------------|---------------|
| Text | `response.content[0].text` | `response.candidates[0].content.parts[0].text` |
| Image | `response.content[0].source.data` | `response.candidates[0].content.parts[0].inlineData.data` |
| Mixed | Iterate `content[]` by type | Iterate `parts[]` checking for text/inlineData |

## 4. Antigravity Proxy Behavior (Expected)

Proxy converts Gemini responses to Anthropic format:

```typescript
// Text response
{
  content: [{ type: "text", text: "..." }]
}

// Image generation response
{
  content: [
    { type: "text", text: "Generated image" },  // optional
    {
      type: "image",
      source: { type: "base64", media_type: "image/png", data: "..." }
    }
  ]
}
```

## 5. Normalization Strategy

### For Recognition (JSON output):
```typescript
function extractText(response: AnthropicResponse): string {
  const textBlock = response.content.find(b => b.type === "text");
  return textBlock?.text ?? "";
}
```

### For Drawing (Image output):
```typescript
function extractImage(response: AnthropicResponse): string | null {
  const imageBlock = response.content.find(b => b.type === "image");
  return imageBlock?.source?.data ?? null;
}
```

### Universal Extractor:
```typescript
interface ExtractedResponse {
  text: string | null;
  image: { data: string; mimeType: string } | null;
}

function extractContent(response: AnthropicResponse): ExtractedResponse {
  let text = null, image = null;

  for (const block of response.content) {
    if (block.type === "text") text = block.text;
    if (block.type === "image") {
      image = { data: block.source.data, mimeType: block.source.media_type };
    }
  }
  return { text, image };
}
```

## 6. Key Differences Summary

| Aspect | Gemini SDK | Anthropic SDK (via Proxy) |
|--------|------------|---------------------------|
| Response wrapper | `candidates[0].content.parts` | `content` |
| Text field | `part.text` | `block.text` |
| Image field | `part.inlineData.data` | `block.source.data` |
| Image mime | `part.inlineData.mimeType` | `block.source.media_type` |
| Type check | Check for `text` or `inlineData` key | Check `block.type` value |

## 7. Implementation Notes

1. **Simpler access**: Anthropic format is flatter (no `candidates` wrapper)
2. **Type safety**: Explicit `type` field vs implicit key checking
3. **Consistency**: Same format for both recognition and drawing tasks
4. **Error handling**: Check `stop_reason` for completion status

---

**Sources:**
- [Anthropic Vision API](https://docs.anthropic.com/en/docs/vision)
- [Anthropic Messages API Reference](https://docs.anthropic.com/en/api/messages)

**Unresolved Questions:**
- None - Anthropic format is well-documented
