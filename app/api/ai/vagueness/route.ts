import { checkVaguenessMock } from "@/lib/ai/heuristics";

type Body = { text: string };

// Demo: AI is fully mocked. No external LLM call — always deterministic.
export async function POST(req: Request) {
  const { text } = (await req.json()) as Body;
  return Response.json({
    source: "mock",
    data: checkVaguenessMock(text),
  });
}
