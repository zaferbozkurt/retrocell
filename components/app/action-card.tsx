"use client";

import Link from "next/link";
import { AlarmClock, ArrowRight, Repeat2, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MemberAvatar } from "./member-avatar";
import { ActionStatusPill } from "./action-status-pill";
import { useAppState } from "@/lib/store";
import { formatRelative, isOverdue, isStale } from "@/lib/date";
import { cn } from "@/lib/cn";
import type { ActionItem } from "@/lib/types";

export function ActionCard({
  action,
  compact = false,
}: {
  action: ActionItem;
  compact?: boolean;
}) {
  const owner = useAppState((s) => s.members.find((m) => m.id === action.ownerId));
  const retro = useAppState((s) => s.retros.find((r) => r.id === action.retroId));
  const overdue = isOverdue(action.dueDate, action.status);
  const stale = isStale(action.updatedAt, action.status);

  return (
    <Link href={`/actions/${action.id}`} className="block">
      <Card
        className={cn(
          "group flex h-full flex-col gap-2 p-4 transition-colors hover:border-foreground/30 hover:shadow-md",
          overdue && "border-destructive/40",
          stale && !overdue && "border-warning/40",
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-snug">{action.title}</h4>
          <ActionStatusPill status={action.status} />
        </div>

        {!compact && action.detail ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {action.detail}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <MemberAvatar member={owner} size="xs" />
            <span>{owner?.name.split(" ")[0]}</span>
            <span className="text-border">·</span>
            <span className={cn(overdue && "text-destructive font-medium")}>
              <AlarmClock className="mr-1 inline size-3" />
              {formatRelative(action.dueDate)}
            </span>
            {action.carriedOverCount > 0 ? (
              <span className="text-warning-foreground/80">
                <Repeat2 className="mr-0.5 inline size-3" />
                ×{action.carriedOverCount}
              </span>
            ) : null}
            {stale && !overdue ? (
              <span className="text-warning-foreground/80">
                <Timer className="mr-0.5 inline size-3" />
                stale
              </span>
            ) : null}
          </div>
          {retro ? (
            <span className="hidden items-center gap-1 group-hover:flex">
              <span>{retro.sprintLabel ?? retro.title}</span>
              <ArrowRight className="size-3" />
            </span>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
