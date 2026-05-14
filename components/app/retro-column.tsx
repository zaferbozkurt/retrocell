"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote } from "./sticky-note";
import { store, useAppState } from "@/lib/store";
import { COLUMN_META, type ColumnId, type RetroItem } from "@/lib/types";
import { cn } from "@/lib/cn";

const ACCENT_CHIP: Record<ColumnId, string> = {
  "went-well": "bg-success/15 text-success-foreground",
  "didnt-go-well": "bg-destructive/15 text-destructive",
  ideas: "bg-info/15 text-info-foreground",
  shoutouts: "bg-warning/15 text-warning-foreground",
};

export function RetroColumn({
  retroId,
  columnId,
  items,
  readOnly,
}: {
  retroId: string;
  columnId: ColumnId;
  items: RetroItem[];
  readOnly?: boolean;
}) {
  const meta = COLUMN_META[columnId];
  const currentUserId = useAppState((s) => s.currentUserId);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function commit() {
    const next = draft.trim();
    if (next) {
      store.addItem({
        retroId,
        columnId,
        content: next,
        authorId: currentUserId,
      });
    }
    setDraft("");
    setAdding(false);
  }

  const sorted = [...items].sort((a, b) => b.votes.length - a.votes.length);

  return (
    <div className="flex h-full min-w-0 flex-col rounded-lg border bg-card/50 p-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <span
              className={cn(
                "inline-flex size-5 items-center justify-center rounded-sm text-xs",
                ACCENT_CHIP[columnId],
              )}
            >
              {meta.emoji}
            </span>
            {meta.title}
            <span className="text-xs font-normal text-muted-foreground">
              · {items.length}
            </span>
          </h3>
          <p className="text-[11px] text-muted-foreground">{meta.subtitle}</p>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {sorted.map((item) => (
          <StickyNote key={item.id} item={item} readOnly={readOnly} />
        ))}

        {!readOnly ? (
          adding ? (
            <div className="rounded-md border border-dashed bg-background/60 p-2">
              <Textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    commit();
                  }
                  if (e.key === "Escape") {
                    setDraft("");
                    setAdding(false);
                  }
                }}
                placeholder="Add a sticky… (Enter to save, Esc to cancel)"
                className="min-h-[60px] border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
              />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-muted-foreground"
              onClick={() => setAdding(true)}
            >
              <Plus className="size-3.5" /> Add sticky
            </Button>
          )
        ) : null}
      </div>
    </div>
  );
}
