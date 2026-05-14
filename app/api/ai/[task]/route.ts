import type { NextRequest } from "next/server";
import {
  heuristicExtractActions,
  heuristicInsights,
  heuristicNudge,
  heuristicSuggestFromItems,
  heuristicSummarizeRetro,
} from "@/lib/ai/heuristics";

type Task =
  | "extract-actions"
  | "suggest-from-items"
  | "summarize"
  | "nudge"
  | "insights";

const KNOWN_TASKS = new Set<Task>([
  "extract-actions",
  "suggest-from-items",
  "summarize",
  "nudge",
  "insights",
]);

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/ai/[task]">,
) {
  const { task } = await ctx.params;
  if (!KNOWN_TASKS.has(task as Task)) {
    return Response.json({ error: "Unknown task" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Try a real LLM first if configured. Otherwise fall back to heuristics.
  // Both produce the same shape so the client doesn't care.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const modelResult = await runWithAnthropic(task as Task, body, apiKey);
      if (modelResult !== null) {
        return Response.json({ source: "model", data: modelResult });
      }
    } catch {
      // Fall through to heuristic.
    }
  }

  const data = runHeuristic(task as Task, body);
  return Response.json({ source: "heuristic", data });
}

function runHeuristic(task: Task, body: Record<string, unknown>): unknown {
  switch (task) {
    case "extract-actions":
      return heuristicExtractActions(
        (body.text as string) ?? "",
        (body.members as never) ?? [],
      );
    case "suggest-from-items":
      return heuristicSuggestFromItems({
        items: (body.items as never) ?? [],
        members: (body.members as never) ?? [],
      });
    case "summarize":
      return heuristicSummarizeRetro({
        retro: body.retro as never,
        items: (body.items as never) ?? [],
        actions: (body.actions as never) ?? [],
        members: (body.members as never) ?? [],
      });
    case "nudge":
      return heuristicNudge({
        action: body.action as never,
        owner: body.owner as never,
        retroTitle: (body.retroTitle as string) ?? "the retro",
        fromName: (body.fromName as string) ?? "Teammate",
      });
    case "insights":
      return heuristicInsights({
        retros: (body.retros as never) ?? [],
        items: (body.items as never) ?? [],
        actions: (body.actions as never) ?? [],
        members: (body.members as never) ?? [],
      });
  }
}

async function runWithAnthropic(
  task: Task,
  body: Record<string, unknown>,
  apiKey: string,
): Promise<unknown> {
  const prompt = buildPrompt(task, body);
  if (!prompt) return null;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    content?: { text?: string }[];
  };
  const text = json.content?.[0]?.text?.trim() ?? "";

  // For JSON tasks, parse; else return text.
  if (task === "extract-actions" || task === "suggest-from-items" || task === "insights") {
    try {
      const start = text.indexOf("[");
      const end = text.lastIndexOf("]");
      if (start >= 0 && end > start) {
        return JSON.parse(text.slice(start, end + 1));
      }
      return null;
    } catch {
      return null;
    }
  }
  return text;
}

function buildPrompt(task: Task, body: Record<string, unknown>): string | null {
  switch (task) {
    case "extract-actions":
      return [
        `You are extracting concrete action items from raw retrospective notes.`,
        `Members on the team:`,
        JSON.stringify(body.members ?? [], null, 2),
        ``,
        `Raw notes:`,
        '"""',
        (body.text as string) ?? "",
        '"""',
        ``,
        `Return ONLY a JSON array. Each item: { "title": string, "ownerId": string | null, "dueOffsetDays": number, "confidence": number }.`,
        `dueOffsetDays is days from today. Confidence 0..1. Skip vague items.`,
      ].join("\n");
    case "summarize":
      return [
        `You are summarising a team retrospective for the team's records.`,
        `Retro: ${(body.retro as { title?: string })?.title ?? ""}.`,
        `Sticky notes (JSON):`,
        JSON.stringify(body.items ?? [], null, 2),
        `Actions captured (JSON):`,
        JSON.stringify(body.actions ?? [], null, 2),
        ``,
        `Write a 3–5 sentence summary capturing the biggest win, top friction, recurring themes, and the most important action ownership. Plain prose, no headers, no bullet lists.`,
      ].join("\n");
    case "nudge": {
      const action = body.action as { title?: string; detail?: string };
      const owner = body.owner as { name?: string } | undefined;
      return [
        `Draft a short, warm Slack nudge from ${body.fromName} to ${owner?.name ?? "the owner"}.`,
        `Action item: ${action?.title ?? ""}`,
        action?.detail ? `Detail: ${action.detail}` : "",
        `Tone: friendly, low-pressure, asks how to unblock. 3–5 lines max. No salutations beyond "Hey <name>" and no signature beyond "— <from>".`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    case "insights":
      return [
        `You analyse retrospective patterns across multiple sprints.`,
        `Retros JSON:`,
        JSON.stringify(body.retros ?? [], null, 2),
        `Items JSON:`,
        JSON.stringify(body.items ?? [], null, 2),
        `Actions JSON:`,
        JSON.stringify(body.actions ?? [], null, 2),
        ``,
        `Return ONLY a JSON array of 3–6 insights. Schema: { "kind": "recurring_theme" | "completion" | "stale" | "owner_balance" | "carry_over", "title": string, "body": string, "severity": "info" | "warning" | "success" }.`,
      ].join("\n");
    case "suggest-from-items":
      return [
        `Suggest concrete action items from these retrospective sticky notes (only the "didn't go well" and "ideas" columns are relevant).`,
        `Members: ${JSON.stringify(body.members ?? [])}`,
        `Items: ${JSON.stringify(body.items ?? [])}`,
        `Return ONLY a JSON array of { "title": string, "ownerId": string | null, "dueOffsetDays": number, "confidence": number }.`,
      ].join("\n");
    default:
      return null;
  }
}
