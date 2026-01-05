"use client";

export default function Header() {
  return (
    <header className="flex flex-col gap-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Local study sheet generator
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            ahshitsoetnolerne
          </h1>
        </div>
        <div className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm">
          MVP 3 • AI Generate
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
        <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
          Drafts saved locally
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
          Markdown supported
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
          PDF upload
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1 shadow-sm">
          AI generate
        </span>
      </div>
    </header>
  );
}
