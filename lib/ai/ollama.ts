// Server-side helper for talking to a local Ollama instance.
// Returns null if anything goes wrong so callers fall back to the mock.

const OLLAMA_URL =
  process.env.OLLAMA_URL ?? "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

const SYSTEM_PROMPT =
  "Sen retro toplantı asistanısın. Sadece geçerli JSON cevap ver, başka metin yok.";

export async function ollamaJson<T>(
  userPrompt: string,
  timeoutMs = 3000,
): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        format: "json",
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const body = (await res.json()) as { response?: string };
    if (!body.response) return null;
    return JSON.parse(body.response) as T;
  } catch {
    clearTimeout(timer);
    return null;
  }
}
