"use client";

type ToolLogEntry = {
  id: string;
  name: string;
  status: "pending" | "approved" | "denied" | "completed" | "error";
  message: string;
};

type ToolLogPanelProps = {
  logs: ToolLogEntry[];
};

export default function ToolLogPanel({ logs }: ToolLogPanelProps) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-900/80 bg-zinc-950 p-6 text-zinc-50 shadow-lg shadow-zinc-900/30">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-lg font-semibold">Tool activity</h2>
        <p className="text-sm text-zinc-400">
          Approvals and results from AI tool calls.
        </p>
      </div>
      <div className="mt-4 grid gap-3 text-xs text-zinc-300">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                {log.name}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${
                  log.status === "approved"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : log.status === "denied"
                      ? "bg-rose-500/15 text-rose-300"
                      : log.status === "error"
                        ? "bg-amber-500/20 text-amber-200"
                        : log.status === "completed"
                          ? "bg-sky-500/15 text-sky-300"
                          : "bg-zinc-700/40 text-zinc-300"
                }`}
              >
                {log.status}
              </span>
            </div>
            <p className="mt-2 text-zinc-300">{log.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
