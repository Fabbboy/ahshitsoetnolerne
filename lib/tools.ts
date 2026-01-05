export type ToolResult = {
  result: string;
  updatedDraft?: string;
};

export type SedArgs = {
  action: "view" | "replace";
  range: string;
  content?: string;
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
  const rangeMatch = args.range.match(/^(\d+)(?:-(\d+))?$/);
  if (!rangeMatch) {
    return { result: "Invalid range format. Use '1-5' or '3'." };
  }
  const start = Number(rangeMatch[1]);
  const end = Number(rangeMatch[2] ?? rangeMatch[1]);
  if (start < 1 || end < start || end > lines.length) {
    return { result: "Range out of bounds for current draft." };
  }
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

function stripHtml(html: string): string {
  const noScripts = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  const noStyles = noScripts.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  const noTags = noStyles.replace(/<[^>]+>/g, " ");
  return noTags.replace(/\s+/g, " ").trim();
}
