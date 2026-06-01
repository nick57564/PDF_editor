/**
 * Converts PDF.js viewport coordinates to pdf-lib user space coordinates.
 *
 * PDF.js text layer items use top-left origin, scaled by viewport.scale.
 * pdf-lib uses bottom-left origin, in unscaled PDF points.
 */
export interface PdfJsTextItem {
  str: string;
  transform: number[]; // [scaleX, skewY, skewX, scaleY, tx, ty]
  width: number;
  fontName?: string;
}

export interface PdfLibCoords {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
}

export function convertToPdfLibCoords(
  item: PdfJsTextItem,
  viewportScale: number,
  pageHeightPts: number
): PdfLibCoords {
  const scaleY = Math.abs(item.transform[3]);
  const height = scaleY / viewportScale;
  const x = item.transform[4] / viewportScale;
  const y = pageHeightPts - item.transform[5] / viewportScale - height;
  const width = item.width / viewportScale;
  const fontSize = height;

  return { x, y, width, height, fontSize };
}

export function isCJK(text: string): boolean {
  return /[　-鿿가-힯豈-﫿]/.test(text);
}

export function isLargeFile(bytes: ArrayBuffer, maxMB = 3): boolean {
  return bytes.byteLength > maxMB * 1024 * 1024;
}
