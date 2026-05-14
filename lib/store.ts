"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createSeedState } from "./seed";
import { nowISO } from "./date";
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

const STORAGE_KEY = "retro-tracker.v3";

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

function inviteCode(): string {
  // Short shareable code: e.g. "K7J-2QF"
  const a = Math.random().toString(36).slice(2, 5).toUpperCase();
  const b = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${a}-${b}`;
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

// Visibility: who can see what.
// - Scrum master: sees every card unredacted.
// - Member: sees own cards + cards explicitly revealed by SM.
export function canViewItem(s: AppState, item: RetroItem): boolean {
  if (isScrumMaster(s)) return true;
  if (item.authorId === s.currentUserId) return true;
  return item.revealed;
}

// ─── Mutations ──────────────────────────────────────────────────────────────

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
    const team: Team = {
      id: teamId,
      name: input.name.trim(),
      inviteCode: inviteCode(),
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
    setState((s) => ({
      ...s,
      teams: [...s.teams, team],
      members: [...s.members, member],
      retros: [...s.retros, firstRetro],
      currentTeamId: teamId,
      currentUserId: memberId,
    }));
    return { team, member };
  },

  joinTeam(input: { inviteCode: string; memberName: string }):
    | { team: Team; member: TeamMember }
    | { error: string } {
    const code = input.inviteCode.trim().toUpperCase();
    const team = state.teams.find(
      (t) => t.inviteCode.toUpperCase() === code,
    );
    if (!team) return { error: "Bu kod ile bir takım bulunamadı." };
    const name = input.memberName.trim();
    if (!name) return { error: "İsim boş olamaz." };

    // If member with same name already exists in team, reuse it.
    const existing = state.members.find(
      (m) => m.teamId === team.id && m.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) {
      setState((s) => ({
        ...s,
        currentTeamId: team.id,
        currentUserId: existing.id,
      }));
      return { team, member: existing };
    }

    const member: TeamMember = {
      id: uid("u"),
      teamId: team.id,
      name,
      role: "member",
      joinedAt: nowISO(),
    };
    setState((s) => ({
      ...s,
      members: [...s.members, member],
      currentTeamId: team.id,
      currentUserId: member.id,
    }));
    return { team, member };
  },

  setCurrentTeam(teamId: string | null) {
    setState((s) => ({ ...s, currentTeamId: teamId }));
  },

  // Switch the active user (demo helper — lets us preview other members' POVs)
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
            revealed: false,
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

  revealItem(id: string, revealed: boolean) {
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.id === id ? { ...i, revealed } : i)),
    }));
  },

  revealAllItems(retroId: string, revealed: boolean) {
    setState((s) => ({
      ...s,
      items: s.items.map((i) =>
        i.retroId === retroId ? { ...i, revealed } : i,
      ),
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
        // Actions are inherently visible — they're a team commitment.
        revealed: true,
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
        revealed: false,
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
