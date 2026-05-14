"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ACTION_STATUS_META, type ActionStatus } from "@/lib/types";
import { daysAgo } from "@/lib/date";
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

export default function ActionsPage() {
  const team = useAppState(getCurrentTeam);
  const sm = useAppState(isScrumMaster);
  const currentUserId = useAppState((s) => s.currentUserId);
  const allActions = useAppState((s) => s.actions);
  const retros = useAppState((s) => s.retros);
  const members = useAppState((s) => s.members);
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aksiyonlar</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            {team.name} takımının tüm retrolarından çıkan kararlar.
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

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Başlık</th>
              <th className="px-4 py-2 font-medium">Sahip</th>
              <th className="px-4 py-2 font-medium">Durum</th>
              <th className="px-4 py-2 font-medium">Açık gün</th>
              <th className="px-4 py-2 font-medium">Hangi retro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
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
                const meta = ACTION_STATUS_META[a.status];
                const canChange = sm || a.ownerId === currentUserId;
                return (
                  <tr
                    key={a.id}
                    className={cn(
                      "border-l-4",
                      overdue
                        ? "border-l-rose-500 bg-rose-50/40"
                        : "border-l-transparent",
                    )}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {a.title}
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
        30+ gündür açık olanlar kırmızı.
      </p>
    </div>
  );
}

