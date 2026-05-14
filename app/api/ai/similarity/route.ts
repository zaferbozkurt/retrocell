import type { RetroItem } from "@/lib/types";
import { checkSimilarityMock } from "@/lib/ai/heuristics";

type Body = { text: string; pastItems: RetroItem[] };

// Demo: AI is fully mocked. No external LLM call — always deterministic.
export async function POST(req: Request) {
  const { text, pastItems } = (await req.json()) as Body;
  return Response.json({
    source: "mock",
    data: checkSimilarityMock(text, pastItems),
  });
}
