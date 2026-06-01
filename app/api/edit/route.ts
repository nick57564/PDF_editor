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
    const textColor = rgb(
      edit.colorR ?? 0,
      edit.colorG ?? 0,
      edit.colorB ?? 0
    );

    // Sample background color by slightly expanding the rectangle area
    // We use white as a safe default — works for white-background PDFs
    page.drawRectangle({
      x: x - 0.5,
      y: y - 0.5,
      width: width + 2,
      height: height + 2,
      color: rgb(1, 1, 1),
      opacity: 1,
    });

    page.drawText(newText, {
      x,
      y: y + 1,
      size: safeSize,
      font: helvetica,
      color: textColor,
    });
  }

  const modifiedBytes = await pdfDoc.save();
  const resultBase64 = Buffer.from(modifiedBytes).toString("base64");
  return NextResponse.json({ pdfBase64: resultBase64 });
}
