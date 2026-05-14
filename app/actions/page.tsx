"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ActionCard } from "@/components/app/action-card";
import { MemberAvatar } from "@/components/app/member-avatar";
import { useAppState } from "@/lib/store";
import { isOverdue, isStale } from "@/lib/date";
import {
  ACTION_STATUS_META,
  type ActionItem,
  type ActionStatus,
} from "@/lib/types";
import { cn } from "@/lib/cn";

type Filter =
  | "all"
  | "mine"
  | "needs-attention"
  | "open"
  | "in_progress"
  | "blocked"
  | "done";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mine", label: "Mine" },
  { id: "needs-attention", label: "Needs attention" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
];

export default function ActionsPage() {
  return (
    <Suspense fallback={<div className="px-6 py-10">Loading…</div>}>
      <ActionsPageInner />
    </Suspense>
  );
}

function ActionsPageInner() {
  const state = useAppState((s) => s);
  const search = useSearchParams();
  const urlFilter = (search.get("filter") as Filter) ?? "all";
  const [filter, setFilter] = useState<Filter>(urlFilter);
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");

  const actions = state.actions;
  const currentUserId = state.currentUserId;
  const filtered = useMemo(() => {
    return actions.filter((a) => {
      if (
        query &&
        !a.title.toLowerCase().includes(query.toLowerCase()) &&
        !(a.detail ?? "").toLowerCase().includes(query.toLowerCase())
      ) {
        return false;
      }
      if (ownerFilter && a.ownerId !== ownerFilter) return false;
      switch (filter) {
        case "mine":
          return a.ownerId === currentUserId;
        case "needs-attention":
          return (
            isOverdue(a.dueDate, a.status) || isStale(a.updatedAt, a.status)
          );
        case "open":
          return a.status === "open";
        case "in_progress":
          return a.status === "in_progress";
        case "blocked":
          return a.status === "blocked";
        case "done":
          return a.status === "done";
        default:
          return true;
      }
    });
  }, [actions, currentUserId, filter, query, ownerFilter]);

  // Group by status for visual scan
  const byStatus = useMemo(() => {
    const groups: Record<ActionStatus, ActionItem[]> = {
      open: [],
      in_progress: [],
      blocked: [],
      done: [],
      dropped: [],
    };
    for (const a of filtered) groups[a.status].push(a);
    return groups;
  }, [filtered]);

  const counts = {
    all: state.actions.length,
    mine: state.actions.filter((a) => a.ownerId === state.currentUserId).length,
    needsAttention: state.actions.filter(
      (a) => isOverdue(a.dueDate, a.status) || isStale(a.updatedAt, a.status),
    ).length,
    open: state.actions.filter((a) => a.status === "open").length,
    in_progress: state.actions.filter((a) => a.status === "in_progress").length,
    blocked: state.actions.filter((a) => a.status === "blocked").length,
    done: state.actions.filter((a) => a.status === "done").length,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Action Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every action item across every retro. The single place where things
          can&apos;t go missing.
        </p>
      </header>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Open"
          value={counts.open + counts.in_progress + counts.blocked}
          hint={`${counts.blocked} blocked`}
        />
        <Stat label="Needs attention" value={counts.needsAttention} tone="warning" />
        <Stat label="Shipped" value={counts.done} tone="success" />
        <Stat label="Yours" value={counts.mine} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions…"
            className="pl-9"
          />
        </div>
        <div className="inline-flex flex-wrap gap-1 rounded-md border bg-card p-1">
          {FILTERS.map((f) => {
            const count =
              f.id === "all"
                ? counts.all
                : f.id === "mine"
                ? counts.mine
                : f.id === "needs-attention"
                ? counts.needsAttention
                : counts[f.id];
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-xs",
                  filter === f.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {f.label}
                <Badge
                  variant={filter === f.id ? "secondary" : "outline"}
                  className="ml-1.5 h-4 px-1 text-[9px]"
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">
          <Filter className="mr-1 inline size-3" />
          Filter by owner:
        </span>
        <button
          onClick={() => setOwnerFilter("")}
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs",
            ownerFilter === ""
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:bg-accent",
          )}
        >
          Anyone
        </button>
        {state.members.map((m) => (
          <button
            key={m.id}
            onClick={() =>
              setOwnerFilter((cur) => (cur === m.id ? "" : m.id))
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs",
              ownerFilter === m.id
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-accent",
            )}
          >
            <MemberAvatar member={m} size="xs" withTooltip={false} />
            {m.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {(["open", "in_progress", "blocked", "done", "dropped"] as ActionStatus[]).map(
        (status) => {
          const list = byStatus[status];
          if (list.length === 0) return null;
          const meta = ACTION_STATUS_META[status];
          return (
            <Card key={status} className="mb-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">
                  {meta.label}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    · {list.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {list.map((a) => (
                  <ActionCard key={a.id} action={a} />
                ))}
              </CardContent>
            </Card>
          );
        },
      )}

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Nothing matches. Try a different filter.
        </Card>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "default" | "warning" | "success";
}) {
  const cls = {
    default: "text-foreground",
    warning: "text-warning-foreground",
    success: "text-success",
  }[tone];
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold", cls)}>{value}</div>
      {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
    </Card>
  );
}
