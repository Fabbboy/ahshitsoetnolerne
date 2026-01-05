"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DRAFT_KEY, POLICY_KEY, SETTINGS_KEY, defaultPolicy, starterDraft } from "@/lib/constants";
import Header from "@/components/home/Header";
import EditorPanel from "@/components/home/EditorPanel";
import PreviewPanel from "@/components/home/PreviewPanel";
import SettingsPanel from "@/components/home/SettingsPanel";
import MaterialsPanel from "@/components/home/MaterialsPanel";
import GeneratePanel from "@/components/home/GeneratePanel";
import { extractPdfText } from "@/lib/pdf";
import ToolLogPanel from "@/components/home/ToolLogPanel";
import { defineTools, fetchUrlText, fetchWikipediaExtract, runSedCommand } from "@/lib/tools";
import PolicyPanel from "@/components/home/PolicyPanel";
import ModelLogPanel from "@/components/home/ModelLogPanel";
import { getContentDimensions, getPaperDimensions, type PaperOrientation, type PaperSize } from "@/lib/paper";
import AiEditPanel from "@/components/home/AiEditPanel";

type TestStatus = {
  message: string;
  tone: "neutral" | "success" | "error";
};

type ToolLogEntry = {
  id: string;
  name: string;
  status: "pending" | "approved" | "denied" | "completed" | "error";
  message: string;
};

type ModelLogEntry = {
  id: string;
  message: string;
  status: "info" | "success" | "error";
};

export default function HomeClient() {
  const [draft, setDraft] = useState(starterDraft);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isRestored, setIsRestored] = useState(false);
  const [endpointUrl, setEndpointUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("gpt-4o-mini");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [testStatus, setTestStatus] = useState<TestStatus | null>(null);
  const [materialsText, setMaterialsText] = useState("");
  const [materialsFileName, setMaterialsFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [mode, setMode] = useState<"cheat-sheet" | "summary">("cheat-sheet");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [toolLogs, setToolLogs] = useState<ToolLogEntry[]>([]);
  const [modelLogs, setModelLogs] = useState<ModelLogEntry[]>([]);
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [paperSize, setPaperSize] = useState<PaperSize>(defaultPolicy.size);
  const [paperOrientation, setPaperOrientation] = useState<PaperOrientation>(
    defaultPolicy.orientation
  );
  const [marginMm, setMarginMm] = useState(defaultPolicy.marginMm);
  const [fontSizePx, setFontSizePx] = useState(defaultPolicy.fontSizePx);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(DRAFT_KEY);
    if (stored && stored.trim().length > 0) {
      setDraft(stored);
      setIsRestored(true);
    }
    const settings = window.localStorage.getItem(SETTINGS_KEY);
    if (settings) {
      try {
        const parsed = JSON.parse(settings) as {
          endpointUrl?: string;
          apiKey?: string;
          modelName?: string;
        };
        if (parsed.endpointUrl) setEndpointUrl(parsed.endpointUrl);
        if (parsed.apiKey) setApiKey(parsed.apiKey);
        if (parsed.modelName) setModelName(parsed.modelName);
      } catch {
        // Ignore malformed settings.
      }
    }
    const storedPolicy = window.localStorage.getItem(POLICY_KEY);
    if (storedPolicy) {
      try {
        const parsed = JSON.parse(storedPolicy) as {
          size?: PaperSize;
          orientation?: PaperOrientation;
          marginMm?: number;
          fontSizePx?: number;
        };
        if (parsed.size) setPaperSize(parsed.size);
        if (parsed.orientation) setPaperOrientation(parsed.orientation);
        if (typeof parsed.marginMm === "number") setMarginMm(parsed.marginMm);
        if (typeof parsed.fontSizePx === "number") setFontSizePx(parsed.fontSizePx);
      } catch {
        // Ignore malformed settings.
      }
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, draft);
      const now = new Date();
      const stamp = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setLastSaved(stamp);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [draft]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const payload = JSON.stringify({ endpointUrl, apiKey, modelName });
      window.localStorage.setItem(SETTINGS_KEY, payload);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [endpointUrl, apiKey, modelName]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const payload = JSON.stringify({
        size: paperSize,
        orientation: paperOrientation,
        marginMm,
        fontSizePx,
      });
      window.localStorage.setItem(POLICY_KEY, payload);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [paperSize, paperOrientation, marginMm, fontSizePx]);

  const stats = useMemo(() => {
    const characters = draft.length;
    const words = draft.trim().length ? draft.trim().split(/\s+/).length : 0;
    const lines = draft.split("\n").length;
    return { characters, words, lines };
  }, [draft]);

  const handleTestConnection = () => {
    try {
      const parsed = new URL(endpointUrl);
      if (!apiKey.trim()) {
        setTestStatus({
          message: "Add an API key before testing the endpoint.",
          tone: "error",
        });
        return;
      }
      setTestStatus({
        message: `Saved. Ready to test ${parsed.hostname} once AI is wired.`,
        tone: "success",
      });
    } catch {
      setTestStatus({
        message: "Enter a valid endpoint URL (including https://).",
        tone: "error",
      });
    }
  };

  const handleLoadModels = async () => {
    if (!endpointUrl.trim()) {
      setTestStatus({
        message: "Add an endpoint URL before loading models.",
        tone: "error",
      });
      return;
    }
    if (!apiKey.trim()) {
      setTestStatus({
        message: "Add an API key before loading models.",
        tone: "error",
      });
      return;
    }
    try {
      const normalized = endpointUrl.replace(/\/$/, "");
      const response = await fetch(`${normalized}/v1/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      if (!response.ok) {
        setTestStatus({
          message: `Failed to load models (${response.status}).`,
          tone: "error",
        });
        return;
      }
      const data = (await response.json()) as {
        data?: { id: string }[];
      };
      const models = (data.data ?? [])
        .map((item) => item.id)
        .filter((id) => id);
      if (models.length === 0) {
        setAvailableModels([]);
        setTestStatus({
          message: "No models returned from this endpoint.",
          tone: "error",
        });
        return;
      }
      setAvailableModels(models);
      if (!models.includes(modelName)) {
        setModelName(models[0]);
      }
      setTestStatus({
        message: `Loaded ${models.length} models.`,
        tone: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error.";
      setTestStatus({
        message: `Model load failed: ${message}`,
        tone: "error",
      });
    }
  };

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    setMaterialsFileName(file.name);
    setIsParsing(true);
    setGenerationStatus(null);
    try {
      const extracted = await extractPdfText(file);
      setMaterialsText(extracted);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "PDF parsing failed.";
      setGenerationStatus(`PDF parse error: ${message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleClearMaterials = () => {
    setMaterialsText("");
    setMaterialsFileName(null);
    setGenerationStatus(null);
  };

  const handleGenerate = async () => {
    if (!endpointUrl.trim()) {
      setGenerationStatus("Add an endpoint URL first.");
      return;
    }
    if (!apiKey.trim()) {
      setGenerationStatus("Add an API key first.");
      return;
    }
    if (!materialsText.trim()) {
      setGenerationStatus("Upload a PDF or paste materials first.");
      return;
    }
    setIsGenerating(true);
    setGenerationStatus(null);
    setToolLogs([]);
    setModelLogs([
      {
        id: `start-${Date.now()}`,
        status: "info",
        message: "Generation started.",
      },
    ]);
    try {
      const normalized = endpointUrl.replace(/\/$/, "");
      const systemPrompt =
        mode === "cheat-sheet"
          ? "You create dense, well-structured markdown cheat sheets for exams."
          : "You summarize study materials into the most important points.";
      const messages: Array<
        | { role: "system"; content: string }
        | { role: "user"; content: string }
        | { role: "assistant"; content?: string; tool_calls?: any[] }
        | { role: "tool"; tool_call_id: string; content: string }
      > = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Materials:\n${materialsText}\n\nInstructions:\n${
            prompt || "No extra instructions."
          }`,
        },
      ];

      const tools = defineTools();
      const maxIterations = 4;

      for (let i = 0; i < maxIterations; i += 1) {
        setModelLogs((prev) => [
          ...prev,
          {
            id: `request-${i}`,
            status: "info",
            message: `Sending request (iteration ${i + 1}).`,
          },
        ]);
        const response = await fetch(`${normalized}/v1/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            temperature: 0.2,
            messages,
            tools,
            tool_choice: "auto",
          }),
        });
        if (!response.ok) {
          setGenerationStatus(`Generation failed (${response.status}).`);
          setModelLogs((prev) => [
            ...prev,
            {
              id: `error-${i}`,
              status: "error",
              message: `Model responded with ${response.status}.`,
            },
          ]);
          return;
        }
        const data = (await response.json()) as {
          choices?: {
            message?: {
              content?: string;
              tool_calls?: Array<{
                id: string;
                function: { name: string; arguments: string };
              }>;
              function_call?: { name: string; arguments: string };
            };
          }[];
        };
        const message = data.choices?.[0]?.message;
        if (!message) {
          setGenerationStatus("No response message returned by the model.");
          setModelLogs((prev) => [
            ...prev,
            {
              id: `missing-${i}`,
              status: "error",
              message: "No message returned by the model.",
            },
          ]);
          return;
        }

        if (message.tool_calls && message.tool_calls.length > 0) {
          const names = message.tool_calls.map((call) => call.function.name).join(", ");
          setModelLogs((prev) => [
            ...prev,
            {
              id: `tool-${i}`,
              status: "info",
              message: `Model requested tools: ${names}.`,
            },
          ]);
          messages.push({ role: "assistant", tool_calls: message.tool_calls });
          for (const toolCall of message.tool_calls) {
            const toolName = toolCall.function.name;
            const logId = `${toolCall.id}-${toolName}`;
            let parsedArgs: any = {};
            try {
              parsedArgs = JSON.parse(toolCall.function.arguments || "{}");
            } catch {
              parsedArgs = {};
            }

            const pushLog = (update: ToolLogEntry) => {
              setToolLogs((prev) => {
                const existing = prev.find((entry) => entry.id === update.id);
                if (existing) {
                  return prev.map((entry) =>
                    entry.id === update.id ? update : entry
                  );
                }
                return [...prev, update];
              });
            };

            const baseLog: ToolLogEntry = {
              id: logId,
              name: toolName,
              status: "pending",
              message: `Preparing ${toolName}…`,
            };
            pushLog(baseLog);

            let toolResult = "Tool executed.";
            try {
              if (toolName === "Fetch") {
                const url = String(parsedArgs.url || "");
                const approved = window.confirm(
                  `Allow Fetch tool to load:\n${url}`
                );
                if (!approved) {
                  pushLog({
                    ...baseLog,
                    status: "denied",
                    message: `User denied Fetch for ${url}.`,
                  });
                  toolResult = "User denied Fetch request.";
                } else {
                  pushLog({
                    ...baseLog,
                    status: "approved",
                    message: `Fetching ${url}`,
                  });
                  toolResult = await fetchUrlText(url);
                  pushLog({
                    ...baseLog,
                    status: "completed",
                    message: `Fetched ${url} (${toolResult.length} chars).`,
                  });
                }
              } else if (toolName === "Wiki") {
                const article = String(parsedArgs.article || "");
                const summary = Boolean(parsedArgs.summary);
                toolResult = await fetchWikipediaExtract(article, summary);
                pushLog({
                  ...baseLog,
                  status: "completed",
                  message: `Wikipedia ${summary ? "summary" : "extract"}: ${article}`,
                });
              } else if (toolName === "Sed") {
                const { result, updatedDraft } = runSedCommand(
                  draft,
                  parsedArgs
                );
                toolResult = result;
                if (updatedDraft !== undefined) {
                  setDraft(updatedDraft);
                }
                pushLog({
                  ...baseLog,
                  status: "completed",
                  message: `Sed ${parsedArgs.action || "run"} ${parsedArgs.range || ""}`,
                });
              } else if (toolName === "Question") {
                const question = String(parsedArgs.question || "Provide input:");
                const answer = window.prompt(question) ?? "";
                toolResult = answer.trim() ? answer : "User cancelled input.";
                pushLog({
                  ...baseLog,
                  status: "completed",
                  message: "User answered Question.",
                });
              } else if (toolName === "Think") {
                toolResult = "Thought acknowledged.";
                pushLog({
                  ...baseLog,
                  status: "completed",
                  message: "Think step logged (internal).",
                });
              } else {
                toolResult = `Unknown tool: ${toolName}`;
                pushLog({
                  ...baseLog,
                  status: "error",
                  message: `Unknown tool ${toolName}`,
                });
              }
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Tool error.";
              toolResult = `Tool error: ${message}`;
              pushLog({
                ...baseLog,
                status: "error",
                message,
              });
            }

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult,
            });
          }
          continue;
        }

        const content = message.content?.trim();
        if (!content) {
          setGenerationStatus("No content returned by the model.");
          setModelLogs((prev) => [
            ...prev,
            {
              id: `empty-${i}`,
              status: "error",
              message: "Model returned empty content.",
            },
          ]);
          return;
        }
        setDraft(content);
        setGenerationStatus("Generated draft inserted into the editor.");
        setModelLogs((prev) => [
          ...prev,
          {
            id: `done-${i}`,
            status: "success",
            message: `Generation complete (${content.length} chars).`,
          },
        ]);
        return;
      }

      setGenerationStatus("Tool loop exceeded the maximum iterations.");
      setModelLogs((prev) => [
        ...prev,
        {
          id: "limit",
          status: "error",
          message: "Tool loop exceeded the maximum iterations.",
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error.";
      setGenerationStatus(`Generation error: ${message}`);
      setModelLogs((prev) => [
        ...prev,
        {
          id: "exception",
          status: "error",
          message: `Generation error: ${message}`,
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiEdit = async () => {
    if (!endpointUrl.trim()) {
      setEditStatus("Add an endpoint URL first.");
      return;
    }
    if (!apiKey.trim()) {
      setEditStatus("Add an API key first.");
      return;
    }
    if (!editPrompt.trim()) {
      setEditStatus("Describe the edit you want applied.");
      return;
    }
    setIsEditing(true);
    setEditStatus(null);
    setToolLogs([]);
    setModelLogs([
      {
        id: `edit-start-${Date.now()}`,
        status: "info",
        message: "Edit session started.",
      },
    ]);

    try {
      const normalized = endpointUrl.replace(/\/$/, "");
      const systemPrompt = [
        "You are editing an existing markdown cheat sheet.",
        "Use the Sed tool to make precise line-based changes.",
        "Do not output the full document unless explicitly asked.",
      ].join(" ");

      const tools = defineTools();
      const messages: Array<
        | { role: "system"; content: string }
        | { role: "user"; content: string }
        | { role: "assistant"; content?: string; tool_calls?: any[] }
        | { role: "tool"; tool_call_id: string; content: string }
      > = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Current draft:\n${draft}\n\nEdit request:\n${editPrompt}`,
        },
      ];

      const maxIterations = 4;
      for (let i = 0; i < maxIterations; i += 1) {
        setModelLogs((prev) => [
          ...prev,
          {
            id: `edit-request-${i}`,
            status: "info",
            message: `Sending edit request (iteration ${i + 1}).`,
          },
        ]);
        const response = await fetch(`${normalized}/v1/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            temperature: 0.2,
            messages,
            tools,
            tool_choice: "auto",
          }),
        });
        if (!response.ok) {
          setEditStatus(`Edit failed (${response.status}).`);
          setModelLogs((prev) => [
            ...prev,
            {
              id: `edit-error-${i}`,
              status: "error",
              message: `Model responded with ${response.status}.`,
            },
          ]);
          return;
        }
        const data = (await response.json()) as {
          choices?: {
            message?: {
              content?: string;
              tool_calls?: Array<{
                id: string;
                function: { name: string; arguments: string };
              }>;
            };
          }[];
        };
        const message = data.choices?.[0]?.message;
        if (!message) {
          setEditStatus("No response message returned by the model.");
          setModelLogs((prev) => [
            ...prev,
            {
              id: `edit-missing-${i}`,
              status: "error",
              message: "No message returned by the model.",
            },
          ]);
          return;
        }

        if (message.tool_calls && message.tool_calls.length > 0) {
          const names = message.tool_calls.map((call) => call.function.name).join(", ");
          setModelLogs((prev) => [
            ...prev,
            {
              id: `edit-tools-${i}`,
              status: "info",
              message: `Model requested tools: ${names}.`,
            },
          ]);
          messages.push({ role: "assistant", tool_calls: message.tool_calls });
          for (const toolCall of message.tool_calls) {
            const toolName = toolCall.function.name;
            const logId = `${toolCall.id}-${toolName}`;
            let parsedArgs: any = {};
            try {
              parsedArgs = JSON.parse(toolCall.function.arguments || "{}");
            } catch {
              parsedArgs = {};
            }

            const pushLog = (update: ToolLogEntry) => {
              setToolLogs((prev) => {
                const existing = prev.find((entry) => entry.id === update.id);
                if (existing) {
                  return prev.map((entry) =>
                    entry.id === update.id ? update : entry
                  );
                }
                return [...prev, update];
              });
            };

            const baseLog: ToolLogEntry = {
              id: logId,
              name: toolName,
              status: "pending",
              message: `Preparing ${toolName}…`,
            };
            pushLog(baseLog);

            let toolResult = "Tool executed.";
            try {
              if (toolName === "Fetch") {
                const url = String(parsedArgs.url || "");
                const approved = window.confirm(
                  `Allow Fetch tool to load:\n${url}`
                );
                if (!approved) {
                  pushLog({
                    ...baseLog,
                    status: "denied",
                    message: `User denied Fetch for ${url}.`,
                  });
                  toolResult = "User denied Fetch request.";
                } else {
                  pushLog({
                    ...baseLog,
                    status: "approved",
                    message: `Fetching ${url}`,
                  });
                  toolResult = await fetchUrlText(url);
                  pushLog({
                    ...baseLog,
                    status: "completed",
                    message: `Fetched ${url} (${toolResult.length} chars).`,
                  });
                }
              } else if (toolName === "Wiki") {
                const article = String(parsedArgs.article || "");
                const summary = Boolean(parsedArgs.summary);
                toolResult = await fetchWikipediaExtract(article, summary);
                pushLog({
                  ...baseLog,
                  status: "completed",
                  message: `Wikipedia ${summary ? "summary" : "extract"}: ${article}`,
                });
              } else if (toolName === "Sed") {
                const { result, updatedDraft } = runSedCommand(
                  draft,
                  parsedArgs
                );
                toolResult = result;
                if (updatedDraft !== undefined) {
                  setDraft(updatedDraft);
                }
                pushLog({
                  ...baseLog,
                  status: "completed",
                  message: `Sed ${parsedArgs.action || "run"} ${parsedArgs.range || ""}`,
                });
              } else if (toolName === "Question") {
                const question = String(parsedArgs.question || "Provide input:");
                const answer = window.prompt(question) ?? "";
                toolResult = answer.trim() ? answer : "User cancelled input.";
                pushLog({
                  ...baseLog,
                  status: "completed",
                  message: "User answered Question.",
                });
              } else if (toolName === "Think") {
                toolResult = "Thought acknowledged.";
                pushLog({
                  ...baseLog,
                  status: "completed",
                  message: "Think step logged (internal).",
                });
              } else {
                toolResult = `Unknown tool: ${toolName}`;
                pushLog({
                  ...baseLog,
                  status: "error",
                  message: `Unknown tool ${toolName}`,
                });
              }
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Tool error.";
              toolResult = `Tool error: ${message}`;
              pushLog({
                ...baseLog,
                status: "error",
                message,
              });
            }

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult,
            });
          }
          continue;
        }

        const content = message.content?.trim();
        if (content) {
          setEditStatus(
            "Model returned a full response. Ask for a more specific edit."
          );
          setModelLogs((prev) => [
            ...prev,
            {
              id: `edit-content-${i}`,
              status: "error",
              message: "Model returned content instead of tool edits.",
            },
          ]);
          return;
        }

        setEditStatus("Edit applied.");
        setModelLogs((prev) => [
          ...prev,
          {
            id: `edit-done-${i}`,
            status: "success",
            message: "Edit completed.",
          },
        ]);
        return;
      }

      setEditStatus("Edit loop exceeded the maximum iterations.");
      setModelLogs((prev) => [
        ...prev,
        {
          id: "edit-limit",
          status: "error",
          message: "Edit loop exceeded the maximum iterations.",
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error.";
      setEditStatus(`Edit error: ${message}`);
      setModelLogs((prev) => [
        ...prev,
        {
          id: "edit-exception",
          status: "error",
          message: `Edit error: ${message}`,
        },
      ]);
    } finally {
      setIsEditing(false);
    }
  };

  const handleExportPdf = () => {
    const previewHtml = previewRef.current?.innerHTML;
    if (!previewHtml) {
      setGenerationStatus("Nothing to export yet.");
      return;
    }
    const { widthMm, heightMm } = getPaperDimensions({
      size: paperSize,
      orientation: paperOrientation,
      marginMm,
      fontSizePx,
    });
    const html = `
      <html>
        <head>
          <title>Cheat Sheet Export</title>
          <style>
            @page { size: ${paperSize} ${paperOrientation}; margin: ${marginMm}mm; }
            body { margin: 0; font-family: "Geist", Arial, sans-serif; }
            .page { width: ${widthMm}mm; height: ${heightMm}mm; padding: ${marginMm}mm; box-sizing: border-box; }
            h1, h2, h3 { margin: 12px 0 6px; font-weight: 600; }
            h1 { font-size: 1.5rem; }
            h2 { font-size: 1.2rem; }
            h3 { font-size: 1rem; }
            p { margin: 6px 0; }
            ul, ol { margin: 6px 0 6px 20px; }
            code { background: #f2f2f2; padding: 2px 4px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="page" style="font-size:${fontSizePx}px; line-height:1.35;">
            ${previewHtml}
          </div>
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (!win) {
      setGenerationStatus("Popup blocked. Allow popups to export PDF.");
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  const { widthMm, heightMm } = getPaperDimensions({
    size: paperSize,
    orientation: paperOrientation,
    marginMm,
    fontSizePx,
  });
  const contentDimensions = getContentDimensions({
    size: paperSize,
    orientation: paperOrientation,
    marginMm,
    fontSizePx,
  });
  const paperStyle: React.CSSProperties = {
    width: `min(100%, ${widthMm}mm)`,
    height: `${heightMm}mm`,
    padding: `${marginMm}mm`,
    boxSizing: "border-box",
    overflow: "auto",
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f4f1ea_0%,_#f7f6f1_32%,_#efe8dd_100%)] text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <Header />

        <main className="grid flex-1 gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                  activeTab === "editor"
                    ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                    : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
                onClick={() => setActiveTab("editor")}
              >
                Editor
              </button>
              <button
                type="button"
                className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] transition ${
                  activeTab === "preview"
                    ? "border-zinc-900 bg-zinc-900 text-zinc-50"
                    : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
                onClick={() => setActiveTab("preview")}
              >
                Preview
              </button>
            </div>
            {activeTab === "editor" ? (
              <>
                <EditorPanel
                  draft={draft}
                  stats={stats}
                  lastSaved={lastSaved}
                  isRestored={isRestored}
                  paperStyle={paperStyle}
                  fontSizePx={fontSizePx}
                  onDraftChange={setDraft}
                />
                <AiEditPanel
                  prompt={editPrompt}
                  isEditing={isEditing}
                  statusMessage={editStatus}
                  onPromptChange={setEditPrompt}
                  onApply={handleAiEdit}
                />
              </>
            ) : (
              <PreviewPanel
                draft={draft}
                paperStyle={paperStyle}
                fontSizePx={fontSizePx}
                contentRef={previewRef}
                className="min-h-[60vh]"
              />
            )}
          </div>

          <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-4rem)] lg:overflow-auto lg:pr-2">
            <SettingsPanel
              endpointUrl={endpointUrl}
              apiKey={apiKey}
              modelName={modelName}
              availableModels={availableModels}
              testStatus={testStatus}
              onEndpointChange={setEndpointUrl}
              onApiKeyChange={setApiKey}
              onModelChange={setModelName}
              onLoadModels={handleLoadModels}
              onTestConnection={handleTestConnection}
            />
            <MaterialsPanel
              fileName={materialsFileName}
              isParsing={isParsing}
              materialsText={materialsText}
              onFileSelect={handleFileSelect}
              onMaterialsChange={setMaterialsText}
              onClear={handleClearMaterials}
            />
            <PolicyPanel
              size={paperSize}
              orientation={paperOrientation}
              marginMm={marginMm}
              fontSizePx={fontSizePx}
              lineCount={stats.lines}
              onSizeChange={setPaperSize}
              onOrientationChange={setPaperOrientation}
              onMarginChange={setMarginMm}
              onFontSizeChange={setFontSizePx}
              onExportPdf={handleExportPdf}
            />
            <GeneratePanel
              mode={mode}
              prompt={prompt}
              isGenerating={isGenerating}
              statusMessage={generationStatus}
              onModeChange={setMode}
              onPromptChange={setPrompt}
              onGenerate={handleGenerate}
            />
            <ModelLogPanel logs={modelLogs} />
            <ToolLogPanel logs={toolLogs} />
          </div>
        </main>
      </div>
    </div>
  );
}
