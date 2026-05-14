"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberAvatar } from "./member-avatar";
import { store, useAppState } from "@/lib/store";
import { addDays, todayISO } from "@/lib/date";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  retroId: string;
  sourceItemId?: string;
  initialTitle?: string;
  initialDetail?: string;
  initialOwnerId?: string;
  initialDueDate?: string;
};

export function NewActionDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      {props.open ? <Body {...props} /> : null}
    </Dialog>
  );
}

function Body({
  onOpenChange,
  retroId,
  sourceItemId,
  initialTitle = "",
  initialDetail = "",
  initialOwnerId,
  initialDueDate,
}: Omit<Props, "open">) {
  const state = useAppState((s) => s);
  const [title, setTitle] = useState(initialTitle);
  const [detail, setDetail] = useState(initialDetail);
  const [ownerId, setOwnerId] = useState<string>(
    initialOwnerId ?? state.currentUserId,
  );
  const [dueDate, setDueDate] = useState<string>(
    initialDueDate ?? addDays(todayISO(), 10),
  );

  function submit() {
    if (!title.trim()) {
      toast.error("Give the action a clear title.");
      return;
    }
    store.createAction({
      title: title.trim(),
      detail: detail.trim() || undefined,
      ownerId,
      dueDate,
      retroId,
      sourceItemId,
      byId: state.currentUserId,
    });
    toast.success("Action captured.");
    onOpenChange(false);
  }

  return (
    <DialogContent>
        <DialogHeader>
          <DialogTitle>New action item</DialogTitle>
          <DialogDescription>
            Owned and dated, so it can&apos;t hide.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="action-title">What needs to happen?</Label>
            <Input
              id="action-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Decide on a permanent fix for standup overrun"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="action-detail">Context (optional)</Label>
            <Textarea
              id="action-detail"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Why this matters, links, scope notes…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
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
            <div className="space-y-1.5">
              <Label htmlFor="action-due">Due date</Label>
              <Input
                id="action-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Create action</Button>
        </DialogFooter>
      </DialogContent>
  );
}
