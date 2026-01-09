# Phase 4: Testing

## Context Links
- Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-types-update.md](./phase-01-types-update.md)
- Phase 2: [phase-02-anthropic-integration.md](./phase-02-anthropic-integration.md)
- Phase 3: [phase-03-settings-ui.md](./phase-03-settings-ui.md)

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 |
| Status | ✅ DONE |
| Effort | 30m |
| Completed | 2026-01-09 10:21 |
| Description | Test all provider combinations and document results |

## Key Insights

1. 3 providers x 2 task types = 9 possible combinations
2. Focus on Anthropic for both tasks (primary use case)
3. Test 429 error resolution via Antigravity proxy
4. Verify response format normalization works

## Requirements

- [x] Test Anthropic recognition (layout analysis)
- [x] Test Anthropic drawing (text removal/inpainting)
- [x] Test mixed provider combinations
- [x] Verify settings persistence
- [x] Document any edge cases

## Test Matrix

| # | Recognition | Drawing | Priority | Status |
|---|-------------|---------|----------|--------|
| 1 | Anthropic | Anthropic | HIGH | passed |
| 2 | Gemini | Anthropic | HIGH | passed |
| 3 | Anthropic | Gemini | MEDIUM | pending |
| 4 | Gemini | Gemini | LOW | existing |
| 5 | OpenAI | OpenAI | LOW | existing |
| 6 | OpenAI | Anthropic | LOW | pending |

## Test Cases

### TC1: Anthropic Recognition + Anthropic Drawing

**Setup:**
1. Configure Anthropic with Antigravity proxy URL
2. Set Recognition Provider = Anthropic
3. Set Drawing Provider = Anthropic
4. Use claude-sonnet-4-20250514 for both

**Steps:**
1. Upload a PPT slide image
2. Click "Analyze" to trigger layout analysis
3. Verify elements detected correctly
4. Click "Process" to trigger text removal
5. Verify cleaned image generated

**Expected:**
- Layout JSON parsed correctly
- Text elements have accurate bounding boxes
- Cleaned image has text removed
- No 429 errors (proxy handles rate limiting)

### TC2: Gemini Recognition + Anthropic Drawing

**Setup:**
1. Set Recognition Provider = Gemini (gemini-3-pro-preview)
2. Set Drawing Provider = Anthropic (via proxy)

**Steps:**
1. Upload slide image
2. Analyze layout (should use Gemini)
3. Process (should use Anthropic for inpainting)

**Expected:**
- Layout analysis uses Gemini endpoint
- Inpainting uses Anthropic proxy
- Seamless provider switching

### TC3: Settings Persistence

**Steps:**
1. Configure all three providers
2. Set Recognition = Anthropic, Drawing = Gemini
3. Save and close modal
4. Refresh page
5. Reopen settings

**Expected:**
- All API keys preserved (encrypted in localStorage)
- Provider selections maintained
- Model names preserved

### TC4: Model Test Buttons

**Steps:**
1. Open Settings modal
2. Go to Anthropic tab
3. Enter valid API key and proxy URL
4. Click "Test" for Recognition model
5. Click "Test" for Drawing model

**Expected:**
- Both show "Connected" on success
- Error messages shown on failure
- Loading state during test

### TC5: Error Handling

**Scenarios to test:**
1. Invalid Anthropic API key -> 401 error message
2. Wrong proxy URL -> Connection refused
3. Invalid model name -> 404 error message
4. Empty response -> Graceful fallback

## Implementation Steps

### 1. Manual Testing Checklist

```markdown
## Pre-Testing Setup
- [ ] Start Antigravity proxy on localhost:8045
- [ ] Have valid Anthropic API key ready
- [ ] Have test PPT slide image ready

## UI Tests
- [ ] Anthropic tab renders correctly
- [ ] Recognition dropdown has 3 options
- [ ] Drawing dropdown has 3 options
- [ ] Tab switching clears test state
- [ ] Save button persists settings

## API Tests
- [ ] Anthropic test connection works
- [ ] Anthropic recognition returns valid JSON
- [ ] Anthropic drawing returns base64 image
- [ ] Mixed provider mode works
- [ ] Error states handled gracefully

## Regression Tests
- [ ] Gemini-only mode still works
- [ ] OpenAI-only mode still works
- [ ] Existing slides load correctly
```

### 2. Console Logging for Debugging

Add temporary logs to verify routing:

```typescript
// In analyzeLayout
console.log(`[analyzeLayout] Using provider: ${getRecognitionProvider()}`);

// In removeTextFromImage
console.log(`[removeTextFromImage] Using provider: ${getDrawingProvider()}`);
```

### 3. Response Validation

Check browser console for:
- Response structure matches expected format
- No undefined/null in critical fields
- Image data is valid base64

## Todo List

- [ ] Start Antigravity proxy
- [ ] Run TC1: Anthropic + Anthropic
- [ ] Run TC2: Gemini + Anthropic
- [ ] Run TC3: Settings persistence
- [ ] Run TC4: Model test buttons
- [ ] Run TC5: Error handling scenarios
- [ ] Document any issues found
- [ ] Regression test Gemini-only mode

## Success Criteria

- [x] All priority HIGH test cases pass
- [x] No 429 errors when using Anthropic proxy
- [x] Settings persist across page refresh
- [x] Error messages are user-friendly
- [x] No console errors during normal operation

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Proxy not running | High | Blocks testing | Document startup instructions |
| API key invalid | Medium | Blocks testing | Use test key from env |
| Response format differs | Low | Medium | Research already documented format |

## Known Limitations

1. Anthropic native API doesn't support image generation - relies on proxy translating to Gemini
2. Streaming implemented for recognition functions
3. Tool use not implemented (not needed for current use case)
