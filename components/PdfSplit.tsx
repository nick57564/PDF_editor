"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { PDFDocument } from "pdf-lib";

async function getPdfJs() {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${lib.version}/pdf.worker.min.mjs`;
  return lib;
}

interface PageThumb { index: number; canvas: HTMLCanvasElement; selected: boolean; }

export default function PdfSplit() {
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [thumbs, setThumbs] = useState<PageThumb[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"extract" | "remove">("extract");

  const loadPdf = useCallback(async (file: File) => {
    setError(""); setThumbs([]);
    const bytes = await file.arrayBuffer();
    const pdfjs = await getPdfJs();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdf: any;
    try {
      
      pdf = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
    } catch {
      setError("Could not open this PDF."); return;
    }
    const pages: PageThumb[] = [];
    for (let i = 0; i < pdf.numPages; i++) {
      
      const page = await pdf.getPage(i + 1);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width; canvas.height = viewport.height;
      
      await page.render({ canvas, viewport } as never).promise;
      pages.push({ index: i, canvas, selected: false });
    }
    setPdfBytes(bytes); setPdfName(file.name); setThumbs(pages);
  }, []);

  const togglePage = (i: number) =>
    setThumbs((t) => t.map((p, idx) => idx === i ? { ...p, selected: !p.selected } : p));

  const selectAll = () => setThumbs((t) => t.map((p) => ({ ...p, selected: true })));
  const selectNone = () => setThumbs((t) => t.map((p) => ({ ...p, selected: false })));

  const selectedIndices = thumbs.filter((t) => t.selected).map((t) => t.index);

  const process = useCallback(async () => {
    if (!pdfBytes || selectedIndices.length === 0) return;
    setIsProcessing(true);
    try {
      const src = await PDFDocument.load(pdfBytes);
      const out = await PDFDocument.create();
      const keep = mode === "extract"
        ? selectedIndices
        : thumbs.filter((t) => !t.selected).map((t) => t.index);
      if (keep.length === 0) { setError("No pages to keep."); return; }
      const copied = await out.copyPages(src, keep);
      copied.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = pdfName.replace(/\.pdf$/i, "") + (mode === "extract" ? "-extracted" : "-removed") + ".pdf";
      a.click();
    } catch {
      setError("Processing failed.");
    } finally {
      setIsProcessing(false);
    }
  }, [pdfBytes, selectedIndices, mode, thumbs, pdfName]);

  if (!pdfBytes) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Split PDF</h1>
        <p className="text-gray-500 text-sm mb-6 text-center">Select pages to extract or remove.</p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) await loadPdf(f); }}
          onClick={() => { const i = document.createElement("input"); i.type="file"; i.accept="application/pdf"; i.onchange=async(e)=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(f) await loadPdf(f); }; i.click(); }}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors
            ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-100"}`}
        >
          <div className="text-4xl mb-2">✂️</div>
          <p className="text-gray-600 font-medium">Drop a PDF here or click to browse</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="text-xl font-bold text-gray-900 flex-1">{pdfName}</h1>
          <button onClick={() => { setPdfBytes(null); setThumbs([]); }} className="text-sm text-gray-400 hover:text-red-500">✕ Close</button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

        {/* Mode + controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex bg-white border border-gray-200 rounded-xl p-1 gap-1">
            {(["extract","remove"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${mode === m ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
                {m === "extract" ? "Extract selected" : "Remove selected"}
              </button>
            ))}
          </div>
          <button onClick={selectAll} className="text-sm text-blue-600 hover:underline">Select all</button>
          <button onClick={selectNone} className="text-sm text-gray-400 hover:underline">None</button>
          <span className="text-sm text-gray-400 ml-auto">{selectedIndices.length} of {thumbs.length} selected</span>
        </div>

        {/* Thumbnails */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-6">
          {thumbs.map((t, i) => (
            <button key={i} onClick={() => togglePage(i)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all
                ${t.selected ? "border-blue-500 shadow-md" : "border-gray-200 hover:border-gray-400"}`}>
              <canvas ref={(el) => { if (el) { el.width = t.canvas.width; el.height = t.canvas.height; el.getContext("2d")!.drawImage(t.canvas, 0, 0); } }} className="w-full" />
              {t.selected && <div className="absolute top-1 right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">✓</div>}
              <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs text-center py-0.5">{i + 1}</div>
            </button>
          ))}
        </div>

        <button
          onClick={process}
          disabled={selectedIndices.length === 0 || isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {isProcessing ? "Processing…" : mode === "extract" ? `Extract ${selectedIndices.length} page(s) → Download` : `Remove ${selectedIndices.length} page(s) → Download`}
        </button>
      </div>
    </div>
  );
}
