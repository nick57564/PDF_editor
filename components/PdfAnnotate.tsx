"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

async function getPdfJs() {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return lib;
}

type Tool = "highlight" | "draw" | "text";
type Color = { r: number; g: number; b: number; hex: string };

interface Annotation {
  id: string;
  type: Tool;
  pageIndex: number;
  // highlight / text
  x: number; y: number; width: number; height: number;
  // draw path (viewport coords)
  path?: { x: number; y: number }[];
  color: Color;
  text?: string;
  fontSize?: number;
}

interface RenderedPage { canvas: HTMLCanvasElement; width: number; height: number; scale: number; pageHeightPts: number; }

const COLORS: Color[] = [
  { r: 1,    g: 0.93, b: 0,    hex: "#FFED00" },
  { r: 0.2,  g: 0.8,  b: 0.4,  hex: "#33CC66" },
  { r: 0.2,  g: 0.5,  b: 1,    hex: "#3380FF" },
  { r: 1,    g: 0.3,  b: 0.3,  hex: "#FF4D4D" },
  { r: 0,    g: 0,    b: 0,    hex: "#000000" },
];

const SCALE = 1.5;
let annIdCounter = 0;
function newId() { return `ann-${++annIdCounter}`; }

export default function PdfAnnotate() {
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tool, setTool] = useState<Tool>("highlight");
  const [color, setColor] = useState<Color>(COLORS[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Drawing state
  const drawing = useRef(false);
  const drawStart = useRef<{ x: number; y: number; pageIndex: number } | null>(null);
  const currentPath = useRef<{ x: number; y: number }[]>([]);
  const [previewRect, setPreviewRect] = useState<{ x: number; y: number; w: number; h: number; pageIndex: number } | null>(null);

  // Text input
  const [pendingText, setPendingText] = useState<{ x: number; y: number; pageIndex: number } | null>(null);
  const [textInput, setTextInput] = useState("");
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (pendingText) textInputRef.current?.focus(); }, [pendingText]);

  const loadPdf = useCallback(async (file: File) => {
    setError(""); setPages([]); setAnnotations([]);
    const bytes = await file.arrayBuffer();
    const pdfjs = await getPdfJs();
    let pdf: never;
    try {
      // @ts-expect-error pdfjs types
      pdf = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
    } catch { setError("Could not open this PDF."); return; }
    const rendered: RenderedPage[] = [];
    // @ts-expect-error pdfjs types
    for (let i = 0; i < pdf.numPages; i++) {
      // @ts-expect-error pdfjs types
      const page = await pdf.getPage(i + 1);
      const vp = page.getViewport({ scale: SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = vp.width; canvas.height = vp.height;
      await page.render({ canvas, viewport: vp } as never).promise;
      rendered.push({ canvas, width: vp.width, height: vp.height, scale: SCALE, pageHeightPts: vp.viewBox[3] });
    }
    setPdfBytes(bytes); setPdfName(file.name); setPages(rendered);
  }, []);

  function getPos(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>, pageIndex: number) {
    if (tool === "text") {
      const { x, y } = getPos(e);
      setPendingText({ x, y, pageIndex }); setTextInput(""); return;
    }
    drawing.current = true;
    const { x, y } = getPos(e);
    drawStart.current = { x, y, pageIndex };
    currentPath.current = [{ x, y }];
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>, pageIndex: number) {
    if (!drawing.current || !drawStart.current || drawStart.current.pageIndex !== pageIndex) return;
    const { x, y } = getPos(e);
    if (tool === "draw") {
      currentPath.current.push({ x, y });
    } else {
      const { x: sx, y: sy } = drawStart.current;
      setPreviewRect({ x: Math.min(sx, x), y: Math.min(sy, y), w: Math.abs(x - sx), h: Math.abs(y - sy), pageIndex });
    }
  }

  function onMouseUp(e: React.MouseEvent<HTMLDivElement>, pageIndex: number, pg: RenderedPage) {
    if (!drawing.current || !drawStart.current) return;
    drawing.current = false;
    const { x, y } = getPos(e);
    const { x: sx, y: sy } = drawStart.current;
    setPreviewRect(null);

    if (tool === "highlight") {
      const rx = Math.min(sx, x), ry = Math.min(sy, y), rw = Math.abs(x - sx), rh = Math.abs(y - sy);
      if (rw < 4 || rh < 4) return;
      setAnnotations((a) => [...a, { id: newId(), type: "highlight", pageIndex, x: rx / pg.scale, y: pg.pageHeightPts - ry / pg.scale - rh / pg.scale, width: rw / pg.scale, height: rh / pg.scale, color }]);
    } else if (tool === "draw") {
      if (currentPath.current.length < 2) return;
      const rx = Math.min(sx, x), ry = Math.min(sy, y), rw = Math.abs(x - sx) || 1, rh = Math.abs(y - sy) || 1;
      setAnnotations((a) => [...a, { id: newId(), type: "draw", pageIndex, x: rx / pg.scale, y: pg.pageHeightPts - ry / pg.scale - rh / pg.scale, width: rw / pg.scale, height: rh / pg.scale, path: [...currentPath.current], color }]);
    }
    drawStart.current = null; currentPath.current = [];
  }

  function confirmText(pg: RenderedPage) {
    if (!pendingText || !textInput.trim()) { setPendingText(null); return; }
    setAnnotations((a) => [...a, {
      id: newId(), type: "text", pageIndex: pendingText.pageIndex,
      x: pendingText.x / pg.scale,
      y: pg.pageHeightPts - pendingText.y / pg.scale - 20,
      width: 200 / pg.scale, height: 20 / pg.scale,
      color, text: textInput, fontSize: 12,
    }]);
    setPendingText(null); setTextInput("");
  }

  const download = useCallback(async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(pdfBytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pdfPages = doc.getPages();
      for (const ann of annotations) {
        const page = pdfPages[ann.pageIndex];
        if (!page) continue;
        const c = ann.color;
        if (ann.type === "highlight") {
          page.drawRectangle({ x: ann.x, y: ann.y, width: ann.width, height: ann.height, color: rgb(c.r, c.g, c.b), opacity: 0.35 });
        } else if (ann.type === "text" && ann.text) {
          page.drawText(ann.text, { x: ann.x, y: ann.y, size: ann.fontSize || 12, font, color: rgb(c.r, c.g, c.b) });
        } else if (ann.type === "draw" && ann.path) {
          const pg = pages[ann.pageIndex];
          // Draw each segment as a small line via rectangles
          for (let i = 1; i < ann.path.length; i++) {
            const x1 = ann.path[i-1].x / pg.scale, y1 = pg.pageHeightPts - ann.path[i-1].y / pg.scale;
            const x2 = ann.path[i].x / pg.scale, y2 = pg.pageHeightPts - ann.path[i].y / pg.scale;
            const dx = x2 - x1, dy = y2 - y1;
            const len = Math.sqrt(dx*dx + dy*dy) || 1;
            const steps = Math.ceil(len);
            for (let s = 0; s <= steps; s++) {
              const t = s / steps;
              page.drawCircle({ x: x1 + dx*t, y: y1 + dy*t, size: 1, color: rgb(c.r, c.g, c.b) });
            }
          }
        }
      }
      const out = await doc.save();
      const blob = new Blob([out as unknown as BlobPart], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = pdfName.replace(/\.pdf$/i, "") + "-annotated.pdf"; a.click();
    } catch { setError("Could not apply annotations."); }
    finally { setIsProcessing(false); }
  }, [pdfBytes, annotations, pdfName, pages]);

  if (!pdfBytes || pages.length === 0) return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Annotate PDF</h1>
        <p className="text-gray-500 text-sm mb-6 text-center">Highlight, draw, and add text notes.</p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) await loadPdf(f); }}
          onClick={() => { const i = document.createElement("input"); i.type="file"; i.accept="application/pdf"; i.onchange=async(e)=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(f) await loadPdf(f); }; i.click(); }}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors
            ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-100"}`}
        >
          <div className="text-4xl mb-2">🖊️</div>
          <p className="text-gray-600 font-medium">Drop a PDF here or click to browse</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2 shadow-sm">
          <span className="text-sm font-medium text-gray-700 truncate flex-1">{pdfName}</span>
          <button onClick={() => { setPages([]); setPdfBytes(null); setAnnotations([]); }} className="text-xs text-gray-400 hover:text-red-500">Close</button>
        </div>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

        {pages.map((pg, pageIndex) => (
          <div key={pageIndex} className="relative inline-block shadow-lg rounded-lg overflow-hidden bg-white select-none">
            <div className="absolute top-2 left-2 z-10 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">Page {pageIndex + 1}</div>
            <canvas ref={(el) => { if (el) { el.width = pg.canvas.width; el.height = pg.canvas.height; el.getContext("2d")!.drawImage(pg.canvas, 0, 0); } }} style={{ display: "block" }} />

            {/* Annotation overlay */}
            <div
              className="absolute inset-0"
              style={{ cursor: tool === "text" ? "text" : tool === "draw" ? "crosshair" : "crosshair" }}
              onMouseDown={(e) => onMouseDown(e, pageIndex)}
              onMouseMove={(e) => onMouseMove(e, pageIndex)}
              onMouseUp={(e) => onMouseUp(e, pageIndex, pg)}
            >
              {/* Rendered annotations */}
              {annotations.filter((a) => a.pageIndex === pageIndex).map((ann) => {
                const vpX = ann.x * pg.scale;
                const vpY = pg.height - (ann.y * pg.scale) - (ann.height * pg.scale);
                if (ann.type === "highlight") return (
                  <div key={ann.id} style={{ position:"absolute", left: vpX, top: vpY, width: ann.width * pg.scale, height: ann.height * pg.scale, background: ann.color.hex, opacity: 0.35, pointerEvents:"none" }} />
                );
                if (ann.type === "text") return (
                  <div key={ann.id} style={{ position:"absolute", left: vpX, top: vpY, color: ann.color.hex, fontSize: (ann.fontSize||12)*pg.scale, fontFamily:"Helvetica,Arial,sans-serif", pointerEvents:"none", whiteSpace:"nowrap" }}>{ann.text}</div>
                );
                return null;
              })}

              {/* Draw paths (SVG overlay) */}
              <svg className="absolute inset-0 pointer-events-none" width={pg.width} height={pg.height}>
                {annotations.filter((a) => a.pageIndex === pageIndex && a.type === "draw" && a.path).map((ann) => (
                  <polyline key={ann.id} points={ann.path!.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={ann.color.hex} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </svg>

              {/* Preview rect */}
              {previewRect && previewRect.pageIndex === pageIndex && tool === "highlight" && (
                <div style={{ position:"absolute", left: previewRect.x, top: previewRect.y, width: previewRect.w, height: previewRect.h, background: color.hex, opacity: 0.3, border: `2px solid ${color.hex}`, pointerEvents:"none" }} />
              )}

              {/* Text input */}
              {pendingText && pendingText.pageIndex === pageIndex && (
                <div style={{ position:"absolute", left: pendingText.x, top: pendingText.y }}>
                  <input ref={textInputRef} value={textInput} onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") confirmText(pg); if (e.key === "Escape") setPendingText(null); }}
                    onBlur={() => confirmText(pg)}
                    style={{ fontSize: 14, color: color.hex, background:"rgba(255,255,255,0.9)", border:"1px solid #3b82f6", outline:"none", padding:"2px 4px", borderRadius: 4 }}
                    placeholder="Type note…"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar sidebar */}
      <div className="w-56 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col p-4 gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Tool</div>
          {([["highlight","🟡 Highlight"],["draw","✏️ Draw"],["text","📝 Text"]] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTool(t)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors
                ${tool === t ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {label}
            </button>
          ))}
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Color</div>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button key={c.hex} onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${color.hex === c.hex ? "border-gray-800 scale-110" : "border-transparent"}`}
                style={{ background: c.hex }} />
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Annotations ({annotations.length})</div>
          <button onClick={() => setAnnotations((a) => a.slice(0, -1))} disabled={annotations.length === 0}
            className="w-full text-xs text-gray-400 hover:text-red-500 disabled:opacity-30 py-1">↩ Undo last</button>
          <button onClick={() => setAnnotations([])} disabled={annotations.length === 0}
            className="w-full text-xs text-gray-400 hover:text-red-500 disabled:opacity-30 py-1">🗑 Clear all</button>
        </div>

        <div className="mt-auto space-y-2">
          <button onClick={download} disabled={annotations.length === 0 || isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
            {isProcessing ? "Saving…" : "Download Annotated PDF"}
          </button>
          <p className="text-xs text-gray-300 text-center">Files never stored</p>
        </div>
      </div>
    </div>
  );
}
