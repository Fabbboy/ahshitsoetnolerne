export type ToolResult = {
  result: string;
  updatedDraft?: string;
};

export type SedArgs = {
  action: "view" | "replace";
  range: string;
  content?: string;
};

export type ReadArgs = {
  range: string;
};

export type PatchArgs = {
  find: string;
  replace: string;
  count?: number | "all";
};

export function defineTools() {
  return [
    {
      type: "function",
      function: {
        name: "Wiki",
        description:
          "Query a Wikipedia article and return either a summary or full extract.",
        parameters: {
          type: "object",
          properties: {
            article: { type: "string" },
            summary: { type: "boolean" },
          },
          required: ["article", "summary"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "Fetch",
        description:
          "Fetch a URL and return the text content with HTML stripped.",
        parameters: {
          type: "object",
          properties: {
            url: { type: "string" },
          },
          required: ["url"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "Sed",
        description:
          "View or replace specific line ranges in the cheat sheet draft.",
        parameters: {
          type: "object",
          properties: {
            action: { type: "string", enum: ["view", "replace"] },
            range: {
              type: "string",
              description: "Line range like '1-5' or single line '3'.",
            },
            content: {
              type: "string",
              description: "Replacement text when action is replace.",
            },
          },
          required: ["action", "range"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "Read",
        description:
          "Read numbered lines from the current cheat sheet for context.",
        parameters: {
          type: "object",
          properties: {
            range: {
              type: "string",
              description: "Line range like '1-20', '5-12', or 'all'.",
            },
          },
          required: ["range"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "Patch",
        description:
          "Apply a targeted string replacement without rewriting the full document.",
        parameters: {
          type: "object",
          properties: {
            find: { type: "string" },
            replace: { type: "string" },
            count: {
              oneOf: [{ type: "number" }, { type: "string", enum: ["all"] }],
              description: "How many occurrences to replace (default 1).",
            },
          },
          required: ["find", "replace"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "Question",
        description: "Ask the user a question through a dialog window.",
        parameters: {
          type: "object",
          properties: {
            question: { type: "string" },
          },
          required: ["question"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "Think",
        description: "Internal self-prompting step. Not shown to user.",
        parameters: {
          type: "object",
          properties: {
            thoughts: { type: "string" },
          },
          required: ["thoughts"],
        },
      },
    },
  ];
}

export async function fetchWikipediaExtract(
  article: string,
  summary: boolean
): Promise<string> {
  const params = new URLSearchParams({
    action: "query",
    prop: "extracts",
    explaintext: "1",
    format: "json",
    titles: article,
    origin: "*",
  });
  if (summary) {
    params.set("exintro", "1");
  }
  const response = await fetch(
    `https://en.wikipedia.org/w/api.php?${params.toString()}`
  );
  if (!response.ok) {
    throw new Error(`Wikipedia request failed (${response.status})`);
  }
  const data = (await response.json()) as {
    query?: { pages?: Record<string, { extract?: string }> };
  };
  const pages = data.query?.pages ?? {};
  const firstPage = Object.values(pages)[0];
  return firstPage?.extract?.trim() || "No extract returned from Wikipedia.";
}

export async function fetchUrlText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status})`);
  }
  const html = await response.text();
  return stripHtml(html);
}

export function runSedCommand(draft: string, args: SedArgs): ToolResult {
  const lines = draft.split("\n");
  if (!args.range) {
    return { result: "Range is required for Sed." };
  }
  const parsed = parseRange(args.range, lines.length);
  if (!parsed) {
    return { result: "Invalid range format. Use '1-5' or '3'." };
  }
  const { start, end } = parsed;
  if (args.action === "view") {
    const view = lines.slice(start - 1, end).join("\n");
    return { result: view || "(empty selection)" };
  }
  const replacement = args.content ?? "";
  const newLines = [
    ...lines.slice(0, start - 1),
    ...replacement.split("\n"),
    ...lines.slice(end),
  ];
  return {
    result: `Replaced lines ${start}-${end}.`,
    updatedDraft: newLines.join("\n"),
  };
}

export function runReadCommand(draft: string, args: ReadArgs): ToolResult {
  const lines = draft.split("\n");
  if (!args.range) {
    return { result: "Range is required for Read." };
  }
  if (args.range === "all") {
    return { result: formatNumberedLines(lines, 1) };
  }
  const parsed = parseRange(args.range, lines.length);
  if (!parsed) {
    return { result: "Invalid range format. Use '1-20', '5-12', or 'all'." };
  }
  const { start, end } = parsed;
  const slice = lines.slice(start - 1, end);
  return { result: formatNumberedLines(slice, start) };
}

export function runPatchCommand(draft: string, args: PatchArgs): ToolResult {
  if (!args.find) {
    return { result: "Patch find string is empty." };
  }
  if (!draft.includes(args.find)) {
    return { result: "Patch target not found in the draft." };
  }
  const count = args.count ?? 1;
  let updated = draft;
  if (count === "all") {
    updated = draft.split(args.find).join(args.replace);
  } else {
    let remaining = typeof count === "number" ? Math.max(1, count) : 1;
    while (remaining > 0 && updated.includes(args.find)) {
      updated = updated.replace(args.find, args.replace);
      remaining -= 1;
    }
  }
  return {
    result: "Patch applied.",
    updatedDraft: updated,
  };
}

function stripHtml(html: string): string {
  const noScripts = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  const noStyles = noScripts.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  const noTags = noStyles.replace(/<[^>]+>/g, " ");
  return noTags.replace(/\s+/g, " ").trim();
}

function parseRange(range: string, max: number) {
  const match = range.match(/^(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);
  if (start < 1 || end < start || end > max) return null;
  return { start, end };
}

function formatNumberedLines(lines: string[], startIndex: number) {
  return lines
    .map((line, idx) => `${startIndex + idx} | ${line}`)
    .join("\n");
}
