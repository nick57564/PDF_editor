"use client";
import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";

interface PdfFile { name: string; bytes: ArrayBuffer; pageCount: number; }

export default function PdfMerge() {
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const addFiles = useCallback(async (incoming: File[]) => {
    setError("");
    const pdfs = incoming.filter((f) => f.type === "application/pdf");
    const loaded: PdfFile[] = [];
    for (const f of pdfs) {
      const bytes = await f.arrayBuffer();
      try {
        const doc = await PDFDocument.load(bytes);
        loaded.push({ name: f.name, bytes, pageCount: doc.getPageCount() });
      } catch {
        setError(`Could not load "${f.name}" — skipped.`);
      }
    }
    setFiles((prev) => [...prev, ...loaded]);
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    await addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const moveUp = (i: number) => setFiles((f) => { const a = [...f]; [a[i-1], a[i]] = [a[i], a[i-1]]; return a; });
  const moveDown = (i: number) => setFiles((f) => { const a = [...f]; [a[i], a[i+1]] = [a[i+1], a[i]]; return a; });
  const remove = (i: number) => setFiles((f) => f.filter((_, idx) => idx !== i));

  const merge = useCallback(async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    try {
      const merged = await PDFDocument.create();
      for (const f of files) {
        const src = await PDFDocument.load(f.bytes);
        const pages = await merged.copyPages(src, src.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "merged.pdf";
      a.click();
    } catch {
      setError("Merge failed. Check that all files are valid PDFs.");
    } finally {
      setIsProcessing(false);
    }
  }, [files]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Merge PDFs</h1>
        <p className="text-gray-500 text-sm mb-6">Add PDFs below, drag to reorder, then download the merged result.</p>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => { const i = document.createElement("input"); i.type="file"; i.accept="application/pdf"; i.multiple=true; i.onchange=(e)=>addFiles(Array.from((e.target as HTMLInputElement).files||[])); i.click(); }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors mb-4
            ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-100"}`}
        >
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-600 font-medium">Drop PDFs here or click to browse</p>
          <p className="text-gray-400 text-sm mt-1">Add as many files as you like</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4 shadow-sm">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
                <span className="text-2xl">📄</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{f.name}</div>
                  <div className="text-xs text-gray-400">{f.pageCount} page{f.pageCount !== 1 ? "s" : ""}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20">▲</button>
                  <button onClick={() => moveDown(i)} disabled={i === files.length - 1} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20">▼</button>
                  <button onClick={() => remove(i)} className="p-1 text-gray-300 hover:text-red-500 ml-1">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={merge}
          disabled={files.length < 2 || isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {isProcessing ? "Merging…" : `Merge ${files.length} PDF${files.length !== 1 ? "s" : ""} → Download`}
        </button>
        {files.length < 2 && <p className="text-xs text-gray-400 text-center mt-2">Add at least 2 PDFs to merge</p>}
      </div>
    </div>
  );
}
