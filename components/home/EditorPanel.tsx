"use client";

type Stats = {
  characters: number;
  words: number;
  lines: number;
};

type EditorPanelProps = {
  draft: string;
  stats: Stats;
  lastSaved: string | null;
  isRestored: boolean;
  paperStyle: React.CSSProperties;
  fontSizePx: number;
  onDraftChange: (value: string) => void;
};

export default function EditorPanel({
  draft,
  stats,
  lastSaved,
  isRestored,
  paperStyle,
  fontSizePx,
  onDraftChange,
}: EditorPanelProps) {
  return (
    <section className="flex min-h-[60vh] flex-col rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg shadow-zinc-200/50 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold">Cheat sheet editor</h2>
          <p className="text-sm text-zinc-500">
            Start typing or paste your notes. Everything stays on-device.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
            {stats.words} words
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
            {stats.lines} lines
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
            {stats.characters} chars
          </span>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <div
          className="rounded-2xl border border-dashed border-zinc-200 bg-white"
          style={paperStyle}
        >
          <textarea
            className="h-full w-full resize-none rounded-2xl border border-transparent bg-transparent p-4 text-sm leading-6 outline-none"
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            spellCheck
            style={{ fontSize: `${fontSizePx}px`, lineHeight: 1.35 }}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
        <span>{isRestored ? "Restored last draft." : "Starter template loaded."}</span>
        <span>{lastSaved ? `Saved ${lastSaved}` : "Saving..."}</span>
      </div>
    </section>
  );
}
