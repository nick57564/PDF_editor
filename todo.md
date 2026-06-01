# PDF Editor — Todo List

## In Progress

- [ ] Deploy to Vercel free tier

## v1 — PDF Text Editor (Core)

- [x] Scaffold Next.js app with Tailwind
- [x] Drag-and-drop PDF upload (File API, client-side)
- [x] Render PDF pages with PDF.js canvas + text layer
- [x] Client-side pre-flight: reject PDFs > 3MB before upload
- [x] Detect scanned PDFs (0 text items → show error message)
- [x] Detect encrypted/corrupt PDFs (catch pdf-lib load errors)
- [x] Overlay editor: click text item → inline edit box
- [x] Auto-detect font size from PDF.js text item transform[3]
- [x] Queue edits with yellow highlight (not applied immediately)
- [x] Ctrl+Z undo — pop last queued edit
- [x] Detect CJK characters → warn user about font mismatch
- [x] POST /api/edit serverless route (pdf-lib annotation overlay)
- [x] Coordinate conversion: PDF.js viewport → pdf-lib user space
- [x] Download edited PDF button
- [x] Desktop two-panel layout (viewer 60% | edit queue 40%)
- [x] Mobile single-column layout (viewer → queue stacked)
- [x] All user-facing error messages (size, scanned, encrypted, timeout, CJK)

## v2 — More Features

- [ ] Merge multiple PDFs (client-side, pdf-lib)
- [ ] Split / extract pages (client-side, pdf-lib)
- [ ] Fill & sign PDF forms (AcroForm support via pdf-lib)
- [ ] Annotate / highlight / draw
- [ ] Undo history panel in edit queue

## v1.5 — Nice to Have

- [ ] OCR for scanned PDFs (Tesseract.js — ~20MB bundle, evaluate later)
- [ ] Password-protected PDF support
- [ ] Plausible analytics (privacy-respecting, free tier)

## Done

- [x] Created design doc (`~/.gstack/projects/nick57564-PDF_editor/`)
- [x] Connected repo to GitHub (nick57564/PDF_editor)
- [x] Installed gstack
