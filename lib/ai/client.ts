"use client";

import type { RetroItem } from "@/lib/types";
import {
  checkSimilarityMock,
  checkVaguenessMock,
  type SimilarityResult,
  type VaguenessResult,
} from "./heuristics";

export type AiResult<T> = { source: "local-llm" | "mock"; data: T };

async function callApi<T>(
  task: string,
  body: unknown,
  fallback: () => T,
): Promise<AiResult<T>> {
  // 3-second timeout so a stalled local LLM doesn't block the UI.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`/api/ai/${task}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`AI ${task} failed: ${res.status}`);
    return (await res.json()) as AiResult<T>;
  } catch {
    clearTimeout(timer);
    return { source: "mock", data: fallback() };
  }
}

export function aiCheckSimilarity(
  text: string,
  pastItems: RetroItem[],
): Promise<AiResult<SimilarityResult>> {
  return callApi("similarity", { text, pastItems }, () =>
    checkSimilarityMock(text, pastItems),
  );
}

export function aiCheckVagueness(text: string): Promise<AiResult<VaguenessResult>> {
  return callApi("vagueness", { text }, () => checkVaguenessMock(text));
}
