"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { aiNudge } from "@/lib/ai/client";
import { store, useAppState } from "@/lib/store";
import type { ActionItem } from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ActionItem;
};

export function NudgeDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open ? (
        <Body action={props.action} onOpenChange={props.onOpenChange} />
      ) : null}
    </Dialog>
  );
}

function Body({
  action,
  onOpenChange,
}: {
  action: ActionItem;
  onOpenChange: (open: boolean) => void;
}) {
  const state = useAppState((s) => s);
  const owner = state.members.find((m) => m.id === action.ownerId);
  const retroTitle =
    state.retros.find((r) => r.id === action.retroId)?.title ?? "the retro";
  const me = state.members.find((m) => m.id === state.currentUserId);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);
  const [source, setSource] = useState<"model" | "heuristic" | null>(null);

  useEffect(() => {
    let cancelled = false;
    aiNudge(action, owner, retroTitle, me?.name ?? "Teammate")
      .then((res) => {
        if (cancelled) return;
        setMessage(res.data);
        setSource(res.source);
        setBusy(false);
      })
      .catch(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function regenerate() {
    setBusy(true);
    try {
      const res = await aiNudge(action, owner, retroTitle, me?.name ?? "Teammate");
      setMessage(res.data);
      setSource(res.source);
    } catch {
      toast.error("Couldn't draft a nudge.");
    } finally {
      setBusy(false);
    }
  }

  function send() {
    store.addNudge(action.id, state.currentUserId, message);
    toast.success(`Nudge logged for ${owner?.name.split(" ")[0]}.`);
    onOpenChange(false);
    setMessage("");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Couldn't copy.");
    }
  }

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-info" />
          Draft a nudge
          {source ? (
            <Badge variant="outline" className="text-[10px]">
              {source === "model" ? "via LLM" : "via heuristic"}
            </Badge>
          ) : null}
        </DialogTitle>
        <DialogDescription>
          A short, warm message to {owner?.name ?? "the owner"}. Edit before
          sending. The nudge is logged on the action so the team can see it
          went out.
        </DialogDescription>
      </DialogHeader>

      {busy ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Drafting…
        </div>
      ) : (
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={8}
        />
      )}

      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button variant="outline" onClick={regenerate} disabled={busy}>
          <Sparkles className="size-3.5" /> Regenerate
        </Button>
        <Button variant="outline" onClick={copy} disabled={busy || !message}>
          <Copy className="size-3.5" /> Copy
        </Button>
        <Button onClick={send} disabled={busy || !message}>
          <Send className="size-3.5" /> Log nudge
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
