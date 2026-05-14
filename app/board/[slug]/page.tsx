"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  getActiveRetro,
  getCurrentMember,
  getCurrentTeam,
  getTeamBySlug,
  isScrumMaster,
  store,
  useAppState,
  useHydrateStore,
} from "@/lib/store";
import {
  COLUMN_META,
  JIRA_STATUS_META,
  type Action,
  type Column,
  type JiraStatus,
  type RetroItem,
  type SprintNote,
  type Team,
  type TeamMember,
} from "@/lib/types";
import { formatRelative } from "@/lib/date";
import { aiCheckSimilarity, aiCheckVagueness } from "@/lib/ai/client";
import { cn } from "@/lib/cn";

const ITEM_MIME = "application/x-retro-item";
const NOTE_MIME = "application/x-retro-note";
const SHORT_NOTE_THRESHOLD = 50;

export default function BoardBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  useHydrateStore();
  const { slug: rawSlug } = use(params);
  const slug = decodeURIComponent(rawSlug).toLowerCase();

  const team = useAppState((s) => getTeamBySlug(s, slug));
  const currentTeam = useAppState(getCurrentTeam);
  const currentMember = useAppState(getCurrentMember);
  const router = useRouter();

  // Whenever the URL slug differs from the active team, switch (or clear) so
  // selectors (active retro, members, etc.) reflect this URL.
  useEffect(() => {
    if (team) {
      if (currentTeam?.id !== team.id) {
        store.setCurrentTeam(team.id);
      }
    } else if (currentTeam) {
      // URL points to an unknown team — leave the previous selection alone;
      // the JoinPanel below will let the user create/join.
    }
  }, [team, currentTeam]);

  const isMemberOfThisTeam =
    !!team && !!currentMember && currentMember.teamId === team.id;

  if (!team || !isMemberOfThisTeam) {
    return <JoinPanel slug={slug} existingTeam={team} />;
  }

  return <BoardView team={team} member={currentMember!} />;
}

// ─── Join panel for non-members ─────────────────────────────────────────────

function JoinPanel({
  slug,
  existingTeam,
}: {
  slug: string;
  existingTeam?: Team;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const teams = useAppState((s) => s.teams);

  // If the user is signed in to a different team in this browser, give them
  // a way to switch identities without losing data.
  const otherTeam = useAppState(getCurrentTeam);
  const otherMember = useAppState(getCurrentMember);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = store.joinTeamBySlug({
      slug,
      memberName: name.trim(),
      teamNameFallback: existingTeam?.name,
    });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.replace(`/board/${result.team.slug}`);
  };

  // Suggested team name if the team is brand new in this browser.
  const teamName =
    existingTeam?.name ?? prettifySlug(slug);

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <form
        onSubmit={submit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
            <Users className="size-4" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{teamName}</h1>
            <p className="font-mono text-[11px] text-slate-500">/board/{slug}</p>
          </div>
        </div>

        {!existingTeam ? (
          <div className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Bu tarayıcıda <code>/{slug}</code> adlı takımı ilk sen görüyorsun.
            İsmini gir, takım panosuna düş.
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            Takıma katılmak için ismini gir.
          </p>
        )}

        <label className="mt-5 block">
          <span className="text-xs font-medium text-slate-700">Senin ismin</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ör. Mehmet"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        {error ? (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          Katıl <ArrowRight className="size-4" />
        </button>

        {otherTeam && otherMember && otherTeam.slug !== slug ? (
          <p className="mt-4 text-center text-[11px] text-slate-500">
            Bu tarayıcıda <strong>{otherMember.name}</strong> olarak{" "}
            <a
              href={`/board/${otherTeam.slug}`}
              className="text-indigo-600 hover:underline"
            >
              {otherTeam.name}
            </a>{" "}
            takımındasın.
          </p>
        ) : teams.length > 0 ? null : null}
      </form>
    </div>
  );
}

function prettifySlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
}

// ─── Main board view ────────────────────────────────────────────────────────

function BoardView({ team, member }: { team: Team; member: TeamMember }) {
  const retro = useAppState(getActiveRetro);
  const allItems = useAppState((s) => s.items);
  const allActions = useAppState((s) => s.actions);
  const notes = useAppState((s) => s.notes);
  const retros = useAppState((s) => s.retros);
  const members = useAppState((s) => s.members);
  const sm = useAppState(isScrumMaster);
  const router = useRouter();

  if (!retro) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center">
        <h1 className="text-xl font-semibold">Aktif retro yok.</h1>
        <p className="mt-2 text-sm text-slate-600">
          Geçmiş sekmesine bakabilir veya demo&apos;yu sıfırlayabilirsin.
        </p>
      </div>
    );
  }

  const teamItems = allItems.filter((i) => {
    const r = retros.find((x) => x.id === i.retroId);
    return r?.teamId === team.id;
  });
  const teamNotes = notes.filter((n) => n.teamId === team.id);
  const teamActions = allActions.filter((a) => {
    const r = retros.find((x) => x.id === a.retroId);
    return r?.teamId === team.id;
  });

  const items = teamItems.filter((i) => i.retroId === retro.id);
  const pastRetroIds = new Set(
    retros
      .filter((r) => r.teamId === team.id && r.id !== retro.id)
      .map((r) => r.id),
  );
  const pastItems = teamItems.filter((i) => pastRetroIds.has(i.retroId));

  const openActions = teamActions.filter((a) => a.status !== "done");
  const oldestOpenDays = openActions.length
    ? Math.max(
        ...openActions.map((a) => {
          const d = new Date(a.createdAt.slice(0, 10));
          return Math.round((Date.now() - d.getTime()) / 86_400_000);
        }),
      )
    : 0;
  const activeNotes = teamNotes.filter((n) => !n.movedToRetro);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Aktif retro · {team.name}
          </div>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
            {retro.sprintName} Retro
          </h1>
        </div>
        {sm ? (
          <button
            onClick={() => {
              const retroActionCount = teamActions.filter(
                (a) => a.retroId === retro.id,
              ).length;
              const confirmMsg = retroActionCount
                ? `Bu retroyu kapatmak istediğine emin misin? ${retroActionCount} aksiyon Aksiyonlar ekranına taşınacak.`
                : "Bu retroyu aksiyon olmadan kapatmak istediğine emin misin?";
              if (window.confirm(confirmMsg)) {
                store.closeRetro(retro.id);
                router.push("/actions");
              }
            }}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Retroyu Kapat
          </button>
        ) : null}
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

      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
        <NotesSidebar
          notes={activeNotes}
          members={members}
          onDismiss={(id) => store.deleteNote(id)}
          onAdd={(text) => store.addNote(text)}
          onItemDropped={(itemId) => store.demoteItemToNote(itemId)}
        />
        <Board
          retroId={retro.id}
          items={items}
          pastItems={pastItems}
          members={members}
          teamActions={teamActions}
          currentUserId={member.id}
        />
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
  members,
  onDismiss,
  onAdd,
  onItemDropped,
}: {
  notes: SprintNote[];
  members: TeamMember[];
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
          İyi Gitti veya Kötü Gitti kolonlarına sürükleyebilirsin.
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
                author={members.find((m) => m.id === n.authorId)?.name ?? "—"}
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
  author,
  onDismiss,
}: {
  note: SprintNote;
  author: string;
  onDismiss: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const tooShort = note.text.trim().length < SHORT_NOTE_THRESHOLD;

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
        "overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-sm cursor-grab active:cursor-grabbing",
        dragging && "opacity-50",
      )}
    >
      <div className="px-3 py-2">
        <p className="text-slate-900">{note.text}</p>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {author} · {formatRelative(note.createdAt)}
          </span>
          <button
            onClick={onDismiss}
            className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
            title="Notu sil"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>
      {tooShort ? (
        <div className="flex items-start gap-1.5 border-t border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-900">
          <Sparkles className="mt-0.5 size-3 shrink-0 text-amber-600" />
          <span>
            <span className="font-semibold">AI:</span> Bu not biraz kısa, biraz
            daha bağlam ekler misin?
          </span>
        </div>
      ) : null}
    </li>
  );
}

// ─── Kanban board ───────────────────────────────────────────────────────────

function Board({
  retroId,
  items,
  pastItems,
  members,
  teamActions,
  currentUserId,
}: {
  retroId: string;
  items: RetroItem[];
  pastItems: RetroItem[];
  members: TeamMember[];
  teamActions: Action[];
  currentUserId: string;
}) {
  const cols: Column[] = ["glad", "sad", "action"];
  const [highlight, setHighlight] = useState<Set<string> | null>(null);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <AiNotesColumn actions={teamActions} />
      {cols.map((c) => (
        <BoardColumn
          key={c}
          column={c}
          retroId={retroId}
          items={items.filter((i) => i.column === c)}
          pastItems={pastItems}
          allItems={items}
          members={members}
          teamActions={teamActions}
          currentUserId={currentUserId}
          highlight={highlight}
          setHighlight={setHighlight}
        />
      ))}
    </div>
  );
}

function AiNotesColumn({ actions }: { actions: Action[] }) {
  // "Auto-fed from Jira": every action that has a jiraKey shows up here as a
  // synced Jira issue. The user perceives this as a real-time Jira sync.
  const jiraActions = useMemo(
    () =>
      actions
        .filter((a) => a.jiraKey && a.jiraStatus)
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [actions],
  );

  return (
    <section className="flex flex-col rounded-lg border border-violet-200 bg-white">
      <div className="rounded-t-lg border-b border-violet-200 bg-gradient-to-br from-violet-50 to-white px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-flex size-5 items-center justify-center rounded bg-violet-600 text-white">
            <Bot className="size-3" />
          </span>
          AI Notes
          <span className="ml-auto text-xs font-normal text-slate-500">
            {jiraActions.length}
          </span>
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Jira&apos;dan otomatik senkron · canlı
        </p>
      </div>

      <div className="flex-1 space-y-2 px-3 py-3">
        {jiraActions.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
            Henüz Jira görevi yok.
          </div>
        ) : (
          jiraActions.map((a) => (
            <JiraNoteCard key={a.id} action={a} />
          ))
        )}
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-emerald-500" />
          Sync etkin
        </span>
        <span>RetroCell ↔ Jira</span>
      </div>
    </section>
  );
}

function JiraNoteCard({ action }: { action: Action }) {
  const status = action.jiraStatus as JiraStatus;
  const meta = JIRA_STATUS_META[status];
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-mono font-semibold text-slate-700">
          {action.jiraKey}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            meta.bg,
            meta.text,
          )}
        >
          <span className={cn("size-1.5 rounded-full", meta.dot)} />
          {meta.label}
        </span>
      </div>
      <p className="mt-1 text-sm leading-snug text-slate-900">
        {action.title}
      </p>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="size-3 text-violet-500" />
          AI yakaladı
        </span>
        <span>{formatRelative(action.createdAt)}</span>
      </div>
    </div>
  );
}

function BoardColumn({
  column,
  retroId,
  items,
  pastItems,
  allItems,
  members,
  teamActions,
  currentUserId,
  highlight,
  setHighlight,
}: {
  column: Column;
  retroId: string;
  items: RetroItem[];
  pastItems: RetroItem[];
  allItems: RetroItem[];
  members: TeamMember[];
  teamActions: Action[];
  currentUserId: string;
  highlight: Set<string> | null;
  setHighlight: (s: Set<string> | null) => void;
}) {
  const meta = COLUMN_META[column];
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Notes can be dropped onto glad/sad, never onto action — actions are
  // generated from a card via the explicit button.
  const acceptsNotes = column !== "action";

  const onDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    const hasItem = types.includes(ITEM_MIME);
    const hasNote = types.includes(NOTE_MIME);
    if (!hasItem && (!hasNote || !acceptsNotes)) return;
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
    if (!acceptsNotes) return;
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
    const id = store.addItem({ retroId, column, text });
    setDraft("");
    const [sim, vag] = await Promise.all([
      aiCheckSimilarity(text, pastItems),
      aiCheckVagueness(text),
    ]);
    const patch: Partial<RetroItem> = {};
    if (sim.data.match) {
      patch.similarToItemId = sim.data.similarItemId;
      patch.similarReason = sim.data.reason;
      if (sim.data.flag === "tczb") {
        patch.flagTczb = true;
        const linkedAction = sim.data.similarItemId
          ? teamActions.find((a) => a.sourceItemId === sim.data.similarItemId)
          : undefined;
        if (linkedAction) patch.pastDiscussionActionId = linkedAction.id;
      }
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
                members={members}
                teamActions={teamActions}
                currentUserId={currentUserId}
                highlight={highlight}
                setHighlight={setHighlight}
              />
            ))
        )}
      </div>

      <form
        onSubmit={onAdd}
        className="flex items-center gap-2 border-t border-slate-200 px-3 py-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Kart ekle…"
          disabled={pending}
          className="flex-1 min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!draft.trim() || pending}
          aria-label="Kart ekle"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="size-4" />
        </button>
      </form>
    </section>
  );
}

// ─── Individual sticky-card ─────────────────────────────────────────────────

function ItemCard({
  item,
  allItems,
  members,
  teamActions,
  currentUserId,
  highlight,
  setHighlight,
}: {
  item: RetroItem;
  allItems: RetroItem[];
  members: TeamMember[];
  teamActions: Action[];
  currentUserId: string;
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
  const tczbAction = useMemo(() => {
    if (!item.flagTczb) return undefined;
    if (item.pastDiscussionActionId)
      return teamActions.find((a) => a.id === item.pastDiscussionActionId);
    if (item.similarToItemId)
      return teamActions.find((a) => a.sourceItemId === item.similarToItemId);
    return undefined;
  }, [
    item.flagTczb,
    item.pastDiscussionActionId,
    item.similarToItemId,
    teamActions,
  ]);

  const authorName =
    members.find((m) => m.id === item.authorId)?.name ?? "—";
  const isOwn = item.authorId === currentUserId;

  const linkedId = useMemo(() => {
    if (item.sourceItemId) return item.sourceItemId;
    const derived = allItems.find((i) => i.sourceItemId === item.id);
    return derived?.id;
  }, [item.id, item.sourceItemId, allItems]);

  const hasAction =
    item.column !== "action" &&
    allItems.some((i) => i.sourceItemId === item.id);

  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const editRef = useRef<HTMLTextAreaElement | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [actionDraft, setActionDraft] = useState("");
  const promoteRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) {
      editRef.current?.focus();
      editRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (promoting) {
      setActionDraft(item.text);
      promoteRef.current?.focus();
      promoteRef.current?.select();
    }
  }, [promoting, item.text]);

  const onDragStart = (e: React.DragEvent) => {
    if (editing) {
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

  const openPromoteInput = () => {
    if (hasAction || promoting) return;
    setActionDraft(item.text);
    setPromoting(true);
  };

  const submitPromote = (e: React.FormEvent) => {
    e.preventDefault();
    const title = actionDraft.trim();
    if (!title) return;
    store.promoteItemToAction(item.id, title);
    setPromoting(false);
    setActionDraft("");
  };

  const cancelPromote = () => {
    setPromoting(false);
    setActionDraft("");
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
      draggable={!editing}
      onDragStart={onDragStart}
      onDragEnd={() => setDragging(false)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "rounded-md border border-slate-200 bg-white transition-opacity",
        editing ? "cursor-text" : "cursor-grab active:cursor-grabbing",
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
            onDoubleClick={() => {
              if (isOwn) setEditing(true);
            }}
            className="text-sm leading-snug text-slate-900"
          >
            {item.text}
          </p>
        )}

        <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {authorName} · {formatRelative(item.createdAt)}
          </span>
          <div className="flex items-center gap-0.5">
            {!editing ? (
              <>
                {isOwn ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Düzenle"
                  >
                    <Pencil className="size-3" />
                  </button>
                ) : null}
                {item.column !== "action" && !hasAction ? (
                  <button
                    onClick={openPromoteInput}
                    className={cn(
                      "inline-flex h-5 items-center gap-0.5 rounded px-1.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50",
                      promoting && "bg-indigo-50",
                    )}
                    title="Aksiyona dönüştür"
                  >
                    Aksiyon
                    <ArrowRight className="size-3" />
                  </button>
                ) : null}
                {isOwn ? (
                  <button
                    onClick={() => store.deleteItem(item.id)}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Sil"
                  >
                    <Trash2 className="size-3" />
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {promoting ? (
        <form
          onSubmit={submitPromote}
          className="border-t border-indigo-200 bg-indigo-50/60 px-3 py-2"
        >
          <label className="text-[10px] font-medium uppercase tracking-wider text-indigo-700">
            Aksiyon başlığı
          </label>
          <div className="mt-1 flex items-center gap-1">
            <input
              ref={promoteRef}
              value={actionDraft}
              onChange={(e) => setActionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelPromote();
                }
              }}
              placeholder="Atılacak somut adım…"
              className="flex-1 rounded-md border border-indigo-200 bg-white px-2 py-1 text-xs outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!actionDraft.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              Taşı
              <ArrowRight className="size-3" />
            </button>
            <button
              type="button"
              onClick={cancelPromote}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              title="Vazgeç"
            >
              <X className="size-3" />
            </button>
          </div>
        </form>
      ) : null}

      {item.flagTczb && item.similarReason ? (
        <div className="border-t-2 border-violet-500 bg-violet-50 px-3 py-2 text-[12px] text-violet-900">
          <div className="flex items-start gap-2">
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded bg-violet-600 text-white">
              <Bot className="size-3" />
            </span>
            <div className="leading-snug">
              <p className="font-semibold">
                LLM uyarısı &middot; tczb işareti
              </p>
              <p className="mt-0.5">{item.similarReason}</p>
            </div>
          </div>
          {similar ? (
            <div className="mt-2 rounded-md border border-violet-200 bg-white px-2 py-1.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-violet-700">
                Geçmiş kart
              </div>
              <p className="mt-0.5 text-slate-800">&ldquo;{similar.text}&rdquo;</p>
            </div>
          ) : null}
          {tczbAction ? (
            <div className="mt-2 rounded-md border border-violet-200 bg-white px-2 py-1.5">
              <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider">
                <span className="text-violet-700">Bu karttan çıkan aksiyon</span>
                {tczbAction.jiraKey ? (
                  <span className="font-mono text-slate-500">
                    {tczbAction.jiraKey}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-slate-800">{tczbAction.title}</p>
            </div>
          ) : null}
        </div>
      ) : item.similarReason ? (
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
