import type { AppState } from "./types";
import { addDays, todayISO } from "./date";

// Exact seed data per spec — these IDs are referenced by the demo flow
// and the AI similarity mock.
export const SEED_IDS = {
  retros: { r1: "retro-1", r2: "retro-2", r3: "retro-3" },
  // The "deploy" item from Sprint 22 — AI similarity mock matches against this.
  deployItemId: "i1",
  // The 45-day-old CI/CD action — referenced by the AI reason text.
  ciAction: "a1",
} as const;

export function createSeedState(): AppState {
  const t = todayISO();
  const r1Date = `${addDays(t, -60)}T10:00:00.000Z`; // Sprint 22 — 60 gün önce
  const r2Date = `${addDays(t, -30)}T10:00:00.000Z`; // Sprint 23 — 30 gün önce
  const r3Date = `${t}T09:00:00.000Z`; // Sprint 24 — bugün

  return {
    currentUser: "Ayşe",
    retros: [
      {
        id: SEED_IDS.retros.r1,
        sprintName: "Sprint 22",
        date: r1Date,
        status: "closed",
        summary:
          "Onboarding revizyonu tamam, NPS yükseldi. Deploy süresi ve code review süreleri tekrar gündeme geldi.",
      },
      {
        id: SEED_IDS.retros.r2,
        sprintName: "Sprint 23",
        date: r2Date,
        status: "closed",
        summary:
          "Standup süresi son üç sprintte üst üste konuşuldu. Deploy yavaşlığı hâlâ açık aksiyon olarak duruyor.",
      },
      {
        id: SEED_IDS.retros.r3,
        sprintName: "Sprint 24",
        date: r3Date,
        status: "active",
      },
    ],
    items: [
      {
        id: SEED_IDS.deployItemId,
        retroId: SEED_IDS.retros.r1,
        column: "sad",
        text: "Deploy süreçleri çok yavaş, her release 2 saat sürüyor.",
        author: "Mehmet",
        createdAt: r1Date,
      },
      {
        id: "i2",
        retroId: SEED_IDS.retros.r1,
        column: "action",
        text: "CI/CD pipeline optimizasyonu yapılacak.",
        author: "Mehmet",
        createdAt: r1Date,
      },
      {
        id: "i3",
        retroId: SEED_IDS.retros.r1,
        column: "sad",
        text: "Code review'lar geç dönüyor.",
        author: "Zeynep",
        createdAt: r1Date,
      },
      {
        id: "i4",
        retroId: SEED_IDS.retros.r2,
        column: "sad",
        text: "Hâlâ deploylar yavaş, CI hatları takılıyor.",
        author: "Ayşe",
        createdAt: r2Date,
        similarToItemId: SEED_IDS.deployItemId,
        similarReason:
          "Aynı konu Sprint 22'de açıldı. CI/CD aksiyonu hâlâ açık (45 gündür).",
      },
      {
        id: "i5",
        retroId: SEED_IDS.retros.r2,
        column: "action",
        text: "Standup'lar 30 dakikada bitsin.",
        author: "Can",
        createdAt: r2Date,
      },
      {
        id: "i6",
        retroId: SEED_IDS.retros.r2,
        column: "glad",
        text: "Yeni QA ortamı çok hızlı.",
        author: "Ayşe",
        createdAt: r2Date,
      },
    ],
    actions: [
      {
        id: SEED_IDS.ciAction,
        retroId: SEED_IDS.retros.r1,
        title: "CI/CD pipeline optimizasyonu",
        owner: "Mehmet",
        status: "open",
        createdAt: `${addDays(t, -45)}T10:00:00.000Z`, // 45 gündür açık
      },
      {
        id: "a2",
        retroId: SEED_IDS.retros.r1,
        title: "Code review için 24 saat kuralı",
        owner: "Zeynep",
        status: "done",
        createdAt: r1Date,
        closedAt: `${addDays(t, -40)}T16:00:00.000Z`,
      },
      {
        id: "a3",
        retroId: SEED_IDS.retros.r2,
        title: "Standup time limit",
        owner: "Can",
        status: "done",
        createdAt: r2Date,
        closedAt: `${addDays(t, -22)}T16:00:00.000Z`,
      },
      {
        id: "a4",
        retroId: SEED_IDS.retros.r2,
        title: "QA ortamına dokuman yaz",
        owner: "Ayşe",
        status: "open",
        createdAt: r2Date, // 30 gündür açık
      },
    ],
    notes: [
      {
        id: "n1",
        text: "Deploy hâlâ yavaş, retroda mutlaka konuşalım.",
        author: "Mehmet",
        createdAt: `${addDays(t, -3)}T09:00:00.000Z`,
        movedToRetro: false,
      },
      {
        id: "n2",
        text: "QA ortamı geçen sprint çok iyiydi.",
        author: "Ayşe",
        createdAt: `${addDays(t, -5)}T09:00:00.000Z`,
        movedToRetro: false,
      },
      {
        id: "n3",
        text: "Standuplar artık daha kısa, devam etmeli.",
        author: "Can",
        createdAt: `${addDays(t, -2)}T09:00:00.000Z`,
        movedToRetro: false,
      },
      {
        id: "n4",
        text: "Süreç çok kötü.",
        author: "Zeynep",
        createdAt: `${addDays(t, -1)}T09:00:00.000Z`,
        movedToRetro: false,
      },
    ],
  };
}
