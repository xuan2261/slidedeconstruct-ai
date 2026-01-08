---
title: "Chinese to English Translation"
description: "Translate ~140 Chinese strings to English across 15 files"
status: completed
priority: P2
effort: 2h
branch: main
tags: [i18n, translation, ui]
created: 2026-01-08
---

# Chinese to English Translation Plan

## Overview

Translate all Chinese text to English using direct replacement approach (no i18n library).

## Scope

| Category | Files | Strings |
|----------|-------|---------|
| UI Components | 8 | ~60 |
| App.tsx | 1 | ~25 |
| Services | 1 | ~1 |
| Config | 3 | ~5 |
| README.md | 1 | ~50 |
| Docs | 1 | ~1 |
| **Total** | **15** | **~140** |

## Implementation Phases

| Phase | Description | Status | Files |
|-------|-------------|--------|-------|
| [Phase 01](phase-01-ui-components.md) | Translate UI components | DONE (2026-01-08 16:49) | 8 |
| [Phase 02](phase-02-app-core.md) | Translate App.tsx | DONE (2026-01-08 17:20) | 1 |
| [Phase 03](phase-03-config-docs.md) | Translate config, services, docs | DONE (2026-01-08 18:07) | 5 |

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

## References

- Brainstorm: [brainstorm-260108-1355-chinese-to-english-translation.md](../reports/brainstorm-260108-1355-chinese-to-english-translation.md)
- Codebase: [codebase-summary.md](../../docs/codebase-summary.md)
