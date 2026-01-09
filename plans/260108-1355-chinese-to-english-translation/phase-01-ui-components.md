# Phase 01: Translate UI Components

## Context

- Parent: [plan.md](plan.md)
- Docs: [codebase-summary.md](../../docs/codebase-summary.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-08 |
| Priority | P2 |
| Implementation | DONE (2026-01-08 16:49) |
| Review | DONE - 9/10 |

## Files to Modify

### 1. LayerList.tsx (~20 strings)

| Line | Chinese | English |
|------|---------|---------|
| 51 | 图层管理 | Layer Management |
| 52 | 已拆解的元素 | Deconstructed Elements |
| 61 | 背景层 | Background Layer |
| 69 | 背景局部擦除 | Partial Background Erase |
| 89 | 请在画布上框选需要擦除的背景区域 | Select areas on canvas to erase |
| 97 | 处理中.../确认擦除 | Processing.../Confirm Erase |
| 104 | 取消 | Cancel |
| 112 | 文字图层 | Text Layer |
| 121 | 视觉元素 | Visual Elements |
| 136 | 选中: 视觉元素/文字 | Selected: Visual/Text |
| 142 | 删除 | Delete |
| 151 | 输入指令 (例: 去除文字...) | Enter instruction (e.g., Remove text...) |
| 162 | 处理中.../拆分/识别 | Processing.../Split/Recognize |
| 165 | 去除文字 | Remove text |
| 169 | 生成中.../修改/生成 | Generating.../Modify/Generate |
| 176 | 历史版本 | History |
| 185 | 原始截图/生成版本 | Original/Version |
| 227 | 文字/视觉 | Text/Visual |
| 230 | 已修改 | Modified |
| 237 | 视觉元素 | Visual Element |
| 249 | 显示/隐藏 | Show/Hide |

### 2. SettingsModal.tsx (~12 strings)

| Line | Chinese | English |
|------|---------|---------|
| 83 | AI 服务配置 | AI Service Settings |
| 86 | 当前启用 | Active Provider |
| 104 | Google Gemini 设置 | Google Gemini Settings |
| 110 | OpenAI 设置 | OpenAI Settings |
| 145 | 识别模型 (Vision) | Recognition Model (Vision) |
| 173 | 绘图模型 (Image Gen) | Drawing Model (Image Gen) |
| 201 | 提示: Gemini 绘图模型建议使用... | Tip: Gemini drawing model recommended... |
| 218 | 取消 | Cancel |
| 224 | 保存配置 | Save Settings |

### 3. CorrectionCanvas.tsx (~10 strings)

| Line | Chinese | English |
|------|---------|---------|
| 227 | 人工校正 | Manual Correction |
| 232 | 文字区域 | Text Area |
| 234 | 文字 | Text |
| 237 | 视觉区域 | Visual Area |
| 239 | 视觉 | Visual |
| 243 | 提示: 右键点击方框可切换类型 | Tip: Right-click box to change type |
| 253 | 取消 | Cancel |
| 259 | 确认并处理 | Confirm & Process |
| 364 | 设为: 文字 | Set as: Text |
| 370 | 设为: 视觉 | Set as: Visual |
| 377 | 删除 | Delete |

### 4. UploadSection.tsx (~5 strings)

| Line | Chinese | English |
|------|---------|---------|
| 30 | 上传演示文档或图片 | Upload Presentation or Image |
| 32 | 支持 PDF, 图片 (PNG/JPG) | Supports PDF, Images (PNG/JPG) |
| 34 | PPT/PPTX 请先另存为 PDF | Export PPT/PPTX to PDF first |
| 38 | 支持批量上传 & Ctrl+V 粘贴 | Batch upload & Ctrl+V paste supported |
| 42 | 选择文件 | Select Files |

### 5. SlideSidebar.tsx (~4 strings)

| Line | Chinese | English |
|------|---------|---------|
| 32 | 页面列表 | Slide List |
| 83 | 删除页面 | Delete Slide |
| 100 | 添加页面 | Add Slides |

### 6. VectorLayerList.tsx (~3 strings)

| Line | Chinese | English |
|------|---------|---------|
| 28 | 矢量图层管理 | Vector Layer Management |
| 29 | 可编辑元素 | Editable Elements |
| 76 | 重新生成矢量 | Regenerate Vector |

### 7. EditorCanvas.tsx (~3 strings)

| Line | Chinese | English |
|------|---------|---------|
| 187 | PPT 导出区域 (16:9) | PPT Export Area (16:9) |
| 188 | 擦除模式: 框选背景区域 | Erase Mode: Select background area |

### 8. ReconstructionCanvas.tsx (~1 string)

| Line | Chinese | English |
|------|---------|---------|
| 200 | 可编辑模式 (Vector) | Editable Mode (Vector) |

## Implementation Steps

1. Open each component file
2. Find/replace Chinese strings with English equivalents
3. Maintain consistent terminology from glossary
4. Test UI renders correctly

## Success Criteria

- [x] All Chinese strings in 8 component files translated
- [x] UI labels are concise and clear
- [x] No broken JSX syntax
- [x] App compiles without errors
