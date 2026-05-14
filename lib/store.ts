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
} from "./types";

const STORAGE_KEY = "retro-tracker.v2";

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
      if (parsed?.retros && parsed?.items && parsed?.actions && parsed?.notes) {
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

export function getActiveRetro(s: AppState): Retro | undefined {
  return s.retros.find((r) => r.status === "active");
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
    return !!r && r.date < target.date;
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export const store = {
  reset() {
    setState(() => createSeedState());
  },

  // Items
  addItem(input: {
    retroId: string;
    column: Column;
    text: string;
    author: string;
    similarToItemId?: string;
    similarReason?: string;
    isVague?: boolean;
    vagueQuestion?: string;
  }): string {
    const id = uid("item");
    setState((s) => ({
      ...s,
      items: [
        ...s.items,
        {
          id,
          retroId: input.retroId,
          column: input.column,
          text: input.text,
          author: input.author,
          createdAt: nowISO(),
          similarToItemId: input.similarToItemId,
          similarReason: input.similarReason,
          isVague: input.isVague,
          vagueQuestion: input.vagueQuestion,
        },
      ],
    }));
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

  // Actions
  promoteItemToAction(itemId: string, title?: string): string | undefined {
    let newId: string | undefined;
    setState((s) => {
      const item = s.items.find((i) => i.id === itemId);
      if (!item) return s;
      const finalTitle = (title?.trim() || item.text).slice(0, 200);
      newId = uid("action");
      const action: Action = {
        id: newId,
        retroId: item.retroId,
        title: finalTitle,
        owner: s.currentUser,
        status: "open",
        createdAt: nowISO(),
        sourceItemId: item.id,
      };
      const boardActionItem: RetroItem = {
        id: uid("item"),
        retroId: item.retroId,
        column: "action",
        text: finalTitle,
        author: s.currentUser,
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
      const note: SprintNote = {
        id: uid("note"),
        text: item.text,
        author: item.author,
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

  // Sprint notes
  addNote(text: string) {
    setState((s) => ({
      ...s,
      notes: [
        {
          id: uid("note"),
          text,
          author: s.currentUser,
          createdAt: nowISO(),
          movedToRetro: false,
        },
        ...s.notes,
      ],
    }));
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
        author: note.author,
        createdAt: nowISO(),
      };
      return {
        ...s,
        items: [...s.items, newItem],
        notes: s.notes.map((n) => (n.id === noteId ? { ...n, movedToRetro: true } : n)),
      };
    });
  },

  deleteNote(id: string) {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }));
  },

  // Retro lifecycle
  closeRetro(id: string, summary?: string) {
    setState((s) => ({
      ...s,
      retros: s.retros.map((r) =>
        r.id === id ? { ...r, status: "closed", summary: summary ?? r.summary } : r,
      ),
    }));
  },
};

export type { Action, ActionStatus, AppState, Column, Retro, RetroItem, SprintNote };
