"use client";

import { useState } from "react";
import { Heart, MoreHorizontal, Pencil, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MemberAvatar } from "./member-avatar";
import { NewActionDialog } from "./new-action-dialog";
import { store, useAppState } from "@/lib/store";
import { cn } from "@/lib/cn";
import type { ColumnId, RetroItem } from "@/lib/types";

const COLUMN_ACCENT: Record<ColumnId, { bg: string; border: string }> = {
  "went-well": {
    bg: "bg-success/10",
    border: "border-success/30",
  },
  "didnt-go-well": {
    bg: "bg-destructive/10",
    border: "border-destructive/30",
  },
  ideas: {
    bg: "bg-info/10",
    border: "border-info/30",
  },
  shoutouts: {
    bg: "bg-warning/10",
    border: "border-warning/30",
  },
};

export function StickyNote({
  item,
  readOnly = false,
}: {
  item: RetroItem;
  readOnly?: boolean;
}) {
  const author = useAppState((s) => s.members.find((m) => m.id === item.authorId));
  const currentUserId = useAppState((s) => s.currentUserId);
  const linkedAction = useAppState((s) =>
    item.linkedActionId
      ? s.actions.find((a) => a.id === item.linkedActionId)
      : undefined,
  );
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);
  const [actionOpen, setActionOpen] = useState(false);

  const accent = COLUMN_ACCENT[item.columnId];
  const hasVoted = item.votes.includes(currentUserId);

  function save() {
    const next = draft.trim();
    if (!next) {
      store.deleteItem(item.id);
    } else if (next !== item.content) {
      store.updateItem(item.id, { content: next });
    }
    setEditing(false);
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-md border p-3 shadow-sm",
        accent.bg,
        accent.border,
      )}
    >
      {editing ? (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              save();
            }
            if (e.key === "Escape") {
              setDraft(item.content);
              setEditing(false);
            }
          }}
          className="min-h-[60px] bg-background/60"
        />
      ) : (
        <button
          type="button"
          className="text-left text-sm leading-snug"
          onClick={() => !readOnly && setEditing(true)}
          disabled={readOnly}
        >
          {item.content}
        </button>
      )}

      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <MemberAvatar member={author} size="xs" />
          <span className="text-muted-foreground">
            {author?.name.split(" ")[0]}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => !readOnly && store.toggleVote(item.id, currentUserId)}
            disabled={readOnly}
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs transition-colors",
              hasVoted
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-transparent text-muted-foreground hover:bg-background/60",
            )}
            aria-label={hasVoted ? "Remove vote" : "Vote"}
          >
            <Heart
              className={cn("size-3", hasVoted && "fill-destructive")}
            />
            {item.votes.length}
          </button>

          {!readOnly ? (
            <ItemMenu
              onEdit={() => setEditing(true)}
              onDelete={() => store.deleteItem(item.id)}
              onConvert={
                linkedAction ? undefined : () => setActionOpen(true)
              }
              linkedActionId={linkedAction?.id}
            />
          ) : null}
        </div>
      </div>

      {linkedAction ? (
        <a
          href={`/actions/${linkedAction.id}`}
          className="mt-1 inline-flex items-center gap-1 self-start rounded-full border border-foreground/10 bg-background/60 px-2 py-0.5 text-[10px] text-muted-foreground"
        >
          <Sparkles className="size-3" />
          Linked action: {linkedAction.title.slice(0, 36)}
          {linkedAction.title.length > 36 ? "…" : ""}
        </a>
      ) : null}

      <NewActionDialog
        open={actionOpen}
        onOpenChange={setActionOpen}
        retroId={item.retroId}
        sourceItemId={item.id}
        initialTitle={item.content.slice(0, 80)}
        initialDetail={item.content.length > 80 ? item.content : ""}
      />
    </div>
  );
}

function ItemMenu({
  onEdit,
  onDelete,
  onConvert,
  linkedActionId,
}: {
  onEdit: () => void;
  onDelete: () => void;
  onConvert?: () => void;
  linkedActionId?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        size="icon"
        variant="ghost"
        className="size-6 text-muted-foreground"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        aria-label="Item menu"
      >
        <MoreHorizontal className="size-3.5" />
      </Button>
      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border bg-popover p-1 text-sm shadow-md">
          {onConvert ? (
            <MenuItem
              icon={<Sparkles className="size-3.5 text-info" />}
              onClick={() => {
                setOpen(false);
                onConvert();
              }}
            >
              Convert to action
            </MenuItem>
          ) : (
            <MenuItem
              icon={<Sparkles className="size-3.5 text-info" />}
              onClick={() => {
                setOpen(false);
                if (linkedActionId) {
                  window.location.href = `/actions/${linkedActionId}`;
                }
              }}
            >
              View linked action
            </MenuItem>
          )}
          <MenuItem
            icon={<Pencil className="size-3.5" />}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            Edit
          </MenuItem>
          <MenuItem
            icon={<Trash2 className="size-3.5 text-destructive" />}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            destructive
          >
            Delete
          </MenuItem>
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent",
        destructive && "text-destructive hover:bg-destructive/10",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
