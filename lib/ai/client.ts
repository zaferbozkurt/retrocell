"use client";

import type { ActionItem, Member, Retro, RetroItem } from "@/lib/types";
import type { RetroInsight, SuggestedAction } from "./heuristics";
import {
  heuristicExtractActions,
  heuristicInsights,
  heuristicNudge,
  heuristicSuggestFromItems,
  heuristicSummarizeRetro,
} from "./heuristics";

type AiResponse<T> = { source: "model" | "heuristic"; data: T };

async function callApi<T>(
  task: string,
  body: unknown,
  fallback: () => T,
): Promise<AiResponse<T>> {
  try {
    const res = await fetch(`/api/ai/${task}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`AI ${task} failed: ${res.status}`);
    const json = (await res.json()) as { source: "model" | "heuristic"; data: T };
    return json;
  } catch {
    return { source: "heuristic", data: fallback() };
  }
}

export async function aiExtractActions(
  text: string,
  members: Member[],
): Promise<AiResponse<SuggestedAction[]>> {
  return callApi("extract-actions", { text, members }, () =>
    heuristicExtractActions(text, members),
  );
}

export async function aiSuggestFromItems(
  items: RetroItem[],
  members: Member[],
): Promise<AiResponse<SuggestedAction[]>> {
  return callApi("suggest-from-items", { items, members }, () =>
    heuristicSuggestFromItems({ items, members }),
  );
}

export async function aiSummarize(
  retro: Retro,
  items: RetroItem[],
  actions: ActionItem[],
  members: Member[],
): Promise<AiResponse<string>> {
  return callApi(
    "summarize",
    { retro, items, actions, members },
    () => heuristicSummarizeRetro({ retro, items, actions, members }),
  );
}

export async function aiNudge(
  action: ActionItem,
  owner: Member | undefined,
  retroTitle: string,
  fromName: string,
): Promise<AiResponse<string>> {
  return callApi("nudge", { action, owner, retroTitle, fromName }, () =>
    heuristicNudge({ action, owner, retroTitle, fromName }),
  );
}

export async function aiInsights(
  retros: Retro[],
  items: RetroItem[],
  actions: ActionItem[],
  members: Member[],
): Promise<AiResponse<RetroInsight[]>> {
  return callApi("insights", { retros, items, actions, members }, () =>
    heuristicInsights({ retros, items, actions, members }),
  );
}
