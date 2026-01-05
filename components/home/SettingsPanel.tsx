"use client";

type TestStatus = {
  message: string;
  tone: "neutral" | "success" | "error";
};

type SettingsPanelProps = {
  endpointUrl: string;
  apiKey: string;
  modelName: string;
  availableModels: string[];
  testStatus: TestStatus | null;
  onEndpointChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onLoadModels: () => void;
  onTestConnection: () => void;
};

export default function SettingsPanel({
  endpointUrl,
  apiKey,
  modelName,
  availableModels,
  testStatus,
  onEndpointChange,
  onApiKeyChange,
  onModelChange,
  onLoadModels,
  onTestConnection,
}: SettingsPanelProps) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-lg shadow-zinc-200/50">
      <div className="border-b border-zinc-200 pb-4">
        <h2 className="text-lg font-semibold">AI endpoint</h2>
        <p className="text-sm text-zinc-500">
          Connect your OpenAI-compatible endpoint. Stored locally on this
          device.
        </p>
      </div>
      <div className="mt-4 grid gap-4 text-sm text-zinc-700">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Endpoint URL
          </span>
          <input
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            placeholder="https://api.your-school.ai/v1"
            value={endpointUrl}
            onChange={(event) => onEndpointChange(event.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            API key
          </span>
          <input
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            placeholder="sk-••••••••"
            value={apiKey}
            onChange={(event) => onApiKeyChange(event.target.value)}
            type="password"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Model
          </span>
          <select
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
            value={modelName}
            onChange={(event) => onModelChange(event.target.value)}
          >
            {availableModels.length === 0 ? (
              <option value={modelName}>{modelName}</option>
            ) : (
              availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))
            )}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-zinc-700 transition hover:bg-zinc-100"
            onClick={onLoadModels}
          >
            Load models
          </button>
          <button
            type="button"
            className="rounded-full border border-zinc-300 bg-zinc-900 px-4 py-2 text-xs uppercase tracking-[0.2em] text-zinc-50 transition hover:bg-zinc-800"
            onClick={onTestConnection}
          >
            Test connection
          </button>
          <span className="text-xs text-zinc-500">
            {endpointUrl ? "Settings auto-saved." : "Awaiting input."}
          </span>
        </div>
        {testStatus ? (
          <div
            className={`rounded-2xl border px-3 py-2 text-xs ${
              testStatus.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : testStatus.tone === "error"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-zinc-200 bg-zinc-50 text-zinc-600"
            }`}
          >
            {testStatus.message}
          </div>
        ) : null}
      </div>
    </section>
  );
}
