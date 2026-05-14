"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createSeedState } from "./seed";
import { addDays, nowISO, todayISO } from "./date";
import type {
  Action,
  ActionStatus,
  AppState,
  Column,
  Retro,
  RetroItem,
  SprintNote,
  Team,
  TeamMember,
} from "./types";

const STORAGE_KEY = "retrocell.v1";

const SEED_SNAPSHOT = createSeedState();
let state: AppState = SEED_SNAPSHOT;
let storageLoaded = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota — ignore */
  }
}

function emit() {
  for (const l of listeners) l();
}

function loadFromStorage() {
  if (storageLoaded || typeof window === "undefined") return;
  storageLoaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (
        parsed?.teams &&
        parsed?.members &&
        parsed?.retros &&
        parsed?.items &&
        parsed?.actions &&
        parsed?.notes
      ) {
        state = parsed;
      }
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): AppState {
  return state;
}

function getServerSnapshot(): AppState {
  return SEED_SNAPSHOT;
}

function setState(updater: (s: AppState) => AppState) {
  state = updater(state);
  persist();
  emit();
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(name: string): string {
  return (
    name
      .toLocaleLowerCase("tr-TR")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      // Turkish-specific replacements (after NFD other diacritics removed)
      .replace(/ı/g, "i")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || "takim"
  );
}

function uniqueSlug(state: AppState, base: string): string {
  if (!state.teams.some((t) => t.slug === base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!state.teams.some((t) => t.slug === candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
}

export function useHydrateStore() {
  useEffect(() => {
    loadFromStorage();
  }, []);
}

// ─── Selectors ─────────────────────────────────────────────────────────────

export function getCurrentTeam(s: AppState): Team | undefined {
  if (!s.currentTeamId) return undefined;
  return s.teams.find((t) => t.id === s.currentTeamId);
}

export function getCurrentMember(s: AppState): TeamMember | undefined {
  if (!s.currentUserId) return undefined;
  return s.members.find((m) => m.id === s.currentUserId);
}

export function getTeamBySlug(s: AppState, slug: string): Team | undefined {
  return s.teams.find((t) => t.slug === slug);
}

export function getTeamMembers(s: AppState, teamId: string): TeamMember[] {
  return s.members.filter((m) => m.teamId === teamId);
}

export function getActiveRetro(s: AppState): Retro | undefined {
  if (!s.currentTeamId) return undefined;
  return s.retros.find(
    (r) => r.status === "active" && r.teamId === s.currentTeamId,
  );
}

export function getRetroItems(s: AppState, retroId: string): RetroItem[] {
  return s.items.filter((i) => i.retroId === retroId);
}

export function getRetroActions(s: AppState, retroId: string): Action[] {
  return s.actions.filter((a) => a.retroId === retroId);
}

export function getPastItems(s: AppState, beforeRetroId: string): RetroItem[] {
  const target = s.retros.find((r) => r.id === beforeRetroId);
  if (!target) return [];
  return s.items.filter((i) => {
    const r = s.retros.find((x) => x.id === i.retroId);
    return !!r && r.teamId === target.teamId && r.date < target.date;
  });
}

export function isScrumMaster(s: AppState): boolean {
  const team = getCurrentTeam(s);
  if (!team) return false;
  return team.scrumMasterId === s.currentUserId;
}

// ─── Mutations ──────────────────────────────────────────────────────────────

function buildDemoNotes(teamId: string, memberId: string): SprintNote[] {
  const t = todayISO();
  return [
    {
      id: uid("note"),
      teamId,
      text: "Onboarding dökümanı yeni üyeler için çok iyi çalıştı.",
      authorId: memberId,
      createdAt: `${addDays(t, -4)}T09:00:00.000Z`,
      movedToRetro: false,
    },
    {
      id: uid("note"),
      teamId,
      text: "Stand-up'lar yine 30 dakikayı geçti, retroda konuşalım.",
      authorId: memberId,
      createdAt: `${addDays(t, -2)}T09:00:00.000Z`,
      movedToRetro: false,
    },
    {
      id: uid("note"),
      teamId,
      text: "QA ortamı bu sprint çok hızlıydı, devam etmeli.",
      authorId: memberId,
      createdAt: `${addDays(t, -1)}T09:00:00.000Z`,
      movedToRetro: false,
    },
  ];
}

export const store = {
  reset() {
    setState(() => createSeedState());
  },

  // Teams & membership ─────────────────────────────────────────────────────
  createTeam(input: { name: string; scrumMasterName: string }): {
    team: Team;
    member: TeamMember;
  } {
    const teamId = uid("team");
    const memberId = uid("u");
    const ts = nowISO();
    const baseSlug = slugify(input.name);
    const slug = uniqueSlug(state, baseSlug);
    const team: Team = {
      id: teamId,
      slug,
      name: input.name.trim(),
      scrumMasterId: memberId,
      createdAt: ts,
    };
    const member: TeamMember = {
      id: memberId,
      teamId,
      name: input.scrumMasterName.trim(),
      role: "scrum_master",
      joinedAt: ts,
    };
    const firstRetro: Retro = {
      id: uid("retro"),
      teamId,
      sprintName: "Sprint 1",
      date: ts,
      status: "active",
    };
    const demoNotes = buildDemoNotes(teamId, memberId);
    setState((s) => ({
      ...s,
      teams: [...s.teams, team],
      members: [...s.members, member],
      retros: [...s.retros, firstRetro],
      notes: [...demoNotes, ...s.notes],
      currentTeamId: teamId,
      currentUserId: memberId,
    }));
    return { team, member };
  },

  // Join an existing team by slug. If team does not exist, creates a stub
  // (so cross-browser demos can land directly on a shared /board/[slug] URL).
  // The first person to join a stub becomes the scrum master because there
  // is no one else; otherwise they are a regular member.
  joinTeamBySlug(input: {
    slug: string;
    memberName: string;
    teamNameFallback?: string;
  }): { team: Team; member: TeamMember } | { error: string } {
    const slug = input.slug.trim().toLowerCase();
    if (!slug) return { error: "Geçersiz takım bağlantısı." };
    const name = input.memberName.trim();
    if (!name) return { error: "İsim boş olamaz." };

    let existing = state.teams.find((t) => t.slug === slug);

    if (!existing) {
      // Stub team — someone landed via a shared URL in a browser that doesn't
      // have this team locally. Treat them as a regular member; the admin
      // exists conceptually (in the browser that originally created the team)
      // and we mirror that with a placeholder scrum-master member.
      const teamId = uid("team");
      const adminId = uid("u-admin");
      const memberId = uid("u");
      const ts = nowISO();
      const team: Team = {
        id: teamId,
        slug,
        name: input.teamNameFallback?.trim() || prettifySlug(slug),
        scrumMasterId: adminId,
        createdAt: ts,
      };
      const placeholderAdmin: TeamMember = {
        id: adminId,
        teamId,
        name: "Scrum Master",
        role: "scrum_master",
        joinedAt: ts,
      };
      const member: TeamMember = {
        id: memberId,
        teamId,
        name,
        role: "member",
        joinedAt: ts,
      };
      const firstRetro: Retro = {
        id: uid("retro"),
        teamId,
        sprintName: "Sprint 1",
        date: ts,
        status: "active",
      };
      const demoNotes = buildDemoNotes(teamId, adminId);
      setState((s) => ({
        ...s,
        teams: [...s.teams, team],
        members: [...s.members, placeholderAdmin, member],
        retros: [...s.retros, firstRetro],
        notes: [...demoNotes, ...s.notes],
        currentTeamId: teamId,
        currentUserId: memberId,
      }));
      return { team, member };
    }

    // Reuse an existing membership by same name if it exists.
    const reused = state.members.find(
      (m) =>
        m.teamId === existing!.id &&
        m.name.toLowerCase() === name.toLowerCase(),
    );
    if (reused) {
      setState((s) => ({
        ...s,
        currentTeamId: existing!.id,
        currentUserId: reused.id,
      }));
      return { team: existing, member: reused };
    }

    const member: TeamMember = {
      id: uid("u"),
      teamId: existing.id,
      name,
      role: "member",
      joinedAt: nowISO(),
    };
    setState((s) => ({
      ...s,
      members: [...s.members, member],
      currentTeamId: existing!.id,
      currentUserId: member.id,
    }));
    return { team: existing, member };
  },

  setCurrentTeam(teamId: string | null) {
    setState((s) => ({ ...s, currentTeamId: teamId }));
  },

  switchUser(memberId: string | null) {
    setState((s) => {
      if (!memberId) return { ...s, currentUserId: null };
      const m = s.members.find((x) => x.id === memberId);
      if (!m) return s;
      return { ...s, currentUserId: memberId, currentTeamId: m.teamId };
    });
  },

  signOut() {
    setState((s) => ({ ...s, currentTeamId: null, currentUserId: null }));
  },

  // Items ──────────────────────────────────────────────────────────────────
  addItem(input: {
    retroId: string;
    column: Column;
    text: string;
    similarToItemId?: string;
    similarReason?: string;
    isVague?: boolean;
    vagueQuestion?: string;
  }): string {
    const id = uid("item");
    setState((s) => {
      if (!s.currentUserId) return s;
      return {
        ...s,
        items: [
          ...s.items,
          {
            id,
            retroId: input.retroId,
            column: input.column,
            text: input.text,
            authorId: s.currentUserId,
            createdAt: nowISO(),
            similarToItemId: input.similarToItemId,
            similarReason: input.similarReason,
            isVague: input.isVague,
            vagueQuestion: input.vagueQuestion,
          },
        ],
      };
    });
    return id;
  },

  updateItem(id: string, patch: Partial<RetroItem>) {
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  },

  deleteItem(id: string) {
    setState((s) => ({
      ...s,
      items: s.items.filter((i) => i.id !== id),
    }));
  },

  moveItem(id: string, column: Column) {
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.id === id ? { ...i, column } : i)),
    }));
  },

  // Actions ────────────────────────────────────────────────────────────────
  promoteItemToAction(itemId: string, title?: string): string | undefined {
    let newId: string | undefined;
    setState((s) => {
      const item = s.items.find((i) => i.id === itemId);
      if (!item || !s.currentUserId) return s;
      const finalTitle = (title?.trim() || item.text).slice(0, 200);
      newId = uid("action");
      const action: Action = {
        id: newId,
        retroId: item.retroId,
        title: finalTitle,
        ownerId: s.currentUserId,
        status: "open",
        createdAt: nowISO(),
        sourceItemId: item.id,
      };
      const boardActionItem: RetroItem = {
        id: uid("item"),
        retroId: item.retroId,
        column: "action",
        text: finalTitle,
        authorId: s.currentUserId,
        createdAt: nowISO(),
        sourceItemId: item.id,
      };
      return {
        ...s,
        actions: [...s.actions, action],
        items: [...s.items, boardActionItem],
      };
    });
    return newId;
  },

  demoteItemToNote(itemId: string) {
    setState((s) => {
      const item = s.items.find((i) => i.id === itemId);
      if (!item) return s;
      const teamId =
        s.retros.find((r) => r.id === item.retroId)?.teamId ??
        s.currentTeamId ??
        "";
      const note: SprintNote = {
        id: uid("note"),
        teamId,
        text: item.text,
        authorId: item.authorId,
        createdAt: nowISO(),
        movedToRetro: false,
      };
      return {
        ...s,
        notes: [note, ...s.notes],
        items: s.items.filter((i) => i.id !== itemId),
      };
    });
  },

  updateActionStatus(id: string, to: ActionStatus) {
    setState((s) => ({
      ...s,
      actions: s.actions.map((a) =>
        a.id === id
          ? {
              ...a,
              status: to,
              closedAt: to === "done" ? nowISO() : undefined,
            }
          : a,
      ),
    }));
  },

  createJiraTaskForAction(id: string, jiraKey?: string) {
    setState((s) => ({
      ...s,
      actions: s.actions.map((a) => {
        if (a.id !== id) return a;
        const key =
          jiraKey ??
          `PIXEL-${String(100 + Math.floor(Math.random() * 900))}`;
        return {
          ...a,
          jiraKey: key,
          jiraStatus: "todo" as const,
        };
      }),
    }));
  },

  // Sprint notes ───────────────────────────────────────────────────────────
  addNote(text: string) {
    setState((s) => {
      if (!s.currentTeamId || !s.currentUserId) return s;
      return {
        ...s,
        notes: [
          {
            id: uid("note"),
            teamId: s.currentTeamId,
            text,
            authorId: s.currentUserId,
            createdAt: nowISO(),
            movedToRetro: false,
          },
          ...s.notes,
        ],
      };
    });
  },

  moveNoteToRetro(noteId: string, retroId: string, column: Column) {
    setState((s) => {
      const note = s.notes.find((n) => n.id === noteId);
      if (!note) return s;
      const newItem: RetroItem = {
        id: uid("item"),
        retroId,
        column,
        text: note.text,
        authorId: note.authorId,
        createdAt: nowISO(),
      };
      return {
        ...s,
        items: [...s.items, newItem],
        notes: s.notes.map((n) =>
          n.id === noteId ? { ...n, movedToRetro: true } : n,
        ),
      };
    });
  },

  deleteNote(id: string) {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  },

  // Retro lifecycle ────────────────────────────────────────────────────────
  closeRetro(id: string, summary?: string) {
    setState((s) => ({
      ...s,
      retros: s.retros.map((r) =>
        r.id === id
          ? { ...r, status: "closed", summary: summary ?? r.summary }
          : r,
      ),
    }));
  },
};

function prettifySlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
}

export type {
  Action,
  ActionStatus,
  AppState,
  Column,
  Retro,
  RetroItem,
  SprintNote,
  Team,
  TeamMember,
};
