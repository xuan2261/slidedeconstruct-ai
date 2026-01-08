# Phase 3: Settings UI Update

## Context Links
- Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-types-update.md](./phase-01-types-update.md)
- Phase 2: [phase-02-anthropic-integration.md](./phase-02-anthropic-integration.md)

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 |
| Status | pending |
| Effort | 1h |
| Description | Add Anthropic settings tab and per-task provider dropdowns |

## Key Insights

1. Current UI has 2 tabs: Gemini, OpenAI
2. Single "Active Provider" dropdown controls all tasks
3. Need: Anthropic tab + separate Recognition/Drawing provider dropdowns
4. Keep existing tab structure, add third tab

## Requirements

- [ ] Add Anthropic tab to settings modal
- [ ] Add Recognition Provider dropdown
- [ ] Add Drawing Provider dropdown
- [ ] Remove/deprecate single "Active Provider" dropdown
- [ ] Update tab type to include 'anthropic'
- [ ] Add Anthropic-specific tip text

## Related Code Files

| File | Purpose |
|------|---------|
| `e:/AI_Google/slidedeconstruct-ai/components/SettingsModal.tsx` | Settings modal UI |

## Implementation Steps

### 1. Update Tab State Type (Line ~14)

```typescript
// Before
const [activeTab, setActiveTab] = useState<'gemini' | 'openai'>('gemini');

// After
type ProviderTab = 'gemini' | 'openai' | 'anthropic';
const [activeTab, setActiveTab] = useState<ProviderTab>('gemini');
```

### 2. Replace Single Provider Dropdown (Line ~85-95)

Replace "Active Provider" with two dropdowns:

```tsx
{/* Per-Task Provider Selection */}
<div className="grid grid-cols-2 gap-3 mb-2">
  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Recognition:</label>
    <select
      value={settings.recognitionProvider}
      onChange={(e) => setSettings(prev => ({
        ...prev,
        recognitionProvider: e.target.value as ProviderType
      }))}
      className="w-full bg-transparent font-semibold text-blue-600 dark:text-blue-400 text-sm focus:outline-none"
    >
      <option value="gemini">Gemini</option>
      <option value="openai">OpenAI</option>
      <option value="anthropic">Anthropic</option>
    </select>
  </div>

  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Drawing:</label>
    <select
      value={settings.drawingProvider}
      onChange={(e) => setSettings(prev => ({
        ...prev,
        drawingProvider: e.target.value as ProviderType
      }))}
      className="w-full bg-transparent font-semibold text-blue-600 dark:text-blue-400 text-sm focus:outline-none"
    >
      <option value="gemini">Gemini</option>
      <option value="openai">OpenAI</option>
      <option value="anthropic">Anthropic</option>
    </select>
  </div>
</div>
```

### 3. Add Anthropic Tab Button (Line ~99-112)

```tsx
{/* Tabs */}
<div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
  <button
    onClick={() => handleTabChange('gemini')}
    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'gemini' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
  >
    Gemini
  </button>
  <button
    onClick={() => handleTabChange('openai')}
    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'openai' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
  >
    OpenAI
  </button>
  <button
    onClick={() => handleTabChange('anthropic')}
    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'anthropic' ? 'border-purple-500 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
  >
    Anthropic
  </button>
</div>
```

### 4. Update Handler Functions (Line ~33, ~40)

```typescript
const handleProviderChange = (provider: ProviderType, taskType: 'recognition' | 'drawing') => {
  setSettings(prev => ({
    ...prev,
    [taskType === 'recognition' ? 'recognitionProvider' : 'drawingProvider']: provider,
  }));
};

const handleTabChange = (tab: ProviderTab) => {
  setActiveTab(tab);
  setTestingState({ recognition: 'idle', drawing: 'idle', message: '' });
};
```

### 5. Update Tip Text (Line ~200-202)

```tsx
<div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded text-xs text-slate-500 dark:text-slate-400">
  Tip: {
    activeTab === 'gemini'
      ? 'Gemini drawing model recommended: gemini-3-pro-image-preview or gemini-2.5-flash-image.'
      : activeTab === 'openai'
        ? 'OpenAI recognition model requires Vision support (e.g., gpt-4o). Drawing model requires Image Generation (e.g., dall-e-3).'
        : 'Anthropic via Antigravity proxy. Default baseUrl: http://127.0.0.1:8045. Supports Claude models for both recognition and drawing.'
  }
</div>
```

### 6. Update API Key Label (Line ~117-118)

```tsx
<label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
  {activeTab === 'gemini' ? 'Google API Key' : activeTab === 'openai' ? 'OpenAI API Key' : 'Anthropic API Key'}
</label>
```

### 7. Update Placeholder for Base URL (Line ~137)

```tsx
placeholder={
  activeTab === 'gemini'
    ? 'https://generativelanguage.googleapis.com'
    : activeTab === 'openai'
      ? 'https://api.openai.com/v1'
      : 'http://127.0.0.1:8045'
}
```

## UI Mockup

```
+--------------------------------------------------+
| AI Service Settings                              |
+--------------------------------------------------+
| Recognition: [Gemini v]    Drawing: [Anthropic v]|
+--------------------------------------------------+
| [Gemini] [OpenAI] [Anthropic]                    |
+--------------------------------------------------+
| Anthropic API Key                                |
| [________________________]                       |
|                                                  |
| Base URL                                         |
| [http://127.0.0.1:8045___]                       |
|                                                  |
| Recognition Model (Vision)                       |
| [claude-sonnet-4-20250514] [Test]                |
|                                                  |
| Drawing Model (Image Gen)                        |
| [claude-sonnet-4-20250514] [Test]                |
|                                                  |
| Tip: Anthropic via Antigravity proxy...         |
+--------------------------------------------------+
```

## Todo List

- [ ] Update `activeTab` type to include 'anthropic'
- [ ] Replace single provider dropdown with Recognition/Drawing dropdowns
- [ ] Add Anthropic tab button
- [ ] Update `handleTabChange` for anthropic
- [ ] Update API key label for anthropic
- [ ] Update Base URL placeholder for anthropic
- [ ] Update tip text for anthropic
- [ ] Test tab switching works correctly
- [ ] Test provider dropdowns save correctly

## Success Criteria

- [ ] Anthropic tab visible and clickable
- [ ] Recognition/Drawing dropdowns functional
- [ ] Settings save and load correctly with new fields
- [ ] Tab styling consistent with existing tabs
- [ ] No React warnings or errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Settings not persisting | Low | High | Test save/load cycle |
| UI layout breaks | Low | Medium | Test on different screen sizes |
| Type errors | Low | Low | TypeScript will catch |
