import type { AppState } from "./types";
import { addDays, todayISO } from "./date";

// Exact seed data per spec — these IDs are referenced by the demo flow
// and the AI similarity mock.
export const SEED_IDS = {
  team: "team-pixel",
  members: {
    ayse: "u-ayse",
    mehmet: "u-mehmet",
    zeynep: "u-zeynep",
    can: "u-can",
  },
  retros: { r1: "retro-1", r2: "retro-2", r3: "retro-3" },
  // The "deploy" item from Sprint 22 — AI similarity mock matches against this.
  deployItemId: "i1",
  // The 45-day-old CI/CD action — referenced by the AI reason text.
  ciAction: "a1",
  // Code-review item that the "tczb" flag matches against. Action a2 originates from it.
  tczbItemId: "i3",
  tczbActionId: "a2",
} as const;

export function createSeedState(): AppState {
  const t = todayISO();
  const r1Date = `${addDays(t, -60)}T10:00:00.000Z`; // Sprint 22 — 60 gün önce
  const r2Date = `${addDays(t, -30)}T10:00:00.000Z`; // Sprint 23 — 30 gün önce
  const r3Date = `${t}T09:00:00.000Z`; // Sprint 24 — bugün
  const teamCreatedAt = `${addDays(t, -90)}T08:00:00.000Z`;

  return {
    teams: [
      {
        id: SEED_IDS.team,
        slug: "pixel-squad",
        name: "Pixel Squad",
        scrumMasterId: SEED_IDS.members.ayse,
        createdAt: teamCreatedAt,
      },
    ],
    members: [
      {
        id: SEED_IDS.members.ayse,
        teamId: SEED_IDS.team,
        name: "Ayşe",
        role: "scrum_master",
        joinedAt: teamCreatedAt,
      },
      {
        id: SEED_IDS.members.mehmet,
        teamId: SEED_IDS.team,
        name: "Mehmet",
        role: "member",
        joinedAt: teamCreatedAt,
      },
      {
        id: SEED_IDS.members.zeynep,
        teamId: SEED_IDS.team,
        name: "Zeynep",
        role: "member",
        joinedAt: teamCreatedAt,
      },
      {
        id: SEED_IDS.members.can,
        teamId: SEED_IDS.team,
        name: "Can",
        role: "member",
        joinedAt: teamCreatedAt,
      },
    ],
    currentTeamId: null,
    currentUserId: null,
    retros: [
      {
        id: SEED_IDS.retros.r1,
        teamId: SEED_IDS.team,
        sprintName: "Sprint 22",
        date: r1Date,
        status: "closed",
        summary:
          "Onboarding revizyonu tamam, NPS yükseldi. Deploy süresi ve code review süreleri tekrar gündeme geldi.",
      },
      {
        id: SEED_IDS.retros.r2,
        teamId: SEED_IDS.team,
        sprintName: "Sprint 23",
        date: r2Date,
        status: "closed",
        summary:
          "Standup süresi son üç sprintte üst üste konuşuldu. Deploy yavaşlığı hâlâ açık aksiyon olarak duruyor.",
      },
      {
        id: SEED_IDS.retros.r3,
        teamId: SEED_IDS.team,
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
        authorId: SEED_IDS.members.mehmet,
        createdAt: r1Date,
      },
      {
        id: "i2",
        retroId: SEED_IDS.retros.r1,
        column: "action",
        text: "CI/CD pipeline optimizasyonu yapılacak.",
        authorId: SEED_IDS.members.mehmet,
        createdAt: r1Date,
      },
      {
        id: "i3",
        retroId: SEED_IDS.retros.r1,
        column: "sad",
        text: "Code review'lar geç dönüyor.",
        authorId: SEED_IDS.members.zeynep,
        createdAt: r1Date,
      },
      {
        id: "i4",
        retroId: SEED_IDS.retros.r2,
        column: "sad",
        text: "Hâlâ deploylar yavaş, CI hatları takılıyor.",
        authorId: SEED_IDS.members.ayse,
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
        authorId: SEED_IDS.members.can,
        createdAt: r2Date,
      },
      {
        id: "i6",
        retroId: SEED_IDS.retros.r2,
        column: "glad",
        text: "Yeni QA ortamı çok hızlı.",
        authorId: SEED_IDS.members.ayse,
        createdAt: r2Date,
      },
      {
        id: "i7",
        retroId: SEED_IDS.retros.r3,
        column: "glad",
        text: "Onboarding dökümanı sayesinde yeni üyeler hızlı adapte oldu.",
        authorId: SEED_IDS.members.zeynep,
        createdAt: `${addDays(t, 0)}T09:30:00.000Z`,
      },
      {
        id: "i8",
        retroId: SEED_IDS.retros.r3,
        column: "sad",
        text: "Sprint planning toplantısı yine 3 saat sürdü.",
        authorId: SEED_IDS.members.mehmet,
        createdAt: `${addDays(t, 0)}T09:35:00.000Z`,
      },
      {
        id: "i9",
        retroId: SEED_IDS.retros.r3,
        column: "sad",
        text: "Bazı PR'lar review beklerken eskidi.",
        authorId: SEED_IDS.members.can,
        createdAt: `${addDays(t, 0)}T09:40:00.000Z`,
      },
    ],
    actions: [
      {
        id: SEED_IDS.ciAction,
        retroId: SEED_IDS.retros.r1,
        title: "CI/CD pipeline optimizasyonu",
        ownerId: SEED_IDS.members.mehmet,
        status: "open",
        createdAt: `${addDays(t, -45)}T10:00:00.000Z`, // 45 gündür açık
        sourceItemId: SEED_IDS.deployItemId,
        jiraKey: "PIXEL-12",
        jiraStatus: "todo",
      },
      {
        id: "a2",
        retroId: SEED_IDS.retros.r1,
        title: "Code review için 24 saat kuralı",
        ownerId: SEED_IDS.members.zeynep,
        status: "done",
        createdAt: r1Date,
        closedAt: `${addDays(t, -40)}T16:00:00.000Z`,
        sourceItemId: "i3",
        jiraKey: "PIXEL-08",
        jiraStatus: "done",
      },
      {
        id: "a3",
        retroId: SEED_IDS.retros.r2,
        title: "Standup time limit",
        ownerId: SEED_IDS.members.can,
        status: "done",
        createdAt: r2Date,
        closedAt: `${addDays(t, -22)}T16:00:00.000Z`,
        jiraKey: "PIXEL-15",
        jiraStatus: "done",
      },
      {
        id: "a4",
        retroId: SEED_IDS.retros.r2,
        title: "QA ortamına dokuman yaz",
        ownerId: SEED_IDS.members.ayse,
        status: "in_progress",
        createdAt: r2Date, // 30 gündür açık
        jiraKey: "PIXEL-21",
        jiraStatus: "ready_to_test",
      },
    ],
    notes: [
      {
        id: "n1",
        teamId: SEED_IDS.team,
        text: "Deploy hâlâ yavaş, retroda mutlaka konuşalım.",
        authorId: SEED_IDS.members.mehmet,
        createdAt: `${addDays(t, -3)}T09:00:00.000Z`,
        movedToRetro: false,
      },
      {
        id: "n2",
        teamId: SEED_IDS.team,
        text: "QA ortamı geçen sprint çok iyiydi.",
        authorId: SEED_IDS.members.ayse,
        createdAt: `${addDays(t, -5)}T09:00:00.000Z`,
        movedToRetro: false,
      },
      {
        id: "n3",
        teamId: SEED_IDS.team,
        text: "Standuplar artık daha kısa, devam etmeli.",
        authorId: SEED_IDS.members.can,
        createdAt: `${addDays(t, -2)}T09:00:00.000Z`,
        movedToRetro: false,
      },
      {
        id: "n4",
        teamId: SEED_IDS.team,
        text: "Süreç çok kötü.",
        authorId: SEED_IDS.members.zeynep,
        createdAt: `${addDays(t, -1)}T09:00:00.000Z`,
        movedToRetro: false,
      },
    ],
  };
}
