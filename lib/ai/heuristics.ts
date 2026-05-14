import type { RetroItem } from "@/lib/types";
import { SEED_IDS } from "@/lib/seed";

export type SimilarityResult = {
  match: boolean;
  similarItemId?: string;
  reason?: string;
};

export type VaguenessResult = {
  clear: boolean;
  question?: string;
};

// Deterministic mock for the demo. Guarantees Bölüm 11 scenario steps 4–5
// will fire predictably without any LLM running.

const VAGUE_TOKENS = ["süreç", "kötü", "sorun", "problem", "berbat"];

export function checkSimilarityMock(
  newText: string,
  pastItems: RetroItem[],
): SimilarityResult {
  const lower = newText.toLowerCase();
  if (lower.includes("deploy")) {
    // Prefer the original Sprint 22 deploy item if it exists.
    const target =
      pastItems.find((i) => i.id === SEED_IDS.deployItemId) ??
      pastItems.find((i) => i.text.toLowerCase().includes("deploy"));
    if (target) {
      return {
        match: true,
        similarItemId: target.id,
        reason:
          "Aynı konu Sprint 22 ve Sprint 23'te konuşulmuş, CI/CD aksiyonu hâlâ açık (45 gün).",
      };
    }
  }
  return { match: false };
}

export function checkVaguenessMock(text: string): VaguenessResult {
  const trimmed = text.trim();
  if (trimmed.length < 25) {
    return {
      clear: false,
      question: "Biraz daha detay verebilir misin? Hangi durumda, etkisi ne?",
    };
  }
  const lower = trimmed.toLowerCase();
  const hasVagueWord = VAGUE_TOKENS.some((w) => lower.includes(w));
  // Concrete details usually include numbers, durations, names, or specifics.
  const hasConcreteDetail = /\d|saat|dakika|gün|hafta|release|deploy|standup|sprint/i.test(
    trimmed,
  );
  if (hasVagueWord && !hasConcreteDetail) {
    return {
      clear: false,
      question: "Hangi süreç? Hangi durumda? Etkisi ne?",
    };
  }
  return { clear: true };
}
