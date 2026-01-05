"use client";

type AiEditPanelProps = {
  prompt: string;
  isEditing: boolean;
  statusMessage: string | null;
  onPromptChange: (value: string) => void;
  onApply: () => void;
};

export default function AiEditPanel({
  prompt,
  isEditing,
  statusMessage,
  onPromptChange,
  onApply,
}: AiEditPanelProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg shadow-zinc-200/50">
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="text-lg font-semibold">AI edit</h2>
        <p className="text-sm text-zinc-500">
          Ask for a specific change. The model will apply edits to the current
          sheet instead of replacing it.
        </p>
      </div>
      <div className="mt-4 grid gap-4 text-sm text-zinc-700">
        <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
          Edit request
          <textarea
            className="min-h-[100px] rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            placeholder="e.g. Replace the formulas section with a more compact list."
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-zinc-300 bg-zinc-900 px-4 py-2 text-xs uppercase tracking-[0.2em] text-zinc-50 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onApply}
            disabled={isEditing}
          >
            {isEditing ? "Applying…" : "Apply edit"}
          </button>
          {statusMessage ? (
            <span className="text-xs text-zinc-500">{statusMessage}</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
