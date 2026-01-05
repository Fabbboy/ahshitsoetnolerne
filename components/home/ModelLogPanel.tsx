"use client";

type ModelLogEntry = {
  id: string;
  message: string;
  status: "info" | "success" | "error";
};

type ModelLogPanelProps = {
  logs: ModelLogEntry[];
};

export default function ModelLogPanel({ logs }: ModelLogPanelProps) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-900/80 bg-zinc-950 p-6 text-zinc-50 shadow-lg shadow-zinc-900/30">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-lg font-semibold">Model log</h2>
        <p className="text-sm text-zinc-400">
          Steps and responses from the current generation.
        </p>
      </div>
      <div className="mt-4 grid gap-3 text-xs text-zinc-300">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-3 py-2"
          >
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${
                log.status === "success"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : log.status === "error"
                    ? "bg-rose-500/20 text-rose-300"
                    : "bg-sky-500/15 text-sky-300"
              }`}
            >
              {log.status}
            </span>
            <p className="mt-2 text-zinc-300">{log.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
