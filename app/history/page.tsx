"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/date";
import { getCurrentTeam, useAppState } from "@/lib/store";
import type { Action, Retro, RetroItem } from "@/lib/types";

export default function HistoryPage() {
  const team = useAppState(getCurrentTeam);
  const retros = useAppState((s) => s.retros);
  const items = useAppState((s) => s.items);
  const actions = useAppState((s) => s.actions);
  const router = useRouter();

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

  const teamRetros = retros.filter((r) => r.teamId === team.id);
  const teamRetroIds = new Set(teamRetros.map((r) => r.id));
  const teamItems = items.filter((i) => teamRetroIds.has(i.retroId));
  const teamActions = actions.filter((a) => teamRetroIds.has(a.retroId));

  const closed = teamRetros
    .filter((r) => r.status === "closed")
    .sort((a, b) => b.date.localeCompare(a.date));

  const recurring = detectRecurringTheme(teamItems, teamRetros);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Geçmiş & İçgörüler
        </h1>
        <p className="mt-0.5 text-sm text-slate-600">
          {team.name} takımının önceki retroları ve tekrar eden konular.
        </p>
      </header>

      {recurring ? (
        <div className="mt-5 flex gap-3 rounded-lg border-2 border-rose-300 bg-rose-50 p-4">
          <AlertTriangle className="size-5 shrink-0 text-rose-600" />
          <div className="text-sm">
            <div className="font-semibold text-rose-900">AI Tespiti</div>
            <p className="mt-1 leading-relaxed text-rose-900/90">{recurring}</p>
          </div>
        </div>
      ) : null}

      <section className="mt-5 grid gap-3 md:grid-cols-2">
        {closed.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500 md:col-span-2">
            Henüz kapatılmış retro yok.
          </div>
        ) : (
          closed.map((r) => (
            <RetroCard
              key={r.id}
              retro={r}
              items={teamItems.filter((i) => i.retroId === r.id)}
              actions={teamActions.filter((a) => a.retroId === r.id)}
            />
          ))
        )}
      </section>
    </div>
  );
}

function RetroCard({
  retro,
  items,
  actions,
}: {
  retro: Retro;
  items: RetroItem[];
  actions: Action[];
}) {
  const total = actions.length;
  const done = actions.filter((a) => a.status === "done").length;
  const rate = total ? Math.round((done / total) * 100) : 0;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">
          {retro.sprintName}
        </h2>
        <span className="text-xs text-slate-500">{formatDate(retro.date)}</span>
      </div>

      {retro.summary ? (
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          {retro.summary}
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <Mini label="Kart" value={items.length} />
        <Mini label="Aksiyon" value={total} />
        <Mini
          label="Kapanma"
          value={`%${rate}`}
          tone={rate >= 70 ? "good" : rate >= 40 ? "warn" : "bad"}
        />
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={
            rate >= 70
              ? "h-full bg-emerald-500"
              : rate >= 40
                ? "h-full bg-amber-500"
                : "h-full bg-rose-500"
          }
          style={{ width: `${rate}%` }}
        />
      </div>
    </article>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "good" | "warn" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
        ? "text-amber-700"
        : tone === "bad"
          ? "text-rose-700"
          : "text-slate-900";
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={`text-sm font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function detectRecurringTheme(
  items: RetroItem[],
  retros: Retro[],
): string | null {
  const closedIds = new Set(
    retros.filter((r) => r.status === "closed").map((r) => r.id),
  );
  const negative = items.filter(
    (i) => i.column === "sad" && closedIds.has(i.retroId),
  );
  const counts = new Map<string, Set<string>>();
  for (const it of negative) {
    for (const word of tokenize(it.text)) {
      const set = counts.get(word) ?? new Set<string>();
      set.add(it.retroId);
      counts.set(word, set);
    }
  }
  const winners = [...counts.entries()]
    .filter(([w, ids]) => ids.size >= 2 && w.length > 4)
    .sort((a, b) => b[1].size - a[1].size);
  if (!winners.length) return null;
  const [word, ids] = winners[0];
  const sprintNames = [...ids]
    .map((id) => retros.find((r) => r.id === id)?.sprintName)
    .filter(Boolean) as string[];
  return `"${word}" konusu son ${ids.size} retroda konuşuldu (${sprintNames.join(
    ", ",
  )}) ve hâlâ çözülmedi.`;
}

const STOPWORDS = new Set([
  "için",
  "bunu",
  "şunu",
  "bir",
  "olan",
  "olmuş",
  "vardı",
  "gibi",
  "kadar",
  "veya",
  "ama",
  "fakat",
  "yine",
  "hâlâ",
  "hala",
  "geç",
  "çok",
]);

function tokenize(text: string): string[] {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{Letter}\s'-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !STOPWORDS.has(w));
}
