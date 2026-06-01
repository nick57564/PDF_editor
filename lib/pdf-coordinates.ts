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

/** Average color of a strip of pixels ABOVE the text — this is the background color. */
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
    // Sample a strip of pixels just around the mid-height of the bounding box,
    // but at the LEFT edge (1px wide) and RIGHT edge — likely background not glyph
    const samples: number[][] = [];
    const sampleAt = (sx: number, sy: number, sw: number, sh: number) => {
      const x = Math.max(0, Math.round(sx));
      const y = Math.max(0, Math.round(sy));
      const w = Math.min(Math.round(sw), canvas.width - x);
      const h = Math.min(Math.round(sh), canvas.height - y);
      if (w <= 0 || h <= 0) return;
      const data = ctx.getImageData(x, y, w, h).data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 128) samples.push([data[i], data[i+1], data[i+2]]);
      }
    };
    // Sample above and below the text item
    sampleAt(vpX, vpY - 3, Math.min(vpWidth, 30), 2);
    sampleAt(vpX, vpY + vpHeight + 1, Math.min(vpWidth, 30), 2);

    if (samples.length === 0) return { hex: "#ffffff", r: 1, g: 1, b: 1 };

    // Use the most common brightness bucket (background is usually uniform)
    let r = 0, g = 0, b = 0;
    for (const s of samples) { r += s[0]; g += s[1]; b += s[2]; }
    r = Math.round(r / samples.length);
    g = Math.round(g / samples.length);
    b = Math.round(b / samples.length);

    const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
    return { hex, r: r / 255, g: g / 255, b: b / 255 };
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
