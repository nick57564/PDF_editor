# PDF Editor — Todo List

## In Progress

- [ ] Deploy to Vercel free tier (blocked: fix GitHub account → push → connect Vercel)

## v1 — PDF Text Editor ✅ Done

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

## v2 — More Features ✅ Done

- [x] Merge multiple PDFs (client-side, pdf-lib) → /merge
- [x] Split / extract pages (with thumbnail preview) → /split
- [x] Fill & sign — signature pad + place on PDF → /sign
- [x] Annotate / highlight / draw / text notes → /annotate
- [x] Undo history panel in edit queue sidebar

## v1.5 — Nice to Have ✅ Done

- [x] OCR for scanned PDFs (Tesseract.js, lazy-loaded) → in /editor sidebar
- [x] Password-protected PDF support → in /editor + /sign
- [x] Plausible analytics (script in layout.tsx, configure domain via NEXT_PUBLIC_PLAUSIBLE_DOMAIN)

## Done

- [x] Created design doc
- [x] Connected repo to GitHub (nick57564/PDF_editor)
- [x] Installed gstack
- [x] Navigation bar across all tools
- [x] Home page with tool cards
