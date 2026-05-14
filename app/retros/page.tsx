"use client";

import Link from "next/link";
import { ArrowRight, Calendar, CheckCircle2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MemberStack } from "@/components/app/member-avatar";
import { useAppState, useIsHydrated } from "@/lib/store";
import { formatDate, formatRelative } from "@/lib/date";

export default function RetrosPage() {
  const hydrated = useIsHydrated();
  const state = useAppState((s) => s);

  if (!hydrated) {
    return (
      <div className="px-6 py-10 md:px-10">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const sorted = [...state.retros].sort((a, b) =>
    (b.createdAt).localeCompare(a.createdAt),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Retros</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every sprint&apos;s reflection in one place. Closed retros keep their
            open actions visible in the next one.
          </p>
        </div>
        <Button asChild>
          <Link href="/retros/new">
            <Plus className="size-4" /> Start retro
          </Link>
        </Button>
      </header>

      <div className="grid gap-4">
        {sorted.map((r) => {
          const items = state.retroItems.filter((i) => i.retroId === r.id);
          const actions = state.actions.filter((a) => a.retroId === r.id);
          const done = actions.filter((a) => a.status === "done").length;
          const open = actions.filter(
            (a) => a.status !== "done" && a.status !== "dropped",
          ).length;
          const members = state.members.filter((m) =>
            r.participants.includes(m.id),
          );
          return (
            <Link key={r.id} href={`/retros/${r.id}`}>
              <Card className="p-5 transition-colors hover:border-foreground/30">
                <CardContent className="flex flex-col gap-4 p-0 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold tracking-tight">
                        {r.title}
                      </h2>
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
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3" />
                        {r.status === "closed" && r.closedAt
                          ? `closed ${formatRelative(r.closedAt)}`
                          : formatDate(r.createdAt)}
                      </span>
                      <span>{items.length} sticky notes</span>
                      {actions.length > 0 ? (
                        <span>
                          {actions.length} actions · {done} shipped · {open}{" "}
                          open
                        </span>
                      ) : (
                        <span>no actions captured yet</span>
                      )}
                    </p>
                    {r.summary ? (
                      <p className="mt-2 max-w-3xl text-sm text-muted-foreground line-clamp-2">
                        {r.summary}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <MemberStack members={members} size="sm" max={5} />
                    {r.status === "closed" && open === 0 && actions.length > 0 ? (
                      <CheckCircle2 className="size-5 text-success" />
                    ) : null}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
