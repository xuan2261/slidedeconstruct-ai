# Phase 02: Translate App.tsx

## Context

- Parent: [plan.md](plan.md)
- Depends on: [phase-01-ui-components.md](phase-01-ui-components.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-08 |
| Priority | P2 |
| Implementation | DONE |
| Review | DONE (9/10) |

## File: App.tsx (~25 strings)

### Error Messages & Alerts

| Line | Chinese | English |
|------|---------|---------|
| 120 | 文件加载失败 | Failed to load file |
| 137 | 无法识别布局 | Failed to analyze layout |
| 166 | 最终生成失败 | Final generation failed |
| 341 | 操作失败 | Operation failed |
| 384 | 生成失败 | Generation failed |
| 472 | 矢量转换失败 | Vector conversion failed |
| 546 | 重新生成失败 | Regeneration failed |
| 606 | 擦除失败 | Erase failed |
| 638 | 当前页面尚未完成处理，无法导出 | Current page not processed, cannot export |
| 739 | 导出失败 | Export failed |
| 746 | 确定要清空所有页面吗？ | Clear all slides? |

### UI Labels & Buttons

| Line | Chinese | English |
|------|---------|---------|
| 775 | PPT 拆解大师 | SlideDeconstruct AI |
| 785 | 图片拆解 | Image Mode |
| 792 | 矢量编辑 (Beta) | Vector Mode (Beta) |
| 804 | 导出当前页 (矢量/图片模式) | Export Current (Vector/Image Mode) |
| 809 | 导出当前页 | Export Current |
| 819 | 打包中.../导出全部 PPT | Exporting.../Export All PPT |
| 874 | 开始分析布局 (Analyze Layout) | Analyze Layout |
| 885 | 分析布局中... | Analyzing layout... |
| 892 | 生成图层中... | Generating layers... |
| 898 | 处理失败 | Processing failed |
| 900 | 重试 | Retry |

## Implementation Steps

1. Open App.tsx
2. Replace all Chinese strings with English equivalents
3. Keep alert messages concise
4. Test all user flows

## Success Criteria

- [x] All Chinese strings in App.tsx translated
- [x] Alert messages are clear and actionable
- [x] No broken JSX syntax
- [x] All user flows work correctly
