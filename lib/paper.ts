export type PaperSize = "A3" | "A4" | "A5";
export type PaperOrientation = "portrait" | "landscape";

export type PaperSettings = {
  size: PaperSize;
  orientation: PaperOrientation;
  marginMm: number;
  fontSizePx: number;
};

const DIN_SIZES: Record<PaperSize, { width: number; height: number }> = {
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
};

export function getPaperDimensions(settings: PaperSettings) {
  const base = DIN_SIZES[settings.size];
  if (settings.orientation === "portrait") {
    return { widthMm: base.width, heightMm: base.height };
  }
  return { widthMm: base.height, heightMm: base.width };
}

export function getContentDimensions(settings: PaperSettings) {
  const { widthMm, heightMm } = getPaperDimensions(settings);
  const margin = Math.max(0, settings.marginMm);
  return {
    widthMm: Math.max(0, widthMm - margin * 2),
    heightMm: Math.max(0, heightMm - margin * 2),
  };
}

export function estimateLineCapacity(settings: PaperSettings) {
  const lineHeightMultiplier = 1.35;
  const pxPerMm = 3.7795;
  const lineHeightPx = settings.fontSizePx * lineHeightMultiplier;
  const lineHeightMm = lineHeightPx / pxPerMm;
  const { heightMm } = getContentDimensions(settings);
  return Math.floor(heightMm / lineHeightMm);
}

export function estimateFitStatus(lineCount: number, settings: PaperSettings) {
  const maxLines = estimateLineCapacity(settings);
  const ratio = maxLines > 0 ? lineCount / maxLines : 1;
  if (ratio <= 0.92) return { status: "ok", maxLines };
  if (ratio <= 1.05) return { status: "tight", maxLines };
  return { status: "over", maxLines };
}
