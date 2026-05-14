"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MemberAvatar } from "./member-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { store, useAppState } from "@/lib/store";
import { aiExtractActions, aiSuggestFromItems } from "@/lib/ai/client";
import type { SuggestedAction } from "@/lib/ai/heuristics";
import { addDays, todayISO } from "@/lib/date";
import type { RetroItem } from "@/lib/types";

type DraftRow = SuggestedAction & {
  selected: boolean;
  ownerId: string;
  dueDate: string;
};

export function ExtractActionsPanel({
  retroId,
  retroItems,
}: {
  retroId: string;
  retroItems: RetroItem[];
}) {
  const state = useAppState((s) => s);
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<DraftRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"model" | "heuristic" | null>(null);

  async function extract(from: "text" | "items") {
    setBusy(true);
    try {
      const res =
        from === "text"
          ? await aiExtractActions(text, state.members)
          : await aiSuggestFromItems(retroItems, state.members);
      const t = todayISO();
      const rows = res.data.map((s) => ({
        ...s,
        selected: true,
        ownerId: s.ownerId ?? state.currentUserId,
        dueDate: addDays(t, s.dueOffsetDays || 10),
      }));
      setDrafts(rows);
      setSource(res.source);
      if (!rows.length) {
        toast.info("Nothing actionable found — try more concrete language.");
      }
    } catch {
      toast.error("Couldn't extract — try again.");
    } finally {
      setBusy(false);
    }
  }

  function commit() {
    if (!drafts) return;
    const chosen = drafts.filter((d) => d.selected);
    if (!chosen.length) {
      toast.error("Nothing selected.");
      return;
    }
    for (const d of chosen) {
      store.createAction({
        title: d.title,
        ownerId: d.ownerId,
        dueDate: d.dueDate,
        retroId,
        byId: state.currentUserId,
      });
    }
    toast.success(
      `${chosen.length} action${chosen.length === 1 ? "" : "s"} captured.`,
    );
    setDrafts(null);
    setText("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Sparkles className="size-4 text-info" />
        <span className="font-medium">Extract actions from raw notes</span>
        {source ? (
          <Badge variant="outline" className="ml-auto text-[10px]">
            {source === "model" ? "via LLM" : "via heuristic"}
          </Badge>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Paste meeting notes, Slack threads, or anything verbose. RetroLoop pulls
        out concrete actions with owners and dates. Or scan the sticky notes
        already on the board.
      </p>
      <Textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          "e.g.\n- Mert will fix the staging crash by Friday\n- Selin should write the Linear handoff RFC\n- Zafer to decide on standup timer by next retro"
        }
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => extract("text")}
          disabled={busy || !text.trim()}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
          Extract from notes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => extract("items")}
          disabled={busy || retroItems.length === 0}
        >
          <Sparkles className="size-3.5" />
          Suggest from board
        </Button>
      </div>

      {drafts && drafts.length > 0 ? (
        <div className="space-y-2 rounded-md border bg-background p-3">
          <div className="text-xs font-medium text-muted-foreground">
            {drafts.filter((d) => d.selected).length} of {drafts.length}{" "}
            selected · review before saving
          </div>
          {drafts.map((d, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-sm"
            >
              <input
                type="checkbox"
                checked={d.selected}
                onChange={(e) =>
                  setDrafts((rows) =>
                    rows!.map((r, i) =>
                      i === idx ? { ...r, selected: e.target.checked } : r,
                    ),
                  )
                }
                className="size-3.5 accent-foreground"
              />
              <Input
                value={d.title}
                onChange={(e) =>
                  setDrafts((rows) =>
                    rows!.map((r, i) =>
                      i === idx ? { ...r, title: e.target.value } : r,
                    ),
                  )
                }
                className="h-8 border-none bg-transparent px-1 shadow-none focus-visible:ring-0"
              />
              <Select
                value={d.ownerId}
                onValueChange={(v) =>
                  setDrafts((rows) =>
                    rows!.map((r, i) =>
                      i === idx ? { ...r, ownerId: v } : r,
                    ),
                  )
                }
              >
                <SelectTrigger className="h-7 w-[140px] text-xs">
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
                        {m.name.split(" ")[0]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={d.dueDate}
                onChange={(e) =>
                  setDrafts((rows) =>
                    rows!.map((r, i) =>
                      i === idx ? { ...r, dueDate: e.target.value } : r,
                    ),
                  )
                }
                className="h-7 w-[140px] text-xs"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setDrafts(null)}>
              Discard
            </Button>
            <Button size="sm" onClick={commit}>
              Save selected
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
