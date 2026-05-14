"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { getActiveRetro, store, useAppState } from "@/lib/store";
import {
  COLUMN_META,
  type Column,
  type RetroItem,
  type SprintNote,
} from "@/lib/types";
import { daysAgo, formatRelative } from "@/lib/date";
import { aiCheckSimilarity, aiCheckVagueness } from "@/lib/ai/client";
import { cn } from "@/lib/cn";

const ITEM_MIME = "application/x-retro-item";
const NOTE_MIME = "application/x-retro-note";

export default function RetroBoardPage() {
  const retro = useAppState(getActiveRetro);
  const allItems = useAppState((s) => s.items);
  const allActions = useAppState((s) => s.actions);
  const notes = useAppState((s) => s.notes);
  const retros = useAppState((s) => s.retros);

  if (!retro) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Aktif retro yok.</h1>
        <p className="mt-2 text-sm text-slate-600">
          Geçmiş sekmesine bak ya da demo&apos;yu sıfırla.
        </p>
      </div>
    );
  }

  const items = allItems.filter((i) => i.retroId === retro.id);
  const pastRetroIds = new Set(
    retros.filter((r) => r.id !== retro.id).map((r) => r.id),
  );
  const pastItems = allItems.filter((i) => pastRetroIds.has(i.retroId));

  const openActions = allActions.filter((a) => a.status !== "done");
  const oldestOpenDays = openActions.length
    ? Math.max(...openActions.map((a) => daysAgo(a.createdAt)))
    : 0;
  const activeNotes = notes.filter((n) => !n.movedToRetro);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Aktif retro
          </div>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
            {retro.sprintName} Retro
          </h1>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Bu retroyu kapatmak istediğine emin misin?")) {
              store.closeRetro(retro.id);
            }
          }}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Retroyu Kapat
        </button>
      </header>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Açık Aksiyon"
          value={openActions.length}
          tone={openActions.length >= 3 ? "danger" : "default"}
        />
        <StatCard
          label="En Eski Aksiyon"
          value={oldestOpenDays ? `${oldestOpenDays} gün` : "—"}
          tone={oldestOpenDays >= 30 ? "danger" : "default"}
        />
        <StatCard label="Bu Retrodaki Kart" value={items.length} />
      </section>

      <div className="mt-5 grid gap-4 lg:grid-cols-[300px_1fr]">
        <NotesSidebar
          notes={activeNotes}
          onDismiss={(id) => store.deleteNote(id)}
          onAdd={(text) => store.addNote(text)}
          onItemDropped={(itemId) => store.demoteItemToNote(itemId)}
        />
        <Board retroId={retro.id} items={items} pastItems={pastItems} />
      </div>
    </div>
  );
}

// ─── Dashboard stat card ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white px-4 py-3",
        tone === "danger" ? "border-rose-200" : "border-slate-200",
      )}
    >
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-semibold",
          tone === "danger" ? "text-rose-700" : "text-slate-900",
        )}
      >
        {value}
      </div>
    </div>
  );
}

// ─── Sprint notes sidebar ───────────────────────────────────────────────────

function NotesSidebar({
  notes,
  onDismiss,
  onAdd,
  onItemDropped,
}: {
  notes: SprintNote[];
  onDismiss: (id: string) => void;
  onAdd: (text: string) => void;
  onItemDropped: (itemId: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const onDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(ITEM_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dragOver) setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    const payload = e.dataTransfer.getData(ITEM_MIME);
    setDragOver(false);
    if (!payload) return;
    e.preventDefault();
    try {
      const { id } = JSON.parse(payload) as { id: string };
      onItemDropped(id);
    } catch {
      /* ignore */
    }
  };

  return (
    <aside
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "rounded-lg border border-slate-200 bg-white transition-colors",
        dragOver && "ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-50",
      )}
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">Sprint Notları</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Sürükleyip kolonlara taşıyabilirsin.
        </p>
      </div>

      <div className="max-h-[420px] overflow-auto px-3 py-2">
        {notes.length === 0 ? (
          <div className="px-1 py-6 text-center text-xs text-slate-400">
            Şu an boş.
          </div>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <NoteRow
                key={n.id}
                note={n}
                onDismiss={() => onDismiss(n.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = draft.trim();
          if (!t) return;
          onAdd(t);
          setDraft("");
        }}
        className="flex items-center gap-1 border-t border-slate-200 px-3 py-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Yeni not..."
          className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-400"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-2 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          Ekle
        </button>
      </form>
    </aside>
  );
}

function NoteRow({
  note,
  onDismiss,
}: {
  note: SprintNote;
  onDismiss: () => void;
}) {
  const [dragging, setDragging] = useState(false);

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(NOTE_MIME, JSON.stringify({ id: note.id }));
    setDragging(true);
  };

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={() => setDragging(false)}
      className={cn(
        "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm cursor-grab active:cursor-grabbing",
        dragging && "opacity-50",
      )}
    >
      <p className="text-slate-900">{note.text}</p>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
        <span>
          {note.author} · {formatRelative(note.createdAt)}
        </span>
        <button
          onClick={onDismiss}
          className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          title="Notu sil"
        >
          <X className="size-3" />
        </button>
      </div>
    </li>
  );
}

// ─── Kanban board ───────────────────────────────────────────────────────────

function Board({
  retroId,
  items,
  pastItems,
}: {
  retroId: string;
  items: RetroItem[];
  pastItems: RetroItem[];
}) {
  const cols: Column[] = ["glad", "sad", "action"];
  // When a card with a relationship is hovered, keep only `{itemId, linkedId}` bright.
  const [highlight, setHighlight] = useState<Set<string> | null>(null);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cols.map((c) => (
        <BoardColumn
          key={c}
          column={c}
          retroId={retroId}
          items={items.filter((i) => i.column === c)}
          pastItems={pastItems}
          allItems={items}
          highlight={highlight}
          setHighlight={setHighlight}
        />
      ))}
    </div>
  );
}

function BoardColumn({
  column,
  retroId,
  items,
  pastItems,
  allItems,
  highlight,
  setHighlight,
}: {
  column: Column;
  retroId: string;
  items: RetroItem[];
  pastItems: RetroItem[];
  allItems: RetroItem[];
  highlight: Set<string> | null;
  setHighlight: (s: Set<string> | null) => void;
}) {
  const meta = COLUMN_META[column];
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const onDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (!types.includes(ITEM_MIME) && !types.includes(NOTE_MIME)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!dragOver) setDragOver(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const itemPayload = e.dataTransfer.getData(ITEM_MIME);
    if (itemPayload) {
      try {
        const { id, from } = JSON.parse(itemPayload) as { id: string; from: Column };
        if (from !== column) store.moveItem(id, column);
      } catch {
        /* ignore */
      }
      return;
    }
    const notePayload = e.dataTransfer.getData(NOTE_MIME);
    if (notePayload) {
      try {
        const { id } = JSON.parse(notePayload) as { id: string };
        store.moveNoteToRetro(id, retroId, column);
      } catch {
        /* ignore */
      }
    }
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setPending(true);
    const id = store.addItem({
      retroId,
      column,
      text,
      author: "Ayşe",
    });
    setDraft("");
    const [sim, vag] = await Promise.all([
      aiCheckSimilarity(text, pastItems),
      aiCheckVagueness(text),
    ]);
    const patch: Partial<RetroItem> = {};
    if (sim.data.match) {
      patch.similarToItemId = sim.data.similarItemId;
      patch.similarReason = sim.data.reason;
    }
    if (!vag.data.clear) {
      patch.isVague = true;
      patch.vagueQuestion = vag.data.question;
    }
    if (Object.keys(patch).length) store.updateItem(id, patch);
    setPending(false);
  };

  return (
    <section
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex flex-col rounded-lg border bg-white transition-colors",
        meta.border,
        dragOver && "ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-50",
      )}
    >
      <div className={cn("rounded-t-lg border-b px-4 py-3", meta.bg, meta.border)}>
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span>{meta.emoji}</span>
          {meta.title}
          <span className="ml-auto text-xs font-normal text-slate-500">
            {items.length}
          </span>
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">{meta.subtitle}</p>
      </div>

      <div className="flex-1 space-y-2 px-3 py-3">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
            Boş
          </div>
        ) : (
          items
            .slice()
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                allItems={[...allItems, ...pastItems]}
                highlight={highlight}
                setHighlight={setHighlight}
              />
            ))
        )}
      </div>

      <form
        onSubmit={onAdd}
        className="flex items-center gap-1 border-t border-slate-200 px-3 py-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="+ Kart ekle..."
          disabled={pending}
          className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || pending}
          className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-30"
        >
          <Plus className="size-3.5" />
        </button>
      </form>
    </section>
  );
}

// ─── Individual sticky-card ─────────────────────────────────────────────────

function ItemCard({
  item,
  allItems,
  highlight,
  setHighlight,
}: {
  item: RetroItem;
  allItems: RetroItem[];
  highlight: Set<string> | null;
  setHighlight: (s: Set<string> | null) => void;
}) {
  const similar = useMemo(
    () =>
      item.similarToItemId
        ? allItems.find((i) => i.id === item.similarToItemId)
        : undefined,
    [item.similarToItemId, allItems],
  );

  // Linked id: either the item this was promoted from, or an action card promoted from this.
  const linkedId = useMemo(() => {
    if (item.sourceItemId) return item.sourceItemId;
    const derived = allItems.find((i) => i.sourceItemId === item.id);
    return derived?.id;
  }, [item.id, item.sourceItemId, allItems]);

  // True when an Aksiyon card has been generated from this item.
  const hasAction =
    item.column !== "action" &&
    allItems.some((i) => i.sourceItemId === item.id);

  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [actionMode, setActionMode] = useState(false);
  const [actionDraft, setActionDraft] = useState(item.text);
  const editRef = useRef<HTMLTextAreaElement | null>(null);
  const actionRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) {
      editRef.current?.focus();
      editRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (actionMode) actionRef.current?.focus();
  }, [actionMode]);

  const onDragStart = (e: React.DragEvent) => {
    if (editing || actionMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      ITEM_MIME,
      JSON.stringify({ id: item.id, from: item.column }),
    );
    setDragging(true);
  };

  const saveEdit = () => {
    const t = editText.trim();
    if (!t) {
      setEditText(item.text);
      setEditing(false);
      return;
    }
    if (t !== item.text) store.updateItem(item.id, { text: t });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditText(item.text);
    setEditing(false);
  };

  const submitAction = () => {
    const t = actionDraft.trim();
    if (!t) return;
    store.promoteItemToAction(item.id, t);
    setActionMode(false);
    setActionDraft(item.text);
  };

  const dimmed = !!highlight && !highlight.has(item.id);

  const onMouseEnter = () => {
    if (!linkedId) return;
    setHighlight(new Set([item.id, linkedId]));
  };
  const onMouseLeave = () => {
    if (highlight) setHighlight(null);
  };

  return (
    <div
      draggable={!editing && !actionMode}
      onDragStart={onDragStart}
      onDragEnd={() => setDragging(false)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "rounded-md border border-slate-200 bg-white transition-opacity",
        editing || actionMode
          ? "cursor-text"
          : "cursor-grab active:cursor-grabbing",
        dragging && "opacity-50",
        dimmed && "opacity-30",
        !!linkedId && !dimmed && highlight && "ring-2 ring-indigo-400",
        hasAction && "border-l-2 border-l-indigo-300",
      )}
    >
      <div className="px-3 py-2">
        {editing ? (
          <textarea
            ref={editRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                saveEdit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelEdit();
              }
            }}
            rows={Math.max(2, Math.ceil(editText.length / 36))}
            className="w-full resize-none rounded border border-indigo-300 bg-white px-2 py-1 text-sm outline-none focus:border-indigo-500"
          />
        ) : (
          <p
            onDoubleClick={() => setEditing(true)}
            className="text-sm leading-snug text-slate-900"
          >
            {item.text}
          </p>
        )}

        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {item.author} · {formatRelative(item.createdAt)}
          </span>
          <div className="flex items-center gap-0.5">
            {!editing && !actionMode ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title="Düzenle"
                >
                  <Pencil className="size-3" />
                </button>
                {item.column !== "action" ? (
                  <button
                    onClick={() => {
                      setActionDraft(item.text);
                      setActionMode(true);
                    }}
                    className="rounded px-1.5 py-0.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
                    title="Aksiyona dönüştür"
                  >
                    → Aksiyon
                  </button>
                ) : null}
                <button
                  onClick={() => store.deleteItem(item.id)}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title="Sil"
                >
                  <Trash2 className="size-3" />
                </button>
              </>
            ) : null}
          </div>
        </div>

        {actionMode ? (
          <div className="mt-2 flex items-center gap-1">
            <input
              ref={actionRef}
              value={actionDraft}
              onChange={(e) => setActionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitAction();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setActionMode(false);
                }
              }}
              placeholder="Aksiyon başlığı..."
              className="flex-1 rounded border border-indigo-300 bg-white px-2 py-1 text-xs outline-none focus:border-indigo-500"
            />
            <button
              onClick={submitAction}
              disabled={!actionDraft.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
              title="Aksiyon oluştur"
            >
              <Check className="size-3" /> Ekle
            </button>
            <button
              onClick={() => setActionMode(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="İptal"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : null}
      </div>

      {item.similarReason ? (
        <div className="flex gap-2 border-t-2 border-amber-500 bg-amber-100 px-3 py-2 text-[12px] text-amber-900">
          <span className="font-semibold">AI:</span>
          <div className="leading-snug">
            <p>{item.similarReason}</p>
            {similar ? (
              <p className="mt-1 italic text-amber-800/80">
                İlgili madde: &ldquo;{similar.text}&rdquo;
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {item.isVague && item.vagueQuestion ? (
        <div className="flex gap-2 border-t-2 border-yellow-500 bg-yellow-50 px-3 py-2 text-[12px] text-yellow-900">
          <span className="font-semibold">AI:</span>
          <p className="leading-snug">{item.vagueQuestion}</p>
        </div>
      ) : null}
    </div>
  );
}
