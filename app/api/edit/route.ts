import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

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
  isBold?: boolean;
  isItalic?: boolean;
}

export const maxDuration = 60;

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
    // updateMetadata:false + parseSpeed:1500 make large PDFs load ~3× faster
    pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: false, updateMetadata: false, parseSpeed: 1500 } as never);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("encrypt")) {
      return NextResponse.json({ error: "encrypted" }, { status: 422 });
    }
    return NextResponse.json({ error: "corrupt" }, { status: 422 });
  }

  // Pre-embed all four Helvetica variants (bold/italic combos) — only used variants get embedded
  const fontCache = new Map<string, PDFFont>();
  async function getFont(bold: boolean, italic: boolean): Promise<PDFFont> {
    const key = `${bold}-${italic}`;
    if (fontCache.has(key)) return fontCache.get(key)!;
    let name: StandardFonts;
    if (bold && italic)       name = StandardFonts.HelveticaBoldOblique;
    else if (bold)            name = StandardFonts.HelveticaBold;
    else if (italic)          name = StandardFonts.HelveticaOblique;
    else                      name = StandardFonts.Helvetica;
    const font = await pdfDoc.embedFont(name);
    fontCache.set(key, font);
    return font;
  }

  const pages = pdfDoc.getPages();

  for (const edit of edits) {
    const page = pages[edit.pageIndex];
    if (!page) continue;

    const { x, y, width, height, newText, fontSize } = edit;
    const safeSize = Math.max(fontSize, 6);

    // Pick font variant matching original bold/italic
    const font = await getFont(edit.isBold ?? false, edit.isItalic ?? false);

    // Use detected text color, default to black
    const textColor = rgb(edit.colorR ?? 0, edit.colorG ?? 0, edit.colorB ?? 0);

    // Use detected background color (e.g. dark navy, not white)
    const bgColor = rgb(edit.bgR ?? 1, edit.bgG ?? 1, edit.bgB ?? 1);

    // ── Auto-fit the replacement to the original footprint ──────────────────
    // pdf-lib's `maxWidth` WRAPS overflow onto new lines (it does not clip),
    // so any replacement even slightly wider than the original (e.g. a
    // Helvetica redraw of a narrower source font) got broken onto extra lines
    // that cascade down and overlap. Scale the font down to fit instead, so the
    // replacement always stays on ONE line.
    let renderSize = safeSize;
    let newWidth = font.widthOfTextAtSize(newText, renderSize);
    if (width > 0 && newWidth > width) {
      renderSize = Math.max(6, safeSize * (width / newWidth));
      newWidth = font.widthOfTextAtSize(newText, renderSize);
    }

    // ── Cover the ORIGINAL glyphs completely ────────────────────────────────
    // `width` is an advance width and can fall short of the actual rendered ink
    // (custom fonts, letter/word spacing, faux-bold), which left ghost pixels
    // peeking out from under the replacement. Pad horizontally to match the
    // live preview's coverage and cover the wider of the original box and the
    // replacement so nothing of the original survives.
    const padLeft = safeSize * 0.15;
    const padRight = safeSize * 0.65;
    const padY = safeSize * 0.25;
    const coverWidth = Math.max(width, newWidth) + padLeft + padRight;
    page.drawRectangle({
      x: x - padLeft,
      y: y - padY,
      width: coverWidth,
      height: height + padY * 2,
      color: bgColor,
      opacity: 1,
    });

    // Draw the replacement on the ORIGINAL baseline. The incoming `y` sits
    // fontSize*0.2 below the baseline (see client pdfCoords), so add it back
    // instead of the old y + padY*0.3, which dropped the text ~0.15em too low.
    page.drawText(newText, {
      x,
      y: y + fontSize * 0.2,
      size: renderSize,
      font,
      color: textColor,
    });
  }

  const modifiedBytes = await pdfDoc.save();
  const resultBase64 = Buffer.from(modifiedBytes).toString("base64");
  return NextResponse.json({ pdfBase64: resultBase64 });
}
