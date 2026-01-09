# Debug Report: API Key Validation Issue

**ID:** ae984d9
**Date:** 2026-01-08 21:00
**Status:** Root Cause Identified

---

## Executive Summary

**Issue:** API key test shows "Connected (Arg Error OK)" but actual processing fails with "API key not valid".

**Root Cause:** State synchronization mismatch between:
- `testModel()` uses config passed directly from modal's local state
- Actual API calls use `currentSettings` module variable which is only updated on "Save Settings" click

**Impact:** Users believe API key is valid after testing, but processing fails because module state was never updated.

---

## Technical Analysis

### Data Flow Comparison

| Action | API Key Source | Module State Updated? |
|--------|---------------|----------------------|
| Test button | `settings[activeTab]` (modal local) | NO |
| Save button | Triggers `updateSettings()` | YES |
| Actual calls | `currentSettings.gemini` (module) | N/A - reads existing |

### Code Evidence

#### 1. testModel() receives config directly
```typescript
// SettingsModal.tsx:56-62
const handleTestModel = async (type: 'recognition' | 'drawing') => {
    const config = settings[activeTab];  // Local modal state
    const result = await testModel(type, activeTab, config);  // Passed directly
};

// geminiService.ts:342-343
if (provider === 'gemini') {
    const ai = getGeminiClient(config);  // Uses passed config
}
```

#### 2. Actual calls use module state
```typescript
// geminiService.ts:426-428 (and similar patterns)
if (currentSettings.currentProvider === 'gemini') {
    const ai = getGeminiClient();  // No param = uses currentSettings
}

// geminiService.ts:327-332
const getGeminiClient = (overrideConfig?: ProviderConfig) => {
    const config = overrideConfig || currentSettings.gemini;  // Fallback
    if (!config.apiKey) throw new Error("Gemini API Key is missing.");
};
```

#### 3. Module state only updated on Save
```typescript
// App.tsx:56-60
const handleSaveSettings = (newSettings: AISettings) => {
    setAiSettings(newSettings);
    updateSettings(newSettings);  // Only here!
    localStorage.setItem('ai_settings', JSON.stringify(newSettings));
};
```

### False Positive: "Connected (Arg Error OK)"

```typescript
// geminiService.ts:356
if (errMsg.includes('400') || errMsg.includes('INVALID_ARGUMENT'))
    return { success: true, message: "Connected (Arg Error OK)" };
```

This treats 400/INVALID_ARGUMENT errors as "success" which is misleading. The error user received (`API key not valid`) has status `INVALID_ARGUMENT` - if this reached the test, it would show as "Connected"!

---

## Bug Locations

| File | Lines | Description |
|------|-------|-------------|
| `components/SettingsModal.tsx` | 56-69 | Test uses local state without syncing module |
| `services/geminiService.ts` | 4-5 | `currentSettings` module variable |
| `services/geminiService.ts` | 327-332 | `getGeminiClient()` fallback logic |
| `services/geminiService.ts` | 356 | False positive success on INVALID_ARGUMENT |
| `App.tsx` | 56-60 | `updateSettings()` only on Save |

---

## Suggested Fixes

### Option A: Sync before test (Recommended)
Update module settings before testing:
```typescript
// SettingsModal.tsx - handleTestModel
import { updateSettings } from '../services/geminiService';

const handleTestModel = async (type: 'recognition' | 'drawing') => {
    // Temporarily sync settings before test
    const tempSettings = { ...settings };
    updateSettings(tempSettings);

    const config = settings[activeTab];
    const result = await testModel(type, activeTab, config);
    // ...
};
```

### Option B: Remove false positive
```typescript
// geminiService.ts:352-357 - Remove or fix
// Current code treats INVALID_ARGUMENT as success
// Should be: return { success: false, message: "Invalid Request" };
```

### Option C: Auto-save on successful test
```typescript
// SettingsModal.tsx - After test success
if (result.success) {
    onSave(settings);  // Persist immediately
}
```

---

## Unresolved Questions

1. Why was "Connected (Arg Error OK)" logic added? Is there a legitimate use case?
2. Should settings be synced on every input change, or only on test/save?
3. Consider: If user tests, doesn't save, closes modal - should we warn about unsaved changes?

---

## Reproduction Steps

1. Open Settings Modal
2. Enter valid API key
3. Click "Test" on Recognition Model -> Shows "Connected (Arg Error OK)"
4. **Close modal WITHOUT clicking Save**
5. Upload image and click "Analyze Layout"
6. Error: "API key not valid"

**Expected:** Either test should fail, or settings should be saved after successful test.
