import type { RetroItem } from "@/lib/types";
import {
  checkSimilarityMock,
  type SimilarityResult,
} from "@/lib/ai/heuristics";
import { ollamaJson } from "@/lib/ai/ollama";

type Body = { text: string; pastItems: RetroItem[] };

export async function POST(req: Request) {
  const { text, pastItems } = (await req.json()) as Body;

  const formatted = pastItems
    .map((i, idx) => `${idx + 1}. [${i.id}] (${i.column}) ${i.text}`)
    .join("\n");

  const prompt = `Yeni madde: "${text}"
Geçmiş maddeler:
${formatted || "(boş)"}

Bu yeni madde geçmiştekilerden biriyle aynı konuyu mu işliyor?
JSON şeması: {"match": boolean, "similarItemId": string|null, "reason": string}`;

  const llm = await ollamaJson<SimilarityResult & { similarItemId: string | null }>(
    prompt,
  );
  if (
    llm &&
    typeof llm.match === "boolean" &&
    (llm.match === false || pastItems.some((p) => p.id === llm.similarItemId))
  ) {
    return Response.json({
      source: "local-llm",
      data: {
        match: llm.match,
        similarItemId: llm.similarItemId ?? undefined,
        reason: llm.reason,
      },
    });
  }

  return Response.json({
    source: "mock",
    data: checkSimilarityMock(text, pastItems),
  });
}
