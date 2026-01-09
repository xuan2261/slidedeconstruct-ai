# SlideDeconstruct AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-purple.svg)](https://vitejs.dev/)

**SlideDeconstruct AI** is an AI-powered presentation reverse engineering tool. It uses Google Gemini (or OpenAI Compatible) vision models to "deconstruct" static PPT screenshots into editable layers (background, text, visual elements), supports vector shape conversion, and exports to editable `.pptx` files.

> **Documentation**: See the [docs/](./docs/) folder for detailed technical documentation.

## Background

AI-generated PPT tools (e.g., Nanobanana, banana-slides) produce visually stunning slides but output **static images**. This creates an "easy to generate, hard to edit" problem - users cannot modify text, adjust icon positions, or edit individual elements without regenerating entire slides.

**SlideDeconstruct AI** solves this by using AI vision to:
1. **Image Deconstruction**: Automatically remove text from images (preserving background) and extract visual elements.
2. **Vector Reconstruction**: Convert image-based visual elements to native PPT vector shapes (rectangles, circles, arrows, etc.).

## Features

- **Multi-Format Upload**: Batch upload PDF, PNG, JPG slides (PPT/PPTX should be exported to PDF first)
- **AI Layout Analysis**: Precise detection of text blocks, visual elements, and background colors
- **Smart Text Removal**: AI erases text and repairs background texture automatically
- **Manual Erasure**: "Eraser" mode for user-defined region removal
- **Vector Conversion (Beta)**: Convert simple shapes to native PPT vector shapes
- **Human Correction Workflow**: Interactive canvas for bounding box adjustment and element type modification
- **PPT Export**: One-click export to editable `.pptx` files
- **Multi-Model Support**: Google Gemini or OpenAI (GPT-4o) as backend

## Tech Stack

- **Frontend**: React 19, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Google GenAI SDK (`@google/genai`), OpenAI API Compatible
- **File Handling**: `pptxgenjs` (PPT generation), `pdfjs-dist` (PDF parsing)

## Quick Start

### 1. Prerequisites

Ensure **Node.js** (v18+) is installed locally.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure API Key

**Option A (Environment Variable)**: Create `.env.local` in root:
```env
GEMINI_API_KEY=your_Google_Gemini_Key
```

**Option B (UI Settings)**: Click the settings icon in the app and enter your API Key and Base URL.

### 4. Run

```bash
npm run dev
```

Visit `http://localhost:3000` to start using.

## Workflow

1. **Upload** - Drag or click to upload PDF/image files. Select pages from the sidebar.
2. **Analyze** - Click "Analyze Layout". AI identifies page structure.
3. **Correct** - Blue boxes = text, Orange boxes = images. Drag to resize, right-click to modify type. Click "Confirm and Process".
4. **Export** - View final result, use erasure/redraw if needed. Click "Export Current Page" or "Export All PPT".

## Model Configuration

For best results:
- **Recognition Model**: `gemini-3-pro-preview` (stronger visual understanding)
- **Drawing Model**: `gemini-2.5-flash-image` (image-to-image support required)

*Note: For text removal/redraw, the model must support Image-to-Image capability.*

## Known Limitations

- **Text Editing**: OCR extracts text position/content, but direct editing not supported (edit in exported PPT)
- **Formulas**: LaTeX recognized but may export as plain text (use MathType plugin)
- **Batch Processing**: Process slides one-by-one to avoid token waste
- **Session Persistence**: No save/resume - complete workflow before closing

## License

This project is licensed under the [MIT License](./LICENSE).

Copyright © 2026 yyy-OPS. All Rights Reserved.

**Disclaimer**: For learning and research purposes only. Do not use to deconstruct copyrighted commercial PPT templates for profit. Users are responsible for AI service costs.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yyy-OPS/slidedeconstruct-ai&type=Date)](https://star-history.com/#yyy-OPS/slidedeconstruct-ai&Date)
