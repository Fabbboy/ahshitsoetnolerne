"use client";

type MaterialsPanelProps = {
  fileName: string | null;
  isParsing: boolean;
  materialsText: string;
  onFileSelect: (file: File | null) => void;
  onMaterialsChange: (value: string) => void;
  onClear: () => void;
};

export default function MaterialsPanel({
  fileName,
  isParsing,
  materialsText,
  onFileSelect,
  onMaterialsChange,
  onClear,
}: MaterialsPanelProps) {
  const words = materialsText.trim()
    ? materialsText.trim().split(/\s+/).length
    : 0;

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg shadow-zinc-200/50">
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="text-lg font-semibold">Study materials</h2>
        <p className="text-sm text-zinc-500">
          Upload a PDF and we will extract the text for the AI.
        </p>
      </div>
      <div className="mt-4 grid gap-4 text-sm text-zinc-700">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            PDF upload
          </span>
          <input
            className="rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm"
            type="file"
            accept="application/pdf"
            onChange={(event) =>
              onFileSelect(event.target.files?.[0] ?? null)
            }
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
          <span>
            {fileName ? `Loaded ${fileName}` : "No PDF loaded yet."}
          </span>
          <span>{isParsing ? "Parsing…" : `${words} words extracted`}</span>
        </div>
        <textarea
          className="min-h-[160px] w-full rounded-2xl border border-zinc-200 bg-white/80 p-3 text-xs leading-5 outline-none transition focus:border-zinc-400"
          placeholder="Extracted text will appear here. You can edit it."
          value={materialsText}
          onChange={(event) => onMaterialsChange(event.target.value)}
        />
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Only PDF for now. You can edit the extracted text.</span>
          <button
            type="button"
            className="rounded-full border border-zinc-200 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600 transition hover:bg-zinc-100"
            onClick={onClear}
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}
