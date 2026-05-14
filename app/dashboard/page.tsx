"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Flame,
  Plus,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ActionCard } from "@/components/app/action-card";
import { MemberStack } from "@/components/app/member-avatar";
import { useAppState, useIsHydrated } from "@/lib/store";
import { formatRelative, isOverdue, isStale } from "@/lib/date";
import { cn } from "@/lib/cn";

export default function DashboardPage() {
  const hydrated = useIsHydrated();
  const state = useAppState((s) => s);

  if (!hydrated) {
    return (
      <div className="px-6 py-10 md:px-10">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const openActions = state.actions.filter(
    (a) => a.status !== "done" && a.status !== "dropped",
  );
  const overdue = openActions.filter((a) => isOverdue(a.dueDate, a.status));
  const stale = openActions.filter(
    (a) => !isOverdue(a.dueDate, a.status) && isStale(a.updatedAt, a.status),
  );
  const closedRetros = state.retros.filter((r) => r.status === "closed");
  const closedRetroIds = new Set(closedRetros.map((r) => r.id));
  const historicalActions = state.actions.filter((a) =>
    closedRetroIds.has(a.retroId),
  );
  const done = historicalActions.filter((a) => a.status === "done").length;
  const completionRate = historicalActions.length
    ? Math.round((done / historicalActions.length) * 100)
    : 0;

  const liveRetro = state.retros.find((r) => r.status === "live");
  const recentRetros = [...state.retros]
    .sort(
      (a, b) =>
        (b.closedAt ?? b.createdAt).localeCompare(a.closedAt ?? a.createdAt),
    )
    .slice(0, 4);

  const myOpen = openActions.filter((a) => a.ownerId === state.currentUserId);
  const needsAttention = [...overdue, ...stale].slice(0, 4);
  const currentUser = state.members.find((m) => m.id === state.currentUserId);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-10 md:px-10">
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {state.teamName}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back, {currentUser?.name.split(" ")[0]}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {liveRetro
              ? `${liveRetro.title} is live — pick up where you left off.`
              : "No retro is live right now. Start the next one when you're ready."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/retros/new">
              <Plus className="size-4" /> Start retro
            </Link>
          </Button>
          {liveRetro ? (
            <Button asChild variant="outline">
              <Link href={`/retros/${liveRetro.id}`}>
                Resume <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <Stat
          icon={<Flame className="size-4" />}
          label="Open actions"
          value={openActions.length}
          tone="default"
          hint={`${myOpen.length} on you`}
        />
        <Stat
          icon={<Timer className="size-4" />}
          label="Overdue"
          value={overdue.length}
          tone={overdue.length ? "destructive" : "default"}
          hint="needs a decision"
        />
        <Stat
          icon={<Timer className="size-4" />}
          label="Stale"
          value={stale.length}
          tone={stale.length ? "warning" : "default"}
          hint="no update >7 days"
        />
        <Stat
          icon={<TrendingUp className="size-4" />}
          label="Completion rate"
          value={`${completionRate}%`}
          tone={completionRate >= 70 ? "success" : "default"}
          hint={`${done}/${historicalActions.length} shipped`}
        />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Needs your attention</CardTitle>
              <p className="text-sm text-muted-foreground">
                Overdue or stale — these are the actions most likely to be
                forgotten.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/actions?filter=needs-attention">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {needsAttention.length === 0 ? (
              <div className="flex items-center gap-3 rounded-md border border-success/30 bg-success/5 p-4 text-sm text-success-foreground">
                <CheckCircle2 className="size-5 text-success" />
                Everything is on track — no overdue or stale actions.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {needsAttention.map((a) => (
                  <ActionCard key={a.id} action={a} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>The loop, today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Past completion rate
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold">{completionRate}%</span>
                <span className="text-xs text-muted-foreground">
                  across {closedRetros.length} closed retro
                  {closedRetros.length === 1 ? "" : "s"}
                </span>
              </div>
              <Progress value={completionRate} className="mt-2" />
            </div>

            <div className="rounded-md border bg-accent/30 p-3 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="size-3.5 text-info" />
                AI insight
              </div>
              <p className="mt-1 text-muted-foreground">
                {stale.length > 0
                  ? `${stale.length} action${stale.length === 1 ? "" : "s"} haven't moved in over a week. Worth a nudge before the next retro.`
                  : overdue.length > 0
                  ? `${overdue.length} action${overdue.length === 1 ? "" : "s"} blew past their due date. Decide: ship, re-scope, or drop.`
                  : "Healthy backlog. Keep starting each retro by reviewing what's still open."}
              </p>
            </div>

            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/insights">
                See cross-retro insights <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent retros</CardTitle>
              <p className="text-sm text-muted-foreground">
                Each closed retro&apos;s open actions roll into the next.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/retros">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentRetros.map((r) => {
              const retroActions = state.actions.filter((a) => a.retroId === r.id);
              const completed = retroActions.filter((a) => a.status === "done").length;
              const total = retroActions.length;
              const members = state.members.filter((m) =>
                r.participants.includes(m.id),
              );
              return (
                <Link
                  key={r.id}
                  href={`/retros/${r.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border bg-card px-4 py-3 transition-colors hover:border-foreground/30"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{r.title}</span>
                      <Badge
                        variant={
                          r.status === "live"
                            ? "info"
                            : r.status === "closed"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <Calendar className="mr-1 inline size-3" />
                      {formatRelative(r.createdAt)}
                      {total > 0 ? (
                        <>
                          {" · "}
                          {completed}/{total} actions shipped
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <MemberStack members={members} size="xs" max={4} />
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your inbox</CardTitle>
            <p className="text-sm text-muted-foreground">
              Actions where you&apos;re the owner.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {myOpen.length === 0 ? (
              <div className="rounded-md border border-success/30 bg-success/5 p-3 text-sm text-success-foreground">
                <CheckCircle2 className="mr-1 inline size-4 text-success" />
                You&apos;re clear. Nice.
              </div>
            ) : (
              myOpen.slice(0, 4).map((a) => (
                <Link
                  key={a.id}
                  href={`/actions/${a.id}`}
                  className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm hover:border-foreground/30"
                >
                  <span className="truncate">{a.title}</span>
                  <span
                    className={cn(
                      "shrink-0 text-xs text-muted-foreground",
                      isOverdue(a.dueDate, a.status) && "text-destructive",
                    )}
                  >
                    {formatRelative(a.dueDate)}
                  </span>
                </Link>
              ))
            )}
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/actions?filter=mine">
                View my inbox <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "destructive" | "warning" | "success";
}) {
  const toneClass = {
    default: "text-foreground",
    destructive: "text-destructive",
    warning: "text-warning-foreground",
    success: "text-success",
  }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          {icon}
          {label}
        </span>
      </div>
      <div className={cn("mt-2 text-3xl font-semibold", toneClass)}>{value}</div>
      {hint ? (
        <div className="text-xs text-muted-foreground">{hint}</div>
      ) : null}
    </Card>
  );
}
