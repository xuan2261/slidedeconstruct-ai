# Brainstorm: Chinese to English Translation

**Date:** 2026-01-08
**Status:** Approved

## Problem Statement

Project contains ~140 Chinese strings across 15 files. Need to translate to English for international audience.

## Decision

- **Approach:** Direct Replace (no i18n)
- **README:** Replace entirely with English

## Scope Analysis

| Category | Files | Strings |
|----------|-------|---------|
| UI Components | 8 | ~60 |
| App.tsx | 1 | ~25 |
| Services | 1 | ~1 |
| Config | 3 | ~5 |
| README.md | 1 | ~50 |
| Docs | 1 | ~1 |
| **Total** | **15** | **~140** |

## Files to Modify

### UI Components
- `components/LayerList.tsx` (~20 strings)
- `components/SettingsModal.tsx` (~12 strings)
- `components/CorrectionCanvas.tsx` (~10 strings)
- `components/UploadSection.tsx` (~5 strings)
- `components/SlideSidebar.tsx` (~4 strings)
- `components/VectorLayerList.tsx` (~3 strings)
- `components/EditorCanvas.tsx` (~3 strings)
- `components/ReconstructionCanvas.tsx` (~1 string)

### Core
- `App.tsx` (~25 strings)

### Services
- `services/fileService.ts` (~1 string)

### Config
- `index.html` (~2 strings)
- `vite.config.ts` (~2 comments)
- `metadata.json` (~1 string)

### Documentation
- `README.md` (~50 strings) - full rewrite
- `docs/project-overview-pdr.md` (~1 string)

## Translation Glossary

| Chinese | English |
|---------|---------|
| 文字 | Text |
| 视觉 | Visual |
| 图层 | Layer |
| 矢量 | Vector |
| 擦除 | Erase |
| 导出 | Export |
| 页面 | Page/Slide |
| 处理 | Process |
| 分析 | Analyze |
| 校正 | Correction |
| 保存 | Save |
| 取消 | Cancel |
| 确认 | Confirm |
| 删除 | Delete |
| 生成 | Generate |
| 修改 | Modify |
| 拆解 | Deconstruct |
| 上传 | Upload |

## Rationale

1. **No i18n:** Project is small (~4K LOC), single-language target
2. **Direct replace:** Fastest, no runtime overhead
3. **Full README rewrite:** Cleaner than bilingual, target is international devs

## Next Steps

1. Translate UI components (8 files)
2. Translate App.tsx
3. Translate services/config
4. Rewrite README.md in English
5. Update docs reference
