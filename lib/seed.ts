import type { AppState } from "./types";
import { addDays, todayISO } from "./date";

export function createSeedState(): AppState {
  const t = todayISO();

  const members = [
    { id: "u1", name: "Zafer Bozkurt", initials: "ZB", color: "#7c3aed", role: "Engineering Lead" },
    { id: "u2", name: "Selin Demir", initials: "SD", color: "#ea580c", role: "Designer" },
    { id: "u3", name: "Mert Yıldız", initials: "MY", color: "#0ea5e9", role: "Backend" },
    { id: "u4", name: "Aylin Koç", initials: "AK", color: "#16a34a", role: "Frontend" },
    { id: "u5", name: "Burak Aksoy", initials: "BA", color: "#db2777", role: "Product" },
    { id: "u6", name: "Deniz Şahin", initials: "DŞ", color: "#facc15", role: "QA" },
  ];

  // Sprint 22 retro (closed, 3 weeks ago) — has both done and lingering actions.
  const r1 = {
    id: "retro-sprint-22",
    title: "Sprint 22 retrospective",
    sprintLabel: "Sprint 22",
    status: "closed" as const,
    facilitatorId: "u1",
    createdAt: `${addDays(t, -21)}T10:00:00.000Z`,
    closedAt: `${addDays(t, -21)}T11:30:00.000Z`,
    participants: ["u1", "u2", "u3", "u4", "u5", "u6"],
    summary:
      "Strong delivery on the onboarding revamp. Two big themes: standup time keeps slipping (recurring) and the staging environment is unstable. Six action items captured, four shipped, two carried into Sprint 23.",
  };

  // Sprint 23 retro (closed, 1 week ago) — half the actions inherited from r1.
  const r2 = {
    id: "retro-sprint-23",
    title: "Sprint 23 retrospective",
    sprintLabel: "Sprint 23",
    status: "closed" as const,
    facilitatorId: "u1",
    createdAt: `${addDays(t, -7)}T10:00:00.000Z`,
    closedAt: `${addDays(t, -7)}T11:30:00.000Z`,
    participants: ["u1", "u2", "u3", "u4", "u5"],
    summary:
      "Velocity recovered. Standup discipline still flagged for the third sprint in a row — worth a focused conversation. Staging is now stable thanks to Mert's pipeline work.",
  };

  // Sprint 24 retro (live, today) — empty board waiting to be filled.
  const r3 = {
    id: "retro-sprint-24",
    title: "Sprint 24 retrospective",
    sprintLabel: "Sprint 24",
    status: "live" as const,
    facilitatorId: "u1",
    createdAt: `${t}T09:30:00.000Z`,
    participants: ["u1", "u2", "u3", "u4", "u5", "u6"],
  };

  const retroItems = [
    // Sprint 22 items
    {
      id: "i1",
      retroId: r1.id,
      columnId: "went-well" as const,
      content: "Onboarding revamp shipped on time and NPS jumped 8 points.",
      authorId: "u2",
      votes: ["u1", "u3", "u5"],
      createdAt: r1.createdAt,
    },
    {
      id: "i2",
      retroId: r1.id,
      columnId: "didnt-go-well" as const,
      content: "Standup keeps running over 25 minutes — losing focus by Wednesday.",
      authorId: "u4",
      votes: ["u1", "u2", "u6"],
      createdAt: r1.createdAt,
      linkedActionId: "a1",
    },
    {
      id: "i3",
      retroId: r1.id,
      columnId: "didnt-go-well" as const,
      content: "Staging environment crashed three times this sprint.",
      authorId: "u3",
      votes: ["u4", "u5"],
      createdAt: r1.createdAt,
      linkedActionId: "a2",
    },
    {
      id: "i4",
      retroId: r1.id,
      columnId: "ideas" as const,
      content: "Could we trial a 'silent standup' format on Wednesdays?",
      authorId: "u5",
      votes: ["u1", "u2"],
      createdAt: r1.createdAt,
      linkedActionId: "a3",
    },
    {
      id: "i5",
      retroId: r1.id,
      columnId: "shoutouts" as const,
      content: "Huge thanks to Aylin for unblocking the auth refactor in two days.",
      authorId: "u1",
      votes: ["u2", "u3", "u5", "u6"],
      createdAt: r1.createdAt,
    },
    // Sprint 23 items
    {
      id: "i6",
      retroId: r2.id,
      columnId: "went-well" as const,
      content: "Staging is now rock solid — zero incidents this sprint.",
      authorId: "u3",
      votes: ["u1", "u4"],
      createdAt: r2.createdAt,
    },
    {
      id: "i7",
      retroId: r2.id,
      columnId: "didnt-go-well" as const,
      content: "Standup is STILL running long. Third sprint we've raised this.",
      authorId: "u4",
      votes: ["u1", "u2", "u5", "u6"],
      createdAt: r2.createdAt,
      linkedActionId: "a4",
    },
    {
      id: "i8",
      retroId: r2.id,
      columnId: "didnt-go-well" as const,
      content: "Design handoff still relies on Figma comments — easy to miss.",
      authorId: "u2",
      votes: ["u4"],
      createdAt: r2.createdAt,
      linkedActionId: "a5",
    },
    {
      id: "i9",
      retroId: r2.id,
      columnId: "ideas" as const,
      content: "Pair-program the onboarding bug triage on Thursdays.",
      authorId: "u4",
      votes: ["u3"],
      createdAt: r2.createdAt,
    },
    {
      id: "i10",
      retroId: r2.id,
      columnId: "shoutouts" as const,
      content: "Mert's pipeline work fixed staging — top tier.",
      authorId: "u1",
      votes: ["u2", "u3", "u4", "u5"],
      createdAt: r2.createdAt,
    },
  ];

  const actions = [
    {
      id: "a1",
      title: "Cap standup to 15 minutes with a visible timer",
      detail:
        "Tried to address standup overrun by adding a visible 15-minute timer in the meeting room. Owner committed to enforce it.",
      ownerId: "u1",
      dueDate: addDays(t, -10),
      status: "blocked" as const,
      retroId: r1.id,
      sourceItemId: "i2",
      createdAt: r1.createdAt,
      updatedAt: `${addDays(t, -14)}T10:00:00.000Z`,
      carriedOverCount: 1,
      history: [
        { at: r1.createdAt, type: "created" as const, byId: "u1" },
        {
          at: `${addDays(t, -18)}T10:00:00.000Z`,
          type: "status" as const,
          from: "open",
          to: "in_progress",
          byId: "u1",
        },
        {
          at: `${addDays(t, -14)}T10:00:00.000Z`,
          type: "status" as const,
          from: "in_progress",
          to: "blocked",
          note: "Half the team works remote — physical timer doesn't reach them.",
          byId: "u1",
        },
        {
          at: r2.createdAt,
          type: "carried" as const,
          note: "Carried from Sprint 22 into Sprint 23.",
          byId: "u1",
        },
      ],
      nudges: [],
    },
    {
      id: "a2",
      title: "Stabilise staging environment",
      detail: "Investigate the three staging crashes and put monitoring in place.",
      ownerId: "u3",
      dueDate: addDays(t, -14),
      status: "done" as const,
      retroId: r1.id,
      sourceItemId: "i3",
      createdAt: r1.createdAt,
      updatedAt: `${addDays(t, -10)}T16:00:00.000Z`,
      carriedOverCount: 0,
      history: [
        { at: r1.createdAt, type: "created" as const, byId: "u1" },
        {
          at: `${addDays(t, -15)}T10:00:00.000Z`,
          type: "status" as const,
          from: "open",
          to: "in_progress",
          byId: "u3",
        },
        {
          at: `${addDays(t, -10)}T16:00:00.000Z`,
          type: "status" as const,
          from: "in_progress",
          to: "done",
          note: "New pipeline + Grafana alerts deployed.",
          byId: "u3",
        },
      ],
      nudges: [],
    },
    {
      id: "a3",
      title: "Pilot 'silent standup' on Wednesday",
      detail: "Try a written async standup format on Wednesdays for two weeks; review at retro.",
      ownerId: "u5",
      dueDate: addDays(t, -7),
      status: "dropped" as const,
      retroId: r1.id,
      sourceItemId: "i4",
      createdAt: r1.createdAt,
      updatedAt: `${addDays(t, -8)}T10:00:00.000Z`,
      carriedOverCount: 0,
      history: [
        { at: r1.createdAt, type: "created" as const, byId: "u1" },
        {
          at: `${addDays(t, -8)}T10:00:00.000Z`,
          type: "status" as const,
          from: "open",
          to: "dropped",
          note: "Team voted to keep sync standup but cap to 15 mins. Folded into a1.",
          byId: "u1",
        },
      ],
      nudges: [],
    },
    {
      id: "a4",
      title: "Decide on a permanent fix for standup overrun",
      detail:
        "Bring a concrete proposal to Sprint 24 retro: a 15-min hard stop with a queue for deeper threads.",
      ownerId: "u1",
      dueDate: addDays(t, -2),
      status: "in_progress" as const,
      retroId: r2.id,
      sourceItemId: "i7",
      createdAt: r2.createdAt,
      updatedAt: `${addDays(t, -3)}T15:00:00.000Z`,
      carriedOverCount: 0,
      history: [
        { at: r2.createdAt, type: "created" as const, byId: "u1" },
        {
          at: `${addDays(t, -3)}T15:00:00.000Z`,
          type: "status" as const,
          from: "open",
          to: "in_progress",
          byId: "u1",
        },
      ],
      nudges: [
        {
          at: `${addDays(t, -1)}T10:00:00.000Z`,
          byId: "u4",
          message:
            "Hey Zafer — sprint 24 retro is tomorrow and this is the third time we've raised standup length. Anything I can do to help land a proposal?",
        },
      ],
    },
    {
      id: "a5",
      title: "Move design handoff out of Figma comments",
      detail:
        "Comments get buried. Move handoff notes into Linear tickets with a checklist template.",
      ownerId: "u2",
      dueDate: addDays(t, 3),
      status: "open" as const,
      retroId: r2.id,
      sourceItemId: "i8",
      createdAt: r2.createdAt,
      updatedAt: r2.createdAt,
      carriedOverCount: 0,
      history: [{ at: r2.createdAt, type: "created" as const, byId: "u1" }],
      nudges: [],
    },
    {
      id: "a6",
      title: "Draft an RFC for the onboarding bug triage rotation",
      detail: "Capture the pair-programming idea and circulate to the team.",
      ownerId: "u4",
      dueDate: addDays(t, 10),
      status: "open" as const,
      retroId: r2.id,
      createdAt: r2.createdAt,
      updatedAt: r2.createdAt,
      carriedOverCount: 0,
      history: [{ at: r2.createdAt, type: "created" as const, byId: "u1" }],
      nudges: [],
    },
  ];

  return {
    currentUserId: "u1",
    teamName: "Pixel Squad",
    members,
    retros: [r1, r2, r3],
    retroItems,
    actions,
  };
}
