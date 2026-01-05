"use client";

type GeneratePanelProps = {
  mode: "cheat-sheet" | "summary";
  prompt: string;
  isGenerating: boolean;
  statusMessage: string | null;
  onModeChange: (value: "cheat-sheet" | "summary") => void;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
};

export default function GeneratePanel({
  mode,
  prompt,
  isGenerating,
  statusMessage,
  onModeChange,
  onPromptChange,
  onGenerate,
}: GeneratePanelProps) {
  return (
    <section className="rounded-3xl border border-zinc-900 bg-zinc-900 p-6 text-zinc-50 shadow-lg shadow-zinc-900/30">
      <div className="border-b border-zinc-700 pb-4">
        <h2 className="text-lg font-semibold">AI generate</h2>
        <p className="text-sm text-zinc-400">
          Generate a cheat sheet or summary from your materials.
        </p>
      </div>
      <div className="mt-4 grid gap-4 text-sm text-zinc-200">
        <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
          Mode
          <select
            className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            value={mode}
            onChange={(event) =>
              onModeChange(event.target.value as "cheat-sheet" | "summary")
            }
          >
            <option value="cheat-sheet">Cheat sheet</option>
            <option value="summary">Summary</option>
          </select>
        </label>
        <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
          Extra instructions
          <textarea
            className="min-h-[120px] rounded-2xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-500"
            placeholder="e.g. Focus on formulas and definitions. Keep it dense."
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-zinc-700 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating…" : "Generate"}
          </button>
          {statusMessage ? (
            <span className="text-xs text-zinc-300">{statusMessage}</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
