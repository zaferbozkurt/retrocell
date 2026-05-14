"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, Sparkles, X } from "lucide-react";
import {
  ACTION_STATUS_META,
  JIRA_STATUS_META,
  type Action,
  type ActionStatus,
  type JiraStatus,
} from "@/lib/types";
import { daysAgo, formatDate, nowISO } from "@/lib/date";
import {
  getCurrentTeam,
  isScrumMaster,
  store,
  useAppState,
} from "@/lib/store";
import { cn } from "@/lib/cn";

type Filter = "all" | "open" | "done";

const STATUS_CYCLE: Record<ActionStatus, ActionStatus> = {
  open: "in_progress",
  in_progress: "done",
  done: "open",
};

const TODO_WARNING_DAYS = 30;

const JIRA_ASSIGNEES = ["Samet", "Umutcan", "Zafer", "Nisan"] as const;

export default function ActionsPage() {
  const team = useAppState(getCurrentTeam);
  const sm = useAppState(isScrumMaster);
  const currentUserId = useAppState((s) => s.currentUserId);
  const allActions = useAppState((s) => s.actions);
  const retros = useAppState((s) => s.retros);
  const members = useAppState((s) => s.members);
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [jiraTarget, setJiraTarget] = useState<Action | null>(null);

  useEffect(() => {
    if (!team) router.replace("/");
  }, [team, router]);

  if (!team) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-slate-500">
        Yönlendiriliyor…
      </div>
    );
  }

  const teamRetroIds = new Set(
    retros.filter((r) => r.teamId === team.id).map((r) => r.id),
  );

  const filtered = allActions
    .filter((a) => teamRetroIds.has(a.retroId))
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .filter((a) => {
      if (filter === "all") return true;
      if (filter === "open") return a.status !== "done";
      return a.status === "done";
    });

  const staleTodoCount = allActions.filter(
    (a) =>
      teamRetroIds.has(a.retroId) &&
      a.jiraStatus === "todo" &&
      daysAgo(a.createdAt) >= TODO_WARNING_DAYS,
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aksiyonlar</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            {team.name} takımının tüm retrolarından çıkan kararlar — Jira ile entegre.
          </p>
        </div>
        <div className="flex gap-1 rounded-md border border-slate-200 bg-white p-1">
          {(["all", "open", "done"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded px-3 py-1 text-xs font-medium transition-colors",
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {f === "all" ? "Tümü" : f === "open" ? "Açık" : "Tamamlandı"}
            </button>
          ))}
        </div>
      </header>

      {staleTodoCount > 0 ? (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-600" />
          <div>
            <span className="font-semibold">AI uyarısı:</span>{" "}
            {staleTodoCount} Jira görevi 30 günden uzun süredir <em>To Do</em>
            {" "}durumunda — sahibiyle birlikte kontrol et.
          </div>
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Başlık</th>
              <th className="px-4 py-2 font-medium">Sahip</th>
              <th className="px-4 py-2 font-medium">Durum</th>
              <th className="px-4 py-2 font-medium">Açık gün</th>
              <th className="px-4 py-2 font-medium">Jira</th>
              <th className="px-4 py-2 font-medium">Retro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  Aksiyon yok.
                </td>
              </tr>
            ) : (
              filtered.map((a) => {
                const days = daysAgo(a.createdAt);
                const retro = retros.find((r) => r.id === a.retroId);
                const owner =
                  members.find((m) => m.id === a.ownerId)?.name ?? "—";
                const overdue = a.status !== "done" && days >= 30;
                const jiraTodoStale =
                  a.jiraStatus === "todo" && days >= TODO_WARNING_DAYS;
                const meta = ACTION_STATUS_META[a.status];
                const canChange = sm || a.ownerId === currentUserId;
                return (
                  <tr
                    key={a.id}
                    className={cn(
                      "border-l-4",
                      overdue || jiraTodoStale
                        ? "border-l-rose-500 bg-rose-50/40"
                        : "border-l-transparent",
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{a.title}</span>
                        {jiraTodoStale ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700"
                            title={`${days} gündür To Do durumunda`}
                          >
                            <AlertTriangle className="size-3" />
                            30g+ To Do
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{owner}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (!canChange) return;
                          store.updateActionStatus(a.id, STATUS_CYCLE[a.status]);
                        }}
                        disabled={!canChange}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          meta.bg,
                          meta.text,
                          !canChange && "cursor-not-allowed opacity-60",
                        )}
                        title={
                          canChange
                            ? "Durumu değiştirmek için tıkla"
                            : "Bu aksiyonun sahibi veya scrum master değişiklik yapabilir"
                        }
                      >
                        {meta.label}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-sm",
                          overdue
                            ? "font-semibold text-rose-700"
                            : "text-slate-600",
                        )}
                      >
                        {a.status === "done" ? "—" : `${days} gün`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {a.jiraKey && a.jiraStatus ? (
                        <JiraBadge jiraKey={a.jiraKey} status={a.jiraStatus} />
                      ) : (
                        <button
                          onClick={() => setJiraTarget(a)}
                          className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-white px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          <ExternalLink className="size-3" />
                          Jira Taskı Aç
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {retro?.sprintName ?? "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Durum rozetine tıkla &middot; açık → devam → tamamlandı sırasıyla döner.
        30+ gündür açık olanlar ve Jira&apos;da 30 günden uzun süredir To Do
        kalanlar kırmızı işaretlenir.
      </p>

      {jiraTarget ? (
        <JiraTaskModal
          action={jiraTarget}
          ownerName={
            members.find((m) => m.id === jiraTarget.ownerId)?.name ?? "—"
          }
          sprintName={
            retros.find((r) => r.id === jiraTarget.retroId)?.sprintName ?? "—"
          }
          onClose={() => setJiraTarget(null)}
          onCreated={() => setJiraTarget(null)}
        />
      ) : null}
    </div>
  );
}

function JiraBadge({
  jiraKey,
  status,
}: {
  jiraKey: string;
  status: JiraStatus;
}) {
  const meta = JIRA_STATUS_META[status];
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] font-semibold text-slate-700">
        {jiraKey}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
          meta.bg,
          meta.text,
        )}
      >
        <span className={cn("size-1.5 rounded-full", meta.dot)} />
        {meta.label}
      </span>
    </div>
  );
}

function JiraTaskModal({
  action,
  ownerName,
  sprintName,
  onClose,
  onCreated,
}: {
  action: Action;
  ownerName: string;
  sprintName: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [phase, setPhase] = useState<"draft" | "creating" | "done">("draft");
  const [jiraKey] = useState(
    () => `PIXEL-${String(100 + Math.floor(Math.random() * 900))}`,
  );
  const [assignee, setAssignee] = useState<string>(() => {
    const match = JIRA_ASSIGNEES.find(
      (n) => n.toLowerCase() === ownerName.toLowerCase(),
    );
    return match ?? JIRA_ASSIGNEES[0];
  });
  const today = formatDate(nowISO());

  const onCreate = () => {
    if (phase !== "draft") return;
    setPhase("creating");
    setTimeout(() => {
      store.createJiraTaskForAction(action.id, jiraKey);
      setPhase("done");
      setTimeout(() => onCreated(), 900);
    }, 700);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-br from-indigo-50 to-white px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-indigo-700">
              <Sparkles className="size-3.5" />
              Jira Task Önizleme
            </div>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Yeni Jira görevi oluştur
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Bilgiler retro aksiyonundan otomatik dolduruldu.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 px-5 py-4 text-sm">
          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Project
          </dt>
          <dd className="font-mono text-slate-900">PIXEL</dd>

          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Issue type
          </dt>
          <dd className="text-slate-900">Task</dd>

          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Summary
          </dt>
          <dd className="text-slate-900">{action.title}</dd>

          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Assignee
          </dt>
          <dd>
            <select
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              disabled={phase !== "draft"}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-indigo-400 disabled:opacity-60"
            >
              {JIRA_ASSIGNEES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </dd>

          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Sprint
          </dt>
          <dd className="text-slate-900">{sprintName}</dd>

          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Reporter
          </dt>
          <dd className="text-slate-900">RetroCell Bot</dd>

          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Due
          </dt>
          <dd className="text-slate-900">{today}</dd>

          <dt className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Issue key
          </dt>
          <dd className="font-mono text-slate-900">{jiraKey}</dd>
        </dl>

        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-[11px] text-slate-500">
            {phase === "done"
              ? "Jira'da oluşturuldu."
              : "Oluşturulduğunda aksiyona Jira anahtarı bağlanır."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={phase === "creating"}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              onClick={onCreate}
              disabled={phase !== "draft"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white",
                phase === "done"
                  ? "bg-emerald-600"
                  : "bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60",
              )}
            >
              {phase === "creating" ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Jira&apos;ya gönderiliyor…
                </>
              ) : phase === "done" ? (
                <>
                  <CheckCircle2 className="size-3.5" />
                  Oluşturuldu
                </>
              ) : (
                <>
                  <ExternalLink className="size-3.5" />
                  Create
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
