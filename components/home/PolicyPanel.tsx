"use client";

import { estimateFitStatus, getContentDimensions, getPaperDimensions } from "@/lib/paper";

type PolicyPanelProps = {
  size: "A3" | "A4" | "A5";
  orientation: "portrait" | "landscape";
  marginMm: number;
  fontSizePx: number;
  lineCount: number;
  onSizeChange: (value: "A3" | "A4" | "A5") => void;
  onOrientationChange: (value: "portrait" | "landscape") => void;
  onMarginChange: (value: number) => void;
  onFontSizeChange: (value: number) => void;
  onExportPdf: () => void;
};

export default function PolicyPanel({
  size,
  orientation,
  marginMm,
  fontSizePx,
  lineCount,
  onSizeChange,
  onOrientationChange,
  onMarginChange,
  onFontSizeChange,
  onExportPdf,
}: PolicyPanelProps) {
  const dimensions = getPaperDimensions({ size, orientation, marginMm, fontSizePx });
  const content = getContentDimensions({ size, orientation, marginMm, fontSizePx });
  const fit = estimateFitStatus(lineCount, { size, orientation, marginMm, fontSizePx });
  const fitLabel =
    fit.status === "ok"
      ? "Likely fits"
      : fit.status === "tight"
        ? "Tight fit"
        : "Over capacity";

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg shadow-zinc-200/50">
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="text-lg font-semibold">Cheat sheet policy</h2>
        <p className="text-sm text-zinc-500">
          DIN paper size, orientation, margins, and typography settings.
        </p>
      </div>
      <div className="mt-4 grid gap-4 text-sm text-zinc-700">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Paper size (DIN)
          </span>
          <select
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            value={size}
            onChange={(event) => onSizeChange(event.target.value as "A3" | "A4" | "A5")}
          >
            <option value="A3">A3</option>
            <option value="A4">A4</option>
            <option value="A5">A5</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Orientation
          </span>
          <select
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            value={orientation}
            onChange={(event) =>
              onOrientationChange(event.target.value as "portrait" | "landscape")
            }
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Margin (mm)
          </span>
          <input
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            type="number"
            min={4}
            max={25}
            value={marginMm}
            onChange={(event) => onMarginChange(Number(event.target.value))}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Font size (px)
          </span>
          <input
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            type="number"
            min={8}
            max={16}
            value={fontSizePx}
            onChange={(event) => onFontSizeChange(Number(event.target.value))}
          />
        </label>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
          Paper: {dimensions.widthMm}×{dimensions.heightMm}mm • Content:{" "}
          {content.widthMm}×{content.heightMm}mm • Est. max lines: {fit.maxLines}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <span
            className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
              fit.status === "ok"
                ? "bg-emerald-100 text-emerald-700"
                : fit.status === "tight"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
            }`}
          >
            {fitLabel}
          </span>
          <button
            type="button"
            className="rounded-full border border-zinc-300 bg-zinc-900 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-zinc-50 transition hover:bg-zinc-800"
            onClick={onExportPdf}
          >
            Export PDF
          </button>
        </div>
      </div>
    </section>
  );
}
