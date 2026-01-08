# Phase 03: Translate Config, Services & Docs

## Context

- Parent: [plan.md](plan.md)
- Depends on: [phase-02-app-core.md](phase-02-app-core.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-08 |
| Priority | P2 |
| Implementation | DONE |
| Review | DONE |

## Files to Modify

### 1. services/fileService.ts (~1 string)

| Line | Chinese | English |
|------|---------|---------|
| 75 | 请先将 PPT/PPTX 另存为 PDF 后上传 | Please export PPT/PPTX to PDF before uploading |

### 2. index.html (~2 strings)

| Line | Chinese | English |
|------|---------|---------|
| 6 | PPT 拆解大师 | SlideDeconstruct AI |
| 63 | 关键修复：添加入口脚本引用 | (remove comment or translate) |

### 3. vite.config.ts (~2 comments)

| Line | Chinese | English |
|------|---------|---------|
| 9 | 关键配置：允许在依赖中使用新特性 | Allow modern features in dependencies |
| 13 | 关键配置：构建目标设为支持顶级 await | Build target for top-level await |

### 4. metadata.json (~1 string)

| Line | Chinese | English |
|------|---------|---------|
| 2 | SlideDeconstruct AI-多文件 | SlideDeconstruct AI |

### 5. docs/project-overview-pdr.md (~1 string)

| Line | Chinese | English |
|------|---------|---------|
| 7 | PPT 拆解大师 (SlideDeconstruct AI) | SlideDeconstruct AI |

### 6. README.md (Full Rewrite)

Rewrite README.md entirely in English. Structure:

```markdown
# SlideDeconstruct AI

AI-powered PPT reverse engineering tool...

## Features
- Multi-format upload (PDF, PNG, JPG)
- AI Layout Analysis
- Smart Text Removal
- Manual Erasure
- Vector Conversion (Beta)
- Human Correction Workflow
- PPT Export

## Tech Stack
- React 19, TypeScript, Vite
- @google/genai, pptxgenjs, pdfjs-dist

## Quick Start
1. Prerequisites: Node.js v18+
2. Install: npm install
3. Configure API Key
4. Run: npm run dev

## Workflow
1. Upload - PDF/images
2. Analyze - AI layout detection
3. Correct - Adjust bounding boxes
4. Export - Generate .pptx

## Model Configuration
- Recognition: gemini-3-pro-preview
- Drawing: gemini-2.5-flash-image

## Known Limitations
- Text editing limited
- Formula support basic
- No session persistence

## License
MIT License
```

## Implementation Steps

1. Translate service error message
2. Update index.html title
3. Translate vite.config.ts comments
4. Update metadata.json
5. Update docs reference
6. Rewrite README.md in English

## Success Criteria

- [x] All config files translated
- [x] README.md fully in English
- [x] Documentation reference updated
- [x] Project title consistent across all files
