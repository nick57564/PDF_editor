"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

async function getPdfJs() {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  return lib;
}

interface RenderedPage { canvas: HTMLCanvasElement; width: number; height: number; scale: number; }
interface PlacedSig { pageIndex: number; x: number; y: number; width: number; height: number; imgData: string; }

const SCALE = 1.5;

export default function PdfSign() {
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Signature pad
  const sigCanvas = useRef<HTMLCanvasElement>(null);
  const sigDrawing = useRef(false);
  const [hasSig, setHasSig] = useState(false);
  const [showPad, setShowPad] = useState(false);

  // Placed signatures
  const [placedSigs, setPlacedSigs] = useState<PlacedSig[]>([]);
  const [placingMode, setPlacingMode] = useState(false);
  const [currentSigData, setCurrentSigData] = useState<string>("");

  // Password
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);

  const loadPdf = useCallback(async (bytes: ArrayBuffer, name: string, pass?: string) => {
    setError(""); setPages([]); setPlacedSigs([]);
    const pdfjs = await getPdfJs();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pdf: any;
    try {
      pdf = await pdfjs.getDocument({ data: bytes.slice(0), password: pass }).promise;
    } catch (e: unknown) {
      const msg = String(e);
      if (msg.toLowerCase().includes("password")) { setNeedsPassword(true); setPdfBytes(bytes); setPdfName(name); return; }
      setError("Could not open this PDF."); return;
    }
    setNeedsPassword(false);
    const rendered: RenderedPage[] = [];
    for (let i = 0; i < pdf.numPages; i++) {
      
      const page = await pdf.getPage(i + 1);
      const vp = page.getViewport({ scale: SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = vp.width; canvas.height = vp.height;
      
      await page.render({ canvas, viewport: vp } as never).promise;
      rendered.push({ canvas, width: vp.width, height: vp.height, scale: SCALE });
    }
    setPdfBytes(bytes); setPdfName(name); setPages(rendered);
  }, []);

  // Signature pad drawing
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    sigDrawing.current = true;
    const ctx = sigCanvas.current!.getContext("2d")!;
    const r = sigCanvas.current!.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - r.left : e.clientX - r.left;
    const y = "touches" in e ? e.touches[0].clientY - r.top : e.clientY - r.top;
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sigDrawing.current) return;
    const ctx = sigCanvas.current!.getContext("2d")!;
    const r = sigCanvas.current!.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - r.left : e.clientX - r.left;
    const y = "touches" in e ? e.touches[0].clientY - r.top : e.clientY - r.top;
    ctx.lineTo(x, y); ctx.strokeStyle = "#1e40af"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.stroke();
    setHasSig(true);
  };
  const endDraw = () => { sigDrawing.current = false; };
  const clearSig = () => {
    const ctx = sigCanvas.current!.getContext("2d")!;
    ctx.clearRect(0, 0, sigCanvas.current!.width, sigCanvas.current!.height);
    setHasSig(false);
  };
  const saveSig = () => {
    setCurrentSigData(sigCanvas.current!.toDataURL("image/png"));
    setShowPad(false);
    setPlacingMode(true);
  };

  // Place signature on page click
  const placeSignature = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number, page: RenderedPage) => {
    if (!placingMode || !currentSigData) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const vpX = e.clientX - rect.left;
    const vpY = e.clientY - rect.top;
    const sigW = 160; const sigH = 60;
    // Convert to pdf-lib coords
    const pageHeightPts = page.height / page.scale;
    const pdfX = vpX / page.scale;
    const pdfY = pageHeightPts - (vpY / page.scale) - (sigH / page.scale);
    setPlacedSigs((prev) => [...prev, {
      pageIndex, imgData: currentSigData,
      x: pdfX, y: pdfY,
      width: sigW / page.scale, height: sigH / page.scale,
    }]);
    setPlacingMode(false);
  };

  const download = useCallback(async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    try {
      const doc = await PDFDocument.load(pdfBytes, { password: password || undefined } as never);
      const pdfPages = doc.getPages();
      for (const sig of placedSigs) {
        const page = pdfPages[sig.pageIndex];
        if (!page) continue;
        const imgBytes = await fetch(sig.imgData).then((r) => r.arrayBuffer());
        const img = await doc.embedPng(imgBytes);
        page.drawImage(img, { x: sig.x, y: sig.y, width: sig.width, height: sig.height });
      }
      const out = await doc.save();
      const blob = new Blob([out as unknown as BlobPart], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = pdfName.replace(/\.pdf$/i, "") + "-signed.pdf"; a.click();
    } catch { setError("Could not apply signatures."); }
    finally { setIsProcessing(false); }
  }, [pdfBytes, placedSigs, pdfName, password]);

  if (!pdfBytes || pages.length === 0) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center">Fill & Sign</h1>
        <p className="text-gray-500 text-sm mb-6 text-center">Draw your signature and place it anywhere on the PDF.</p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

        {needsPassword && pdfBytes && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm font-medium text-yellow-800 mb-2">This PDF is password-protected</p>
            <div className="flex gap-2">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password…"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => loadPdf(pdfBytes, pdfName, password)}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg">Unlock</button>
            </div>
          </div>
        )}

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) await loadPdf(await f.arrayBuffer(), f.name); }}
          onClick={() => { const i = document.createElement("input"); i.type="file"; i.accept="application/pdf"; i.onchange=async(e)=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(f) await loadPdf(await f.arrayBuffer(), f.name); }; i.click(); }}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors
            ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-100"}`}
        >
          <div className="text-4xl mb-2">✍️</div>
          <p className="text-gray-600 font-medium">Drop a PDF here or click to browse</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* PDF viewer */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-4 py-2 shadow-sm">
          <span className="text-sm font-medium text-gray-700 truncate flex-1">{pdfName}</span>
          {placingMode && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">Click to place signature</span>}
          <button onClick={() => { setPages([]); setPdfBytes(null); }} className="text-xs text-gray-400 hover:text-red-500">Close</button>
        </div>
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

        {pages.map((pg, pageIndex) => (
          <div key={pageIndex} className="relative inline-block shadow-lg rounded-lg overflow-hidden bg-white">
            <div className="absolute top-2 left-2 z-10 bg-black/40 text-white text-xs px-2 py-0.5 rounded-full">Page {pageIndex + 1}</div>
            <canvas ref={(el) => { if (el) { el.width = pg.canvas.width; el.height = pg.canvas.height; el.getContext("2d")!.drawImage(pg.canvas, 0, 0); } }} style={{ display: "block" }} />
            {/* Click overlay for placing signature */}
            <div
              className={`absolute inset-0 ${placingMode ? "cursor-crosshair" : ""}`}
              onClick={(e) => placeSignature(e, pageIndex, pg)}
            >
              {/* Show placed signatures */}
              {placedSigs.filter((s) => s.pageIndex === pageIndex).map((s, i) => (
                <img key={i} src={s.imgData} alt="signature"
                  style={{
                    position: "absolute",
                    left: s.x * pg.scale,
                    top: pg.height - (s.y * pg.scale) - (s.height * pg.scale),
                    width: s.width * pg.scale,
                    height: s.height * pg.scale,
                    pointerEvents: "none",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col p-4 gap-3 overflow-y-auto">
        <h2 className="font-semibold text-gray-800 text-sm">Signature</h2>

        {!showPad && (
          <button onClick={() => setShowPad(true)}
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
            {hasSig && currentSigData
              ? <img src={currentSigData} alt="sig" className="max-h-12 mx-auto" />
              : "✍️ Draw signature"}
          </button>
        )}

        {showPad && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <canvas ref={sigCanvas} width={220} height={90} className="bg-gray-50 w-full touch-none"
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
            <div className="flex gap-2 p-2 border-t border-gray-100">
              <button onClick={clearSig} className="flex-1 text-xs text-gray-500 hover:text-red-500 py-1">Clear</button>
              <button onClick={saveSig} disabled={!hasSig} className="flex-1 text-xs bg-blue-600 text-white py-1 rounded-lg disabled:bg-gray-200 disabled:text-gray-400">Use →</button>
            </div>
          </div>
        )}

        {currentSigData && !showPad && (
          <button onClick={() => setPlacingMode(true)} disabled={placingMode}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm py-2 rounded-xl transition-colors">
            {placingMode ? "Click on PDF…" : "Place on PDF"}
          </button>
        )}

        {placedSigs.length > 0 && (
          <>
            <div className="text-xs text-gray-400">{placedSigs.length} signature{placedSigs.length !== 1 ? "s" : ""} placed</div>
            <button onClick={() => setPlacedSigs((p) => p.slice(0, -1))} className="text-xs text-gray-400 hover:text-red-500">↩ Undo last</button>
            <button onClick={download} disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-200 text-white text-sm py-2.5 rounded-xl transition-colors font-medium">
              {isProcessing ? "Saving…" : "Download Signed PDF"}
            </button>
          </>
        )}
        <p className="text-xs text-gray-300 text-center mt-auto">Files never stored server-side</p>
      </div>
    </div>
  );
}
