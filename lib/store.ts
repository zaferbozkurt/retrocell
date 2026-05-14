"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createSeedState } from "./seed";
import { nowISO, todayISO } from "./date";
import type {
  ActionItem,
  ActionStatus,
  AppState,
  ColumnId,
  Member,
  Retro,
  RetroItem,
  RetroStatus,
} from "./types";

const STORAGE_KEY = "retroloop.v1";

const SEED_SNAPSHOT = createSeedState();
let state: AppState = SEED_SNAPSHOT;
let storageLoaded = false;
let storageHydrated = false; // becomes true after the first useEffect tick
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
      if (parsed?.members && parsed?.retros && parsed?.actions) {
        state = parsed;
      }
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    /* ignore */
  }
  storageHydrated = true;
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
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
}

export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => storageHydrated,
    () => false,
  );
}

/** Mount this hook once near the root to load persisted state from localStorage. */
export function useHydrateStore() {
  useEffect(() => {
    loadFromStorage();
  }, []);
}

// ─── Selectors (pure helpers, callable from anywhere) ───────────────────────

export function getMember(s: AppState, id: string): Member | undefined {
  return s.members.find((m) => m.id === id);
}

export function getRetro(s: AppState, id: string): Retro | undefined {
  return s.retros.find((r) => r.id === id);
}

export function getRetroItems(s: AppState, retroId: string): RetroItem[] {
  return s.retroItems.filter((i) => i.retroId === retroId);
}

export function getRetroActions(s: AppState, retroId: string): ActionItem[] {
  return s.actions.filter((a) => a.retroId === retroId);
}

export function getOpenActions(s: AppState): ActionItem[] {
  return s.actions.filter((a) => a.status !== "done" && a.status !== "dropped");
}

export function getPreviousRetro(s: AppState, retroId?: string): Retro | undefined {
  const sorted = [...s.retros]
    .filter((r) => r.status === "closed")
    .sort((a, b) => (a.closedAt ?? a.createdAt).localeCompare(b.closedAt ?? b.createdAt));
  if (!retroId) return sorted.at(-1);
  const idx = sorted.findIndex((r) => r.id === retroId);
  if (idx <= 0) return sorted.at(-1);
  return sorted[idx - 1];
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export const store = {
  reset() {
    setState(() => createSeedState());
  },

  setCurrentUser(id: string) {
    setState((s) => ({ ...s, currentUserId: id }));
  },

  setTeamName(name: string) {
    setState((s) => ({ ...s, teamName: name }));
  },

  // Retros
  createRetro(input: {
    title: string;
    sprintLabel?: string;
    participants: string[];
    facilitatorId: string;
  }): string {
    const id = uid("retro");
    setState((s) => ({
      ...s,
      retros: [
        ...s.retros,
        {
          id,
          title: input.title,
          sprintLabel: input.sprintLabel,
          status: "live" as const,
          facilitatorId: input.facilitatorId,
          participants: input.participants,
          createdAt: nowISO(),
        },
      ],
    }));
    return id;
  },

  updateRetro(id: string, patch: Partial<Retro>) {
    setState((s) => ({
      ...s,
      retros: s.retros.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  },

  closeRetro(id: string, summary?: string) {
    setState((s) => ({
      ...s,
      retros: s.retros.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "closed" as RetroStatus,
              closedAt: nowISO(),
              summary: summary ?? r.summary,
            }
          : r,
      ),
    }));
  },

  reopenRetro(id: string) {
    setState((s) => ({
      ...s,
      retros: s.retros.map((r) =>
        r.id === id ? { ...r, status: "live" as RetroStatus, closedAt: undefined } : r,
      ),
    }));
  },

  // Items
  addItem(input: {
    retroId: string;
    columnId: ColumnId;
    content: string;
    authorId: string;
  }): string {
    const id = uid("item");
    setState((s) => ({
      ...s,
      retroItems: [
        ...s.retroItems,
        {
          id,
          retroId: input.retroId,
          columnId: input.columnId,
          content: input.content,
          authorId: input.authorId,
          votes: [],
          createdAt: nowISO(),
        },
      ],
    }));
    return id;
  },

  updateItem(id: string, patch: Partial<RetroItem>) {
    setState((s) => ({
      ...s,
      retroItems: s.retroItems.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  },

  deleteItem(id: string) {
    setState((s) => ({
      ...s,
      retroItems: s.retroItems.filter((i) => i.id !== id),
      // Also unlink any action that pointed at it.
      actions: s.actions.map((a) =>
        a.sourceItemId === id ? { ...a, sourceItemId: undefined } : a,
      ),
    }));
  },

  toggleVote(itemId: string, memberId: string) {
    setState((s) => ({
      ...s,
      retroItems: s.retroItems.map((i) => {
        if (i.id !== itemId) return i;
        const has = i.votes.includes(memberId);
        return {
          ...i,
          votes: has ? i.votes.filter((v) => v !== memberId) : [...i.votes, memberId],
        };
      }),
    }));
  },

  moveItem(id: string, columnId: ColumnId) {
    setState((s) => ({
      ...s,
      retroItems: s.retroItems.map((i) => (i.id === id ? { ...i, columnId } : i)),
    }));
  },

  // Actions
  createAction(input: {
    title: string;
    detail?: string;
    ownerId: string;
    dueDate: string;
    retroId: string;
    sourceItemId?: string;
    byId: string;
  }): string {
    const id = uid("action");
    const now = nowISO();
    setState((s) => {
      const action: ActionItem = {
        id,
        title: input.title,
        detail: input.detail,
        ownerId: input.ownerId,
        dueDate: input.dueDate,
        status: "open",
        retroId: input.retroId,
        sourceItemId: input.sourceItemId,
        createdAt: now,
        updatedAt: now,
        carriedOverCount: 0,
        history: [{ at: now, type: "created", byId: input.byId }],
        nudges: [],
      };
      return {
        ...s,
        actions: [...s.actions, action],
        retroItems: input.sourceItemId
          ? s.retroItems.map((i) =>
              i.id === input.sourceItemId ? { ...i, linkedActionId: id } : i,
            )
          : s.retroItems,
      };
    });
    return id;
  },

  updateActionStatus(id: string, to: ActionStatus, byId: string, note?: string) {
    const now = nowISO();
    setState((s) => ({
      ...s,
      actions: s.actions.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          status: to,
          updatedAt: now,
          history: [
            ...a.history,
            { at: now, type: "status", from: a.status, to, byId, note },
          ],
        };
      }),
    }));
  },

  updateAction(id: string, patch: Partial<ActionItem>, byId: string) {
    const now = nowISO();
    setState((s) => ({
      ...s,
      actions: s.actions.map((a) => {
        if (a.id !== id) return a;
        const history = [...a.history];
        if (patch.ownerId && patch.ownerId !== a.ownerId) {
          history.push({
            at: now,
            type: "owner",
            from: a.ownerId,
            to: patch.ownerId,
            byId,
          });
        }
        if (patch.dueDate && patch.dueDate !== a.dueDate) {
          history.push({
            at: now,
            type: "due",
            from: a.dueDate,
            to: patch.dueDate,
            byId,
          });
        }
        if (
          (patch.title && patch.title !== a.title) ||
          (patch.detail !== undefined && patch.detail !== a.detail)
        ) {
          history.push({ at: now, type: "edited", byId });
        }
        return { ...a, ...patch, updatedAt: now, history };
      }),
    }));
  },

  carryOver(actionId: string, toRetroId: string, byId: string) {
    const now = nowISO();
    setState((s) => ({
      ...s,
      actions: s.actions.map((a) =>
        a.id === actionId
          ? {
              ...a,
              retroId: toRetroId,
              carriedOverCount: a.carriedOverCount + 1,
              updatedAt: now,
              history: [
                ...a.history,
                {
                  at: now,
                  type: "carried",
                  byId,
                  note: `Carried into new retro.`,
                },
              ],
            }
          : a,
      ),
    }));
  },

  addNudge(actionId: string, byId: string, message: string) {
    const now = nowISO();
    setState((s) => ({
      ...s,
      actions: s.actions.map((a) =>
        a.id === actionId
          ? {
              ...a,
              nudges: [...a.nudges, { at: now, byId, message }],
              history: [...a.history, { at: now, type: "nudge", byId, note: message }],
            }
          : a,
      ),
    }));
  },

  addComment(actionId: string, byId: string, note: string) {
    const now = nowISO();
    setState((s) => ({
      ...s,
      actions: s.actions.map((a) =>
        a.id === actionId
          ? {
              ...a,
              updatedAt: now,
              history: [...a.history, { at: now, type: "comment", byId, note }],
            }
          : a,
      ),
    }));
  },

  deleteAction(id: string) {
    setState((s) => ({
      ...s,
      actions: s.actions.filter((a) => a.id !== id),
      retroItems: s.retroItems.map((i) =>
        i.linkedActionId === id ? { ...i, linkedActionId: undefined } : i,
      ),
    }));
  },
};

export { todayISO };
