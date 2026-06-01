export interface PdfJsTextItem {
  str: string;
  transform: number[];
  width: number;
  fontName?: string;
}

export function isCJK(text: string): boolean {
  return /[　-鿿가-힯豈-﫿]/.test(text);
}

export function isLargeFile(bytes: ArrayBuffer, maxMB = 3): boolean {
  return bytes.byteLength > maxMB * 1024 * 1024;
}

/**
 * Detect background color by finding the MOST COMMON color in the bounding box.
 * Background pixels vastly outnumber text pixels, so mode = background.
 */
export function sampleBgColor(
  canvas: HTMLCanvasElement,
  vpX: number,
  vpY: number,
  vpWidth: number,
  vpHeight: number
): { hex: string; r: number; g: number; b: number } {
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return { hex: "#ffffff", r: 1, g: 1, b: 1 };

    const x = Math.max(0, Math.round(vpX));
    const y = Math.max(0, Math.round(vpY));
    const w = Math.min(Math.round(vpWidth), canvas.width - x);
    const h = Math.min(Math.round(vpHeight), canvas.height - y);
    if (w <= 0 || h <= 0) return { hex: "#ffffff", r: 1, g: 1, b: 1 };

    const data = ctx.getImageData(x, y, w, h).data;

    // Bucket colors into 32-step bins (5-bit per channel) to find the mode
    const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      // Quantize to reduce noise
      const r = data[i] & 0xe0;
      const g = data[i + 1] & 0xe0;
      const b = data[i + 2] & 0xe0;
      const key = `${r},${g},${b}`;
      const existing = buckets.get(key);
      if (existing) { existing.count++; }
      else { buckets.set(key, { count: 1, r, g, b }); }
    }

    if (buckets.size === 0) return { hex: "#ffffff", r: 1, g: 1, b: 1 };

    // Most common bucket = background color
    let best = { count: 0, r: 255, g: 255, b: 255 };
    for (const v of buckets.values()) {
      if (v.count > best.count) best = v;
    }

    const hex = "#" + [best.r, best.g, best.b].map((v) => v.toString(16).padStart(2, "0")).join("");
    return { hex, r: best.r / 255, g: best.g / 255, b: best.b / 255 };
  } catch {
    return { hex: "#ffffff", r: 1, g: 1, b: 1 };
  }
}

/** Sample the text color — the darkest (or lightest on dark bg) pixel inside the text area. */
export function sampleTextColor(
  canvas: HTMLCanvasElement,
  vpX: number,
  vpY: number,
  vpWidth: number,
  vpHeight: number,
  bgHex: string
): { r: number; g: number; b: number; hex: string } {
  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return { r: 0, g: 0, b: 0, hex: "#000000" };

    const bgR = parseInt(bgHex.slice(1, 3), 16);
    const bgG = parseInt(bgHex.slice(3, 5), 16);
    const bgB = parseInt(bgHex.slice(5, 7), 16);
    const bgBrightness = (bgR + bgG + bgB) / 3;
    const darkBg = bgBrightness < 128; // e.g. navy background

    const sx = Math.max(0, Math.round(vpX + 1));
    const sy = Math.max(0, Math.round(vpY + 1));
    const sw = Math.min(Math.round(vpWidth - 2), canvas.width - sx, 24);
    const sh = Math.min(Math.round(vpHeight - 2), canvas.height - sy, 24);
    if (sw <= 0 || sh <= 0) return { r: darkBg ? 1 : 0, g: darkBg ? 1 : 0, b: darkBg ? 1 : 0, hex: darkBg ? "#ffffff" : "#000000" };

    const data = ctx.getImageData(sx, sy, sw, sh).data;

    // On dark background: find brightest pixel (text is light)
    // On light background: find darkest pixel (text is dark)
    let bestScore = darkBg ? -1 : 999;
    let bestR = darkBg ? 255 : 0;
    let bestG = darkBg ? 255 : 0;
    let bestB = darkBg ? 255 : 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue;
      const brightness = (r + g + b) / 3;
      // Skip pixels that look like the background
      const diffFromBg = Math.abs(brightness - bgBrightness);
      if (diffFromBg < 30) continue;

      if (darkBg && brightness > bestScore) {
        bestScore = brightness; bestR = r; bestG = g; bestB = b;
      } else if (!darkBg && brightness < bestScore) {
        bestScore = brightness; bestR = r; bestG = g; bestB = b;
      }
    }

    const hex = "#" + [bestR, bestG, bestB].map((v) => v.toString(16).padStart(2, "0")).join("");
    return { r: bestR / 255, g: bestG / 255, b: bestB / 255, hex };
  } catch {
    return { r: 0, g: 0, b: 0, hex: "#000000" };
  }
}

/** Map a PDF font name to a CSS font-family string and weight. */
export function cssFontFromPdfName(fontName: string): { family: string; weight: string } {
  const n = (fontName || "").toLowerCase();
  const bold = n.includes("bold") || n.includes("heavy") || n.includes("black");
  const italic = n.includes("italic") || n.includes("oblique");
  let family = "Helvetica, Arial, sans-serif";
  if (n.includes("times") || n.includes("roman") || n.includes("serif")) {
    family = "Times New Roman, Times, serif";
  } else if (n.includes("courier") || n.includes("mono")) {
    family = "Courier New, Courier, monospace";
  } else if (n.includes("georgia")) {
    family = "Georgia, serif";
  }
  return { family, weight: bold ? "bold" : "normal" };
}
