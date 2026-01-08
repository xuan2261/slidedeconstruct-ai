# Anthropic SDK Browser Compatibility Research

**Date:** 2026-01-09 | **Task ID:** ae1a68c

## TL;DR

@anthropic-ai/sdk **works in browser** with `dangerouslyAllowBrowser: true` option. SDK auto-adds required CORS header. Custom proxy baseURL supported.

## Browser Compatibility Status

| Aspect | Status |
|--------|--------|
| CORS Support | Enabled (since Aug 2024) |
| SDK Browser Use | Supported with flag |
| Direct Fetch | Supported with header |
| Streaming | Supported |
| Tool Use | Supported |

## Required Configuration

### Option 1: SDK Approach (Recommended)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: userApiKey,
  baseURL: 'http://127.0.0.1:8045', // custom proxy
  dangerouslyAllowBrowser: true,    // enables browser CORS
});

const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello' }],
});
```

### Option 2: Direct Fetch

```typescript
const response = await fetch('http://127.0.0.1:8045/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true', // required!
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello' }],
  }),
});
```

## Recommendation for This Project

**Use SDK** because:
- Type safety built-in
- Streaming helpers included
- Tool use helpers available
- Consistent with @google/genai pattern already in project

**Install:** `npm install @anthropic-ai/sdk`

## Proxy Considerations

With custom proxy at `http://127.0.0.1:8045`:
- Proxy must forward `anthropic-dangerous-direct-browser-access` header OR add it server-side
- Proxy handles actual API key if using "bring your own key" model
- No additional CORS config needed if proxy allows origin

## Potential Issues & Mitigations

| Issue | Mitigation |
|-------|------------|
| API key exposure in browser | Use proxy with server-side key OR user-provided key |
| Bundle size (~50KB gzipped) | Tree-shakeable, acceptable for AI app |
| Vite compatibility | Works with ESM, no special config needed |

## Sources

- [Simon Willison - Anthropic CORS](https://simonwillison.net)
- [Anthropic SDK npm](https://npmjs.com/package/@anthropic-ai/sdk)
- [Liona - Client-side Anthropic](https://liona.ai)

---

**Unresolved Questions:** None - SDK browser support well-documented and stable.
