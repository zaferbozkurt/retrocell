import {
  checkVaguenessMock,
  type VaguenessResult,
} from "@/lib/ai/heuristics";
import { ollamaJson } from "@/lib/ai/ollama";

type Body = { text: string };

export async function POST(req: Request) {
  const { text } = (await req.json()) as Body;

  const prompt = `Madde: "${text}"
Bu madde retroda konuşulmak için yeterince somut mu? Eğer muğlak ise tek bir somut soruyla netleştir.
JSON şeması: {"clear": boolean, "question": string|null}`;

  const llm = await ollamaJson<VaguenessResult & { question: string | null }>(prompt);
  if (llm && typeof llm.clear === "boolean") {
    return Response.json({
      source: "local-llm",
      data: {
        clear: llm.clear,
        question: llm.question ?? undefined,
      },
    });
  }

  return Response.json({
    source: "mock",
    data: checkVaguenessMock(text),
  });
}
