"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Flame,
  Loader2,
  Repeat2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MemberAvatar } from "@/components/app/member-avatar";
import { useAppState } from "@/lib/store";
import { aiInsights } from "@/lib/ai/client";
import type { RetroInsight } from "@/lib/ai/heuristics";
import { cn } from "@/lib/cn";

const KIND_ICON: Record<RetroInsight["kind"], React.ReactNode> = {
  recurring_theme: <Repeat2 className="size-4" />,
  completion: <TrendingUp className="size-4" />,
  stale: <Flame className="size-4" />,
  owner_balance: <Users className="size-4" />,
  carry_over: <Repeat2 className="size-4" />,
};

export default function InsightsPage() {
  const state = useAppState((s) => s);
  const [insights, setInsights] = useState<RetroInsight[]>([]);
  const [source, setSource] = useState<"model" | "heuristic" | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;
    aiInsights(state.retros, state.retroItems, state.actions, state.members)
      .then((res) => {
        if (cancelled) return;
        setInsights(res.data);
        setSource(res.source);
        setBusy(false);
      })
      .catch(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [state.retros, state.retroItems, state.actions, state.members]);

  const closedRetros = state.retros.filter((r) => r.status === "closed");
  const closedIds = new Set(closedRetros.map((r) => r.id));
  const historicalActions = state.actions.filter((a) => closedIds.has(a.retroId));
  const done = historicalActions.filter((a) => a.status === "done").length;
  const completionRate = historicalActions.length
    ? Math.round((done / historicalActions.length) * 100)
    : 0;

  // Per-retro completion bars
  const perRetro = closedRetros.map((r) => {
    const list = state.actions.filter((a) => a.retroId === r.id);
    const d = list.filter((x) => x.status === "done").length;
    const rate = list.length ? Math.round((d / list.length) * 100) : 0;
    return { retro: r, total: list.length, done: d, rate };
  });

  // Owner load
  const ownerLoad = state.members
    .map((m) => {
      const open = state.actions.filter(
        (a) =>
          a.ownerId === m.id && a.status !== "done" && a.status !== "dropped",
      ).length;
      const shipped = state.actions.filter(
        (a) => a.ownerId === m.id && a.status === "done",
      ).length;
      return { member: m, open, shipped };
    })
    .sort((a, b) => b.open - a.open);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
            <BarChart3 className="size-7" />
            Cross-retro insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Patterns RetroLoop has spotted across your sprints. The whole point
            is to stop re-discussing the same problem.
          </p>
        </div>
        {source ? (
          <Badge variant="outline" className="self-start text-[10px]">
            <Sparkles className="size-3 text-info" />
            generated {source === "model" ? "via LLM" : "via heuristic"}
          </Badge>
        ) : null}
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <KpiCard
          label="Past completion rate"
          value={`${completionRate}%`}
          icon={
            completionRate >= 70 ? (
              <TrendingUp className="size-4 text-success" />
            ) : (
              <TrendingDown className="size-4 text-warning-foreground" />
            )
          }
          hint={`${done}/${historicalActions.length} actions shipped across ${closedRetros.length} retros`}
        />
        <KpiCard
          label="Carried-over actions"
          value={String(
            state.actions.filter(
              (a) => a.carriedOverCount > 0 && a.status !== "done",
            ).length,
          )}
          icon={<Repeat2 className="size-4 text-warning-foreground" />}
          hint="still open after rolling forward"
        />
        <KpiCard
          label="Nudges logged"
          value={String(state.actions.reduce((s, a) => s + a.nudges.length, 0))}
          icon={<Sparkles className="size-4 text-info" />}
          hint="AI-drafted reminders sent"
        />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>What RetroLoop spotted</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {busy ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Analysing patterns…
              </div>
            ) : insights.length === 0 ? (
              <div className="rounded-md border border-success/30 bg-success/5 p-4 text-sm">
                <CheckCircle2 className="mr-1 inline size-4 text-success" />
                Nothing recurring yet — keep running retros and check back.
              </div>
            ) : (
              insights.map((insight, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-md border p-4 text-sm",
                    insight.severity === "warning"
                      ? "border-warning/40 bg-warning/5"
                      : insight.severity === "success"
                      ? "border-success/30 bg-success/5"
                      : "border-info/30 bg-info/5",
                  )}
                >
                  <div className="flex items-center gap-2 font-medium">
                    {KIND_ICON[insight.kind]}
                    {insight.title}
                  </div>
                  <p className="mt-1 text-muted-foreground">{insight.body}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completion by retro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {perRetro.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No closed retros yet.
              </p>
            ) : (
              perRetro.map(({ retro, total, done, rate }) => (
                <Link
                  key={retro.id}
                  href={`/retros/${retro.id}`}
                  className="block rounded-md border bg-card p-3 transition-colors hover:border-foreground/30"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {retro.sprintLabel ?? retro.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {done}/{total}
                    </span>
                  </div>
                  <Progress value={rate} className="mt-2 h-1.5" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Owner load</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/actions">
              View all <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ownerLoad.map(({ member, open, shipped }) => (
            <div
              key={member.id}
              className="flex items-center gap-3 rounded-md border bg-card p-3"
            >
              <MemberAvatar member={member} size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {member.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {open} open · {shipped} shipped
                </div>
              </div>
              {open >= 3 ? (
                <Badge variant="warning" className="shrink-0">
                  busy
                </Badge>
              ) : open === 0 ? (
                <Badge variant="secondary" className="shrink-0">
                  clear
                </Badge>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}
