import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface EditPayload {
  pdfBase64: string;
  edits: PdfEdit[];
}

export interface PdfEdit {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  newText: string;
  fontSize: number;
  colorR?: number;
  colorG?: number;
  colorB?: number;
  bgR?: number;
  bgG?: number;
  bgB?: number;
}

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  let body: EditPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { pdfBase64, edits } = body;
  if (!pdfBase64 || !Array.isArray(edits) || edits.length === 0) {
    return NextResponse.json({ error: "Missing pdfBase64 or edits" }, { status: 400 });
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = Uint8Array.from(Buffer.from(pdfBase64, "base64"));
  } catch {
    return NextResponse.json({ error: "Invalid base64 PDF data" }, { status: 400 });
  }

  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("encrypt")) {
      return NextResponse.json({ error: "encrypted" }, { status: 422 });
    }
    return NextResponse.json({ error: "corrupt" }, { status: 422 });
  }

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const edit of edits) {
    const page = pages[edit.pageIndex];
    if (!page) continue;

    const { x, y, width, height, newText, fontSize } = edit;
    const safeSize = Math.max(fontSize, 6);

    // Use detected text color, default to black
    const textColor = rgb(edit.colorR ?? 0, edit.colorG ?? 0, edit.colorB ?? 0);

    // Use detected background color (e.g. dark navy, not white)
    const bgColor = rgb(edit.bgR ?? 1, edit.bgG ?? 1, edit.bgB ?? 1);

    // Draw cover rectangle with generous padding so no original text peeks through
    const padX = safeSize * 0.15;
    const padY = safeSize * 0.25;
    page.drawRectangle({
      x: x - padX,
      y: y - padY,
      width: width + padX * 2 + safeSize * 0.5, // extra width for safety
      height: height + padY * 2,
      color: bgColor,
      opacity: 1,
    });

    page.drawText(newText, {
      x,
      y: y + padY * 0.3,
      size: safeSize,
      font: helvetica,
      color: textColor,
    });
  }

  const modifiedBytes = await pdfDoc.save();
  const resultBase64 = Buffer.from(modifiedBytes).toString("base64");
  return NextResponse.json({ pdfBase64: resultBase64 });
}
