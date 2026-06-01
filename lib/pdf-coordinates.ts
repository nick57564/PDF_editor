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

/**
 * Sample the dominant text color from the canvas at the text item's position.
 * Samples a small area just inside the text bounding box and returns the
 * most common dark pixel color as an rgb tuple (0-1 range for pdf-lib).
 * Falls back to black if sampling fails.
 */
export function sampleTextColor(
  canvas: HTMLCanvasElement,
  vpX: number,
  vpY: number,
  vpWidth: number,
  vpHeight: number
): { r: number; g: number; b: number; hex: string } {
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return { r: 0, g: 0, b: 0, hex: "#000000" };

    const sx = Math.max(0, Math.round(vpX + 1));
    const sy = Math.max(0, Math.round(vpY + 1));
    const sw = Math.min(Math.round(vpWidth - 2), canvas.width - sx, 20);
    const sh = Math.min(Math.round(vpHeight - 2), canvas.height - sy, 20);
    if (sw <= 0 || sh <= 0) return { r: 0, g: 0, b: 0, hex: "#000000" };

    const data = ctx.getImageData(sx, sy, sw, sh).data;

    // Find darkest pixel (most likely the text color, not background)
    let minBrightness = 255;
    let bestR = 0, bestG = 0, bestB = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue; // skip transparent
      const brightness = (r + g + b) / 3;
      if (brightness < minBrightness) {
        minBrightness = brightness;
        bestR = r; bestG = g; bestB = b;
      }
    }

    // If the sampled color is very light (background), default to black
    if (minBrightness > 200) return { r: 0, g: 0, b: 0, hex: "#000000" };

    const hex = "#" + [bestR, bestG, bestB].map((v) => v.toString(16).padStart(2, "0")).join("");
    return { r: bestR / 255, g: bestG / 255, b: bestB / 255, hex };
  } catch {
    return { r: 0, g: 0, b: 0, hex: "#000000" };
  }
}
