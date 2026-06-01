"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { isCJK, isLargeFile, sampleTextColor, sampleBgColor, cssFontFromPdfName } from "@/lib/pdf-coordinates";

// PDF.js loaded dynamically to avoid SSR issues
let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }
  return pdfjsLib;
}

export type AppError =
  | "too_large"
  | "scanned"
  | "encrypted"
  | "corrupt"
  | "timeout"
  | null;

async function runOcr(canvas: HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  const { data: { text } } = await worker.recognize(canvas);
  await worker.terminate();
  return text;
}

interface TextItem {
  id: string;
  str: string;
  transform: number[];
  width: number;
  pageIndex: number;
  // Viewport coords for overlay positioning
  vpX: number;
  vpY: number;
  vpWidth: number;
  vpHeight: number;
  // PDF-lib coords for editing
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  fontSize: number;
  hasCJK: boolean;
  colorR: number;
  colorG: number;
  colorB: number;
  colorHex: string;
  bgHex: string;
  bgR: number;
  bgG: number;
  bgB: number;
  cssFontFamily: string;
  fontWeight: string;
}

interface QueuedEdit {
  itemId: string;
  originalText: string;
  newText: string;
  pageIndex: number;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  fontSize: number;
  colorR: number;
  colorG: number;
  colorB: number;
  colorHex: string;
  bgR: number;
  bgG: number;
  bgB: number;
}

interface RenderedPage {
  pageIndex: number;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  pageHeightPts: number;
  scale: number;
}

const SCALE = 1.5;

export default function PdfEditor() {
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [editQueue, setEditQueue] = useState<QueuedEdit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editColor, setEditColor] = useState("#000000");
  const [appError, setAppError] = useState<AppError>(null);
  const [cjkWarning, setCjkWarning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // Password support
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pendingBytes, setPendingBytes] = useState<{bytes: ArrayBuffer; name: string} | null>(null);
  // OCR
  const [isOcring, setIsOcring] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  // History panel toggle
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  // Refs to the visible canvases so we can redraw them live
  const displayCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // ── Live canvas preview ─────────────────────────────────────────────────
  // Redraws visible canvases whenever edits change or typing happens live
  useEffect(() => {
    for (const pg of pages) {
      const el = displayCanvasRefs.current.get(pg.pageIndex);
      if (!el) continue;
      const ctx = el.getContext("2d");
      if (!ctx) continue;

      // 1. Restore the original rendered page
      ctx.drawImage(pg.canvas, 0, 0);

      // Helper: cover original text + draw replacement on canvas
      const applyEdit = (item: TextItem, newText: string, colorHex: string) => {
        const fs = Math.max(item.vpHeight * 0.88, 6);
        const padX = fs * 0.15;
        const padY = fs * 0.25;
        // Cover original with background color (generous padding)
        ctx.fillStyle = item.bgHex;
        ctx.fillRect(
          item.vpX - padX,
          item.vpY - padY,
          item.vpWidth + padX * 2 + fs * 0.5,
          item.vpHeight + padY * 2
        );
        // Draw replacement text
        ctx.font = `${item.fontWeight} ${fs}px ${item.cssFontFamily}`;
        ctx.fillStyle = colorHex;
        ctx.fillText(newText, item.vpX, item.vpY + fs);
      };

      // 2. Draw all queued edits
      for (const edit of editQueue) {
        if (edit.pageIndex !== pg.pageIndex) continue;
        const item = textItems.find((t) => t.id === edit.itemId);
        if (item) applyEdit(item, edit.newText, edit.colorHex);
      }

      // 3. Live preview: currently being typed
      if (editingId && editValue) {
        const item = textItems.find((t) => t.id === editingId);
        if (item && item.pageIndex === pg.pageIndex) {
          applyEdit(item, editValue, editColor);
        }
      }
    }
  }, [editQueue, editingId, editValue, editColor, pages, textItems]);

  const loadPdf = useCallback(async (bytes: ArrayBuffer, name: string) => {
    setAppError(null);
    setCjkWarning(false);
    setEditQueue([]);
    setEditingId(null);
    setPages([]);
    setTextItems([]);

    if (isLargeFile(bytes)) {
      setAppError("too_large");
      return;
    }

    const pdfjs = await getPdfJs();
    let pdf: import("pdfjs-dist").PDFDocumentProxy;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pdf = await pdfjs.getDocument({ data: bytes.slice(0), password: (password || undefined) } as any).promise;
    } catch (err: unknown) {
      const msg = String(err);
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("encrypt")) {
        setNeedsPassword(true);
        setPendingBytes({ bytes, name });
        return;
      } else {
        setAppError("corrupt");
      }
      return;
    }
    setNeedsPassword(false); setPendingBytes(null);

    const renderedPages: RenderedPage[] = [];
    const allTextItems: TextItem[] = [];
    let totalTextItems = 0;

    for (let i = 0; i < pdf.numPages; i++) {
      const page = await pdf.getPage(i + 1);
      const viewport = page.getViewport({ scale: SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvas, viewport } as any).promise;

      const textContent = await page.getTextContent();
      const pageHeightPts = page.getViewport({ scale: 1 }).viewBox[3];

      for (const rawItem of textContent.items) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item = rawItem as any;
        if (!item.str?.trim()) continue;
        totalTextItems++;

        const transform = item.transform as number[];

        // Convert PDF user-space coords → canvas pixel coords using the viewport transform.
        // transform[4], transform[5] are in PDF points (user space).
        // viewport.convertToViewportPoint returns canvas pixels (top-left origin, y-down).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [vpTx, vpTy] = (viewport as any).convertToViewportPoint(
          transform[4],
          transform[5]
        );
        // Font size in canvas pixels
        const vpFontSize = Math.abs(transform[3]) * SCALE;
        // Text width in canvas pixels (item.width is in PDF user space)
        const vpWidth = Math.max((item.width || 0) * SCALE, 12);
        const vpHeight = Math.max(vpFontSize, 10);
        // vpTy is the baseline — shift up by font size to get the top of the glyph
        const vpX = vpTx;
        const vpY = vpTy - vpFontSize;

        // PDF-lib coords: transform values are already in PDF user space (points)
        const pdfFontSize = Math.abs(transform[3]);
        const pdfCoords = {
          x: transform[4],
          y: transform[5] - pdfFontSize * 0.2, // slightly below baseline for white rect
          width: Math.max(item.width || 0, 1),
          height: pdfFontSize * 1.2,
          fontSize: pdfFontSize,
        };

        const bg = sampleBgColor(canvas, vpX, vpY, vpWidth, vpHeight);
        const detectedColor = sampleTextColor(canvas, vpX, vpY, vpWidth, vpHeight, bg.hex);
        const { family: cssFontFamily, weight: fontWeight } = cssFontFromPdfName(item.fontName || "");

        allTextItems.push({
          id: `${i}-${allTextItems.length}`,
          str: item.str,
          transform,
          width: item.width,
          pageIndex: i,
          vpX, vpY, vpWidth, vpHeight,
          pdfX: pdfCoords.x,
          pdfY: pdfCoords.y,
          pdfWidth: pdfCoords.width,
          pdfHeight: pdfCoords.height,
          fontSize: pdfCoords.fontSize,
          hasCJK: isCJK(item.str),
          colorR: detectedColor.r,
          colorG: detectedColor.g,
          colorB: detectedColor.b,
          colorHex: detectedColor.hex,
          bgHex: bg.hex,
          bgR: bg.r,
          bgG: bg.g,
          bgB: bg.b,
          cssFontFamily,
          fontWeight,
        });
      }

      renderedPages.push({
        pageIndex: i,
        canvas,
        width: viewport.width,
        height: viewport.height,
        pageHeightPts,
        scale: SCALE,
      });
    }

    if (totalTextItems === 0) {
      setAppError("scanned");
      return;
    }

    setPdfBytes(bytes);
    setPdfName(name);
    setPages(renderedPages);
    setTextItems(allTextItems);
  }, []);

  const onFileChange = useCallback(
    async (file: File) => {
      const bytes = await file.arrayBuffer();
      await loadPdf(bytes, file.name);
    },
    [loadPdf]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type === "application/pdf") await onFileChange(file);
    },
    [onFileChange]
  );

  const startEdit = useCallback((item: TextItem) => {
    if (item.hasCJK) setCjkWarning(true);
    setEditingId(item.id);
    setEditValue(item.str);
    setEditColor(item.colorHex);
  }, []);

  const confirmEdit = useCallback(
    (item: TextItem) => {
      const trimmed = editValue.trim();
      if (!trimmed || trimmed === item.str) {
        setEditingId(null);
        return;
      }
      setEditQueue((prev) => {
        // Replace if already queued
        const existing = prev.findIndex((e) => e.itemId === item.id);
        const hex = editColor || item.colorHex;
        const r = parseInt(hex.slice(1,3),16)/255;
        const g = parseInt(hex.slice(3,5),16)/255;
        const b = parseInt(hex.slice(5,7),16)/255;
        const entry: QueuedEdit = {
          itemId: item.id,
          originalText: item.str,
          newText: trimmed,
          pageIndex: item.pageIndex,
          pdfX: item.pdfX,
          pdfY: item.pdfY,
          pdfWidth: item.pdfWidth,
          pdfHeight: item.pdfHeight,
          fontSize: item.fontSize,
          colorR: r,
          colorG: g,
          colorB: b,
          colorHex: hex,
          bgR: item.bgR,
          bgG: item.bgG,
          bgB: item.bgB,
        };
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = entry;
          return next;
        }
        return [...prev, entry];
      });
      setEditingId(null);
    },
    [editValue]
  );

  const undoLast = useCallback(() => {
    setEditQueue((prev) => prev.slice(0, -1));
  }, []);

  const removeEdit = useCallback((itemId: string) => {
    setEditQueue((prev) => prev.filter((e) => e.itemId !== itemId));
  }, []);

  const downloadEdited = useCallback(async () => {
    if (!pdfBytes || editQueue.length === 0) return;
    setIsProcessing(true);
    setAppError(null);

    // Browser-safe ArrayBuffer → base64 (no Buffer polyfill needed)
    const uint8 = new Uint8Array(pdfBytes);
    let binary = "";
    const CHUNK = 8192;
    for (let i = 0; i < uint8.length; i += CHUNK) {
      binary += String.fromCharCode(...uint8.subarray(i, i + CHUNK));
    }
    const base64 = btoa(binary);

    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64: base64,
          edits: editQueue.map((e) => ({
            pageIndex: e.pageIndex,
            x: e.pdfX,
            y: e.pdfY,
            width: e.pdfWidth,
            height: e.pdfHeight,
            newText: e.newText,
            fontSize: e.fontSize,
            colorR: e.colorR,
            colorG: e.colorG,
            colorB: e.colorB,
            bgR: e.bgR,
            bgG: e.bgG,
            bgB: e.bgB,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "encrypted") { setAppError("encrypted"); return; }
        if (data.error === "corrupt") { setAppError("corrupt"); return; }
        setAppError("timeout");
        return;
      }

      const { pdfBase64 } = await res.json();
      const binary = atob(pdfBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfName.replace(/\.pdf$/i, "") + "-edited.pdf";
      a.click();
      URL.revokeObjectURL(url);
      setEditQueue([]);
    } catch {
      setAppError("timeout");
    } finally {
      setIsProcessing(false);
    }
  }, [pdfBytes, editQueue, pdfName]);

  // Keyboard shortcut: Ctrl+Z undo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !editingId) {
        e.preventDefault();
        undoLast();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undoLast, editingId]);

  const ERROR_MESSAGES: Record<NonNullable<AppError>, string> = {
    too_large: "This PDF is too large. Max supported size is ~3MB.",
    scanned: "This PDF contains scanned images, not selectable text. OCR support coming soon.",
    encrypted: "This PDF is password-protected. Password support coming soon.",
    corrupt: "This file appears damaged or is not a valid PDF.",
    timeout: "Edit timed out. Try downloading with fewer edits at once.",
  };

  // ── Upload screen ──────────────────────────────────────────────────────────
  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">PDF Editor</h1>
            <p className="text-gray-500 text-sm mt-1">Free. No account. Files stay on your device.</p>
          </div>

          {appError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {ERROR_MESSAGES[appError]}
            </div>
          )}

          {needsPassword && pendingBytes && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm font-medium text-yellow-800 mb-2">This PDF is password-protected</p>
              <div className="flex gap-2">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") loadPdf(pendingBytes.bytes, pendingBytes.name); }}
                  placeholder="Enter password…"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={() => loadPdf(pendingBytes.bytes, pendingBytes.name)}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">Unlock</button>
              </div>
            </div>
          )}

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors
              ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-100"}`}
          >
            <div className="text-5xl mb-4">📄</div>
            <p className="text-gray-700 font-medium">Drop a PDF here</p>
            <p className="text-gray-400 text-sm mt-1">or click to browse — max 3MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Editor screen ──────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Left: PDF viewer */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2 shadow-sm">
          <span className="text-sm font-medium text-gray-700 truncate flex-1">{pdfName}</span>
          <span className="text-xs text-gray-400">{pages.length} page{pages.length !== 1 ? "s" : ""}</span>
          <button
            onClick={() => { setPages([]); setTextItems([]); setEditQueue([]); setPdfBytes(null); setAppError(null); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors ml-2"
          >
            Close
          </button>
        </div>

        {appError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {ERROR_MESSAGES[appError]}
          </div>
        )}

        {cjkWarning && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700 flex justify-between items-start">
            <span>CJK text detected — replacement will use Helvetica and may not render correctly.</span>
            <button onClick={() => setCjkWarning(false)} className="ml-2 text-yellow-500 hover:text-yellow-700">✕</button>
          </div>
        )}

        {/* Pages */}
        {pages.map((pg) => {
          const pageItems = textItems.filter((t) => t.pageIndex === pg.pageIndex);
          return (
            <div key={pg.pageIndex} className="relative inline-block shadow-lg rounded-lg overflow-hidden bg-white">
              {/* Page label */}
              <div className="absolute top-2 left-2 z-10 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">
                Page {pg.pageIndex + 1}
              </div>

              {/* Canvas — stored in ref so live preview can redraw it */}
              <canvas
                ref={(el) => {
                  if (!el) return;
                  el.width = pg.canvas.width;
                  el.height = pg.canvas.height;
                  el.getContext("2d")!.drawImage(pg.canvas, 0, 0);
                  displayCanvasRefs.current.set(pg.pageIndex, el);
                }}
                style={{ display: "block" }}
              />

              {/* Text overlay */}
              <div className="absolute inset-0" style={{ width: pg.width, height: pg.height }}>
                {pageItems.map((item) => {
                  const isEditing = editingId === item.id;
                  const queued = editQueue.find((e) => e.itemId === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => !editingId && startEdit(item)}
                      title={`Click to edit: "${item.str}"`}
                      style={{
                        position: "absolute",
                        left: item.vpX,
                        top: item.vpY,
                        width: Math.max(item.vpWidth, 16),
                        height: Math.max(item.vpHeight, 12),
                        cursor: "text",
                        zIndex: 3,
                        borderRadius: 2,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(59,130,246,0.15)"; (e.currentTarget as HTMLDivElement).style.outline = "1px solid rgba(59,130,246,0.4)"; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.background = queued ? "rgba(251,191,36,0.35)" : "transparent"; el.style.outline = queued ? "1px solid rgba(251,191,36,0.6)" : "none"; }}
                    >
                      {isEditing ? (
                        <div style={{ position: "absolute", top: 0, left: 0, zIndex: 10, display: "flex", alignItems: "center", background: "#1e293b", border: "2px solid #3b82f6", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.4)", padding: "3px 6px", minWidth: Math.max(item.vpWidth, 140), gap: 4 }}>
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmEdit(item);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            style={{
                              flex: 1,
                              fontSize: Math.max(item.vpHeight * 0.88, 12),
                              fontFamily: item.cssFontFamily,
                              fontWeight: item.fontWeight,
                              color: "#ffffff",        // always white in the dark input box — readable
                              border: "none",
                              outline: "none",
                              background: "transparent",
                              minWidth: 60,
                            }}
                          />
                          {/* Color swatch — shows output color, click to change */}
                          <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                            <span style={{ fontSize: 9, color: "#94a3b8" }}>color</span>
                            <input
                              type="color"
                              value={editColor}
                              onChange={(e) => setEditColor(e.target.value)}
                              title="Output text color"
                              style={{ width: 18, height: 18, border: "1px solid #475569", borderRadius: 3, padding: 0, cursor: "pointer", background: "none" }}
                              onMouseDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          <button
                            onMouseDown={(e) => { e.preventDefault(); confirmEdit(item); }}
                            style={{ fontSize: 11, padding: "1px 6px", color: "#fff", fontWeight: "bold", background: "#3b82f6", border: "none", borderRadius: 4, cursor: "pointer", flexShrink: 0 }}
                          >✓</button>
                        </div>
                      ) : (
                        <div
                          title={queued ? `Edited: "${queued.newText}"` : "Click to edit"}
                          style={{
                            width: "100%",
                            height: "100%",
                            background: queued
                              ? "rgba(251,191,36,0.35)"
                              : "transparent",
                            border: queued ? "1px solid rgba(251,191,36,0.6)" : "1px solid transparent",
                            borderRadius: 2,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: Edit queue */}
      <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          {/* Tab: Queue / History */}
          <div className="flex gap-1 mb-2">
            {[["queue","Edit Queue"],["history","History"]].map(([k,label]) => (
              <button key={k} onClick={() => setShowHistory(k === "history")}
                className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors
                  ${(showHistory ? k==="history" : k==="queue") ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
                {label}
              </button>
            ))}
          </div>
          {!showHistory && (
            <p className="text-xs text-gray-400">
              {editQueue.length === 0 ? "Click any text in the PDF to edit it" : `${editQueue.length} pending edit${editQueue.length !== 1 ? "s" : ""}`}
            </p>
          )}
        </div>

        {/* OCR panel (shown when scanned) */}
        {appError === "scanned" && (
          <div className="p-3 border-b border-gray-100 bg-orange-50">
            <p className="text-xs text-orange-700 font-medium mb-2">Scanned PDF — run OCR to extract text</p>
            <button onClick={async () => {
              setIsOcring(true); setOcrText(null);
              try {
                const results: string[] = [];
                for (const pg of pages) { results.push(await runOcr(pg.canvas)); }
                setOcrText(results.join("\n\n--- Page break ---\n\n"));
              } finally { setIsOcring(false); }
            }} disabled={isOcring} className="w-full text-xs bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded-lg disabled:opacity-50">
              {isOcring ? "Running OCR…" : "Run OCR (extract text)"}
            </button>
            {ocrText && (
              <div className="mt-2">
                <textarea readOnly value={ocrText} className="w-full h-32 text-xs border border-gray-200 rounded-lg p-2 resize-none" />
                <button onClick={() => navigator.clipboard.writeText(ocrText)} className="text-xs text-blue-600 hover:underline mt-1">Copy to clipboard</button>
              </div>
            )}
          </div>
        )}

        {/* Queue / History items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {showHistory ? (
            editQueue.length === 0
              ? <div className="text-center text-gray-300 text-xs py-8">No edit history yet</div>
              : editQueue.map((edit, i) => (
                <div key={edit.itemId} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-gray-400">#{i+1} · p.{edit.pageIndex + 1}</span>
                    <button onClick={() => removeEdit(edit.itemId)} className="text-gray-300 hover:text-red-400">✕</button>
                  </div>
                  <div className="text-gray-400 line-through truncate">{edit.originalText}</div>
                  <div className="text-gray-800 font-medium truncate mt-0.5">→ {edit.newText}</div>
                </div>
              ))
          ) : (
            <>
          {editQueue.length === 0 && (
            <div className="text-center text-gray-300 text-xs py-8">No edits yet</div>
          )}
          {editQueue.map((edit, i) => (
            <div key={edit.itemId} className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs">
              <div className="flex justify-between items-start mb-1">
                <span className="text-gray-400">p.{edit.pageIndex + 1}</span>
                <button
                  onClick={() => removeEdit(edit.itemId)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="text-gray-500 line-through truncate">{edit.originalText}</div>
              <div className="text-gray-800 font-medium truncate mt-0.5">→ {edit.newText}</div>
            </div>
          ))}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          {editQueue.length > 0 && (
            <button
              onClick={undoLast}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 transition-colors"
            >
              ↩ Undo last (Ctrl+Z)
            </button>
          )}
          <button
            onClick={downloadEdited}
            disabled={editQueue.length === 0 || isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            {isProcessing ? "Processing…" : "Download Edited PDF"}
          </button>
          <p className="text-xs text-gray-300 text-center">
            Files never leave your device until download
          </p>
        </div>
      </div>
    </div>
  );
}
