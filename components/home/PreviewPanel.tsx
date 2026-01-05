"use client";

import ReactMarkdown from "react-markdown";

type PreviewPanelProps = {
  draft: string;
  paperStyle: React.CSSProperties;
  fontSizePx: number;
  contentRef: React.RefObject<HTMLDivElement | null>;
};

export default function PreviewPanel({
  draft,
  paperStyle,
  fontSizePx,
  contentRef,
}: PreviewPanelProps) {
  return (
    <section className="flex min-h-[38vh] flex-col rounded-3xl border border-zinc-900 bg-zinc-900 p-6 text-zinc-50 shadow-lg shadow-zinc-900/30">
      <div className="border-b border-zinc-700 pb-4">
        <h2 className="text-lg font-semibold">Live preview</h2>
        <p className="text-sm text-zinc-400">
          Rendered markdown preview for your printable sheet.
        </p>
      </div>
      <div className="mt-4 flex justify-center">
        <div
          className="rounded-2xl bg-white text-zinc-900 shadow-xl shadow-black/30"
          style={paperStyle}
        >
          <div
            ref={contentRef}
            className="prose max-w-none"
            style={{ fontSize: `${fontSizePx}px`, lineHeight: 1.35 }}
          >
            <ReactMarkdown>{draft}</ReactMarkdown>
          </div>
        </div>
      </div>
    </section>
  );
}
