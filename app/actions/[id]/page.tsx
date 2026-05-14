"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  AlarmClock,
  ArrowLeft,
  BellRing,
  Calendar,
  MessageSquare,
  Pencil,
  Repeat2,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ActionStatusPill } from "@/components/app/action-status-pill";
import { MemberAvatar } from "@/components/app/member-avatar";
import { NudgeDialog } from "@/components/app/nudge-dialog";
import { store, useAppState } from "@/lib/store";
import { formatDate, formatRelative, isOverdue, isStale } from "@/lib/date";
import {
  ACTION_STATUS_META,
  type ActionHistoryEntry,
  type ActionStatus,
} from "@/lib/types";
import { cn } from "@/lib/cn";

const STATUS_OPTIONS: ActionStatus[] = [
  "open",
  "in_progress",
  "blocked",
  "done",
  "dropped",
];

export default function ActionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const state = useAppState((s) => s);
  const action = state.actions.find((a) => a.id === id);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState("");

  if (!action) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-muted-foreground">
          Action not found.{" "}
          <Link href="/actions" className="underline">
            Back to hub
          </Link>
          .
        </p>
      </div>
    );
  }

  const owner = state.members.find((m) => m.id === action.ownerId);
  const retro = state.retros.find((r) => r.id === action.retroId);
  const sourceItem = action.sourceItemId
    ? state.retroItems.find((i) => i.id === action.sourceItemId)
    : undefined;
  const overdue = isOverdue(action.dueDate, action.status);
  const stale = isStale(action.updatedAt, action.status);

  function postComment() {
    if (!comment.trim()) return;
    store.addComment(action!.id, state.currentUserId, comment.trim());
    setComment("");
    toast.success("Comment added.");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 md:px-10">
      <Link
        href="/actions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Action Hub
      </Link>

      <header className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {editing ? (
            <EditTitle
              action={action}
              onDone={() => setEditing(false)}
            />
          ) : (
            <h1 className="flex items-start gap-2 text-2xl font-semibold tracking-tight">
              <span>{action.title}</span>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                aria-label="Edit title"
              >
                <Pencil className="size-3.5" />
              </button>
            </h1>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <ActionStatusPill status={action.status} />
            {action.carriedOverCount > 0 ? (
              <Badge variant="warning" className="gap-1">
                <Repeat2 className="size-3" /> Carried ×{action.carriedOverCount}
              </Badge>
            ) : null}
            {overdue ? (
              <Badge variant="destructive" className="gap-1">
                <AlarmClock className="size-3" /> Overdue
              </Badge>
            ) : null}
            {stale && !overdue ? (
              <Badge variant="warning" className="gap-1">
                <BellRing className="size-3" /> Stale
              </Badge>
            ) : null}
            {retro ? (
              <Link href={`/retros/${retro.id}`} className="underline">
                from {retro.title}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setNudgeOpen(true)}
            disabled={action.status === "done" || action.status === "dropped"}
          >
            <Sparkles className="size-3.5" /> Draft AI nudge
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (window.confirm("Delete this action permanently?")) {
                store.deleteAction(action.id);
                window.history.back();
              }
            }}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {action.detail ? (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground whitespace-pre-wrap">
                {action.detail}
              </CardContent>
            </Card>
          ) : null}

          {sourceItem ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Came from this sticky</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                &ldquo;{sourceItem.content}&rdquo;
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline
                entries={action.history}
                members={state.members}
                nudges={action.nudges}
              />

              <Separator className="my-4" />

              <div className="flex gap-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a status update…"
                  rows={2}
                  className="flex-1"
                />
                <Button onClick={postComment} disabled={!comment.trim()}>
                  <Send className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="mb-1.5 block text-xs">Move status to</Label>
                <Select
                  value={action.status}
                  onValueChange={(v) =>
                    store.updateActionStatus(
                      action.id,
                      v as ActionStatus,
                      state.currentUserId,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ACTION_STATUS_META[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5 block text-xs">Owner</Label>
                <Select
                  value={action.ownerId}
                  onValueChange={(v) =>
                    store.updateAction(
                      action.id,
                      { ownerId: v },
                      state.currentUserId,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <span className="flex items-center gap-2">
                          <MemberAvatar
                            member={m}
                            size="xs"
                            withTooltip={false}
                          />
                          {m.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-1.5 block text-xs">Due date</Label>
                <Input
                  type="date"
                  value={action.dueDate}
                  onChange={(e) =>
                    store.updateAction(
                      action.id,
                      { dueDate: e.target.value },
                      state.currentUserId,
                    )
                  }
                />
                <p className={cn("mt-1 text-xs", overdue ? "text-destructive" : "text-muted-foreground")}>
                  {formatRelative(action.dueDate)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Owner</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <MemberAvatar member={owner} size="lg" />
              <div>
                <div className="font-medium">{owner?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {owner?.role}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Origin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="size-3" />
                Created {formatRelative(action.createdAt)}
              </div>
              <div className="flex items-center gap-2">
                <User className="size-3" />
                {retro?.title ?? "Unknown retro"}
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="size-3" />
                Last update {formatRelative(action.updatedAt)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <NudgeDialog open={nudgeOpen} onOpenChange={setNudgeOpen} action={action} />
    </div>
  );
}

function EditTitle({
  action,
  onDone,
}: {
  action: { id: string; title: string };
  onDone: () => void;
}) {
  const state = useAppState((s) => s);
  const [v, setV] = useState(action.title);
  function save() {
    if (v.trim() && v.trim() !== action.title) {
      store.updateAction(action.id, { title: v.trim() }, state.currentUserId);
    }
    onDone();
  }
  return (
    <Input
      autoFocus
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") onDone();
      }}
      className="text-2xl font-semibold h-auto py-1.5"
    />
  );
}

function Timeline({
  entries,
  members,
  nudges,
}: {
  entries: ActionHistoryEntry[];
  members: { id: string; name: string; initials: string; color: string }[];
  nudges: { at: string; byId: string; message: string }[];
}) {
  if (entries.length === 0)
    return (
      <p className="text-sm text-muted-foreground">No activity yet.</p>
    );
  return (
    <ol className="space-y-3 text-sm">
      {entries.map((e, idx) => {
        const by = members.find((m) => m.id === e.byId);
        const nudge =
          e.type === "nudge"
            ? nudges.find((n) => n.at === e.at && n.byId === e.byId)
            : undefined;
        return (
          <li key={idx} className="flex gap-3">
            <div className="mt-0.5 shrink-0">
              {by ? (
                <MemberAvatar member={by as never} size="xs" />
              ) : (
                <span className="block size-5 rounded-full bg-muted" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-foreground">
                <span className="font-medium">
                  {by?.name?.split(" ")[0] ?? "Someone"}
                </span>{" "}
                {labelFor(e)}
              </p>
              {e.note ? (
                <p className="mt-1 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap">
                  {e.type === "nudge" && nudge
                    ? nudge.message
                    : e.note}
                </p>
              ) : null}
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {formatDate(e.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function labelFor(e: ActionHistoryEntry): string {
  switch (e.type) {
    case "created":
      return "created this action";
    case "status":
      return `moved status from ${e.from?.replace("_", " ")} to ${e.to?.replace("_", " ")}`;
    case "owner":
      return "reassigned the owner";
    case "due":
      return `changed the due date`;
    case "comment":
      return "left a note";
    case "nudge":
      return "sent a nudge";
    case "carried":
      return "carried this into a new retro";
    case "edited":
      return "edited this action";
  }
}
