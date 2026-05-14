"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Repeat2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MemberAvatar } from "@/components/app/member-avatar";
import { ActionStatusPill } from "@/components/app/action-status-pill";
import {
  store,
  useAppState,
  useIsHydrated,
  getPreviousRetro,
} from "@/lib/store";
import { addDays, formatRelative, todayISO } from "@/lib/date";
import { cn } from "@/lib/cn";
import type { AppState } from "@/lib/types";

type Stage = "setup" | "carry-over" | "review";
type Decision = "carry" | "drop";

export default function NewRetroPage() {
  const hydrated = useIsHydrated();
  const state = useAppState((s) => s);
  if (!hydrated) {
    return <div className="px-6 py-10">Loading…</div>;
  }
  return <Form state={state} />;
}

function Form({ state }: { state: AppState }) {
  const router = useRouter();
  const previousRetro = useMemo(() => getPreviousRetro(state), [state]);
  const openFromPrev = useMemo(() => {
    if (!previousRetro) return [];
    return state.actions.filter(
      (a) =>
        a.retroId === previousRetro.id &&
        a.status !== "done" &&
        a.status !== "dropped",
    );
  }, [previousRetro, state.actions]);

  const nextNumber =
    state.retros
      .map((r) => parseInt(r.sprintLabel?.match(/\d+/)?.[0] ?? "0", 10))
      .reduce((m, n) => Math.max(m, n), 0) + 1;

  const [stage, setStage] = useState<Stage>("setup");
  const [title, setTitle] = useState(`Sprint ${nextNumber} retrospective`);
  const [sprintLabel, setSprintLabel] = useState(`Sprint ${nextNumber}`);
  const [participantIds, setParticipantIds] = useState<string[]>(
    state.members.map((m) => m.id),
  );
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => {
    const init: Record<string, Decision> = {};
    for (const a of openFromPrev) init[a.id] = "carry";
    return init;
  });
  const [dueShifts, setDueShifts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const a of openFromPrev) init[a.id] = addDays(todayISO(), 14);
    return init;
  });

  function next() {
    if (stage === "setup") {
      if (!title.trim() || participantIds.length === 0) {
        toast.error("Title and at least one participant required.");
        return;
      }
      if (openFromPrev.length > 0) setStage("carry-over");
      else setStage("review");
    } else if (stage === "carry-over") {
      setStage("review");
    }
  }

  function start() {
    const retroId = store.createRetro({
      title,
      sprintLabel,
      facilitatorId: state.currentUserId,
      participants: participantIds,
    });
    let carried = 0;
    let dropped = 0;
    for (const a of openFromPrev) {
      const d = decisions[a.id] ?? "carry";
      if (d === "carry") {
        store.carryOver(a.id, retroId, state.currentUserId);
        const newDue = dueShifts[a.id];
        if (newDue && newDue !== a.dueDate) {
          store.updateAction(a.id, { dueDate: newDue }, state.currentUserId);
        }
        carried++;
      } else if (d === "drop") {
        store.updateActionStatus(
          a.id,
          "dropped",
          state.currentUserId,
          "Dropped at retro start — no longer pursuing.",
        );
        dropped++;
      }
    }
    toast.success(
      `Retro started${
        carried ? `, ${carried} carried forward` : ""
      }${dropped ? `, ${dropped} dropped` : ""}.`,
    );
    router.push(`/retros/${retroId}`);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10 md:px-10">
      <Link
        href="/retros"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All retros
      </Link>

      <ol className="my-6 flex items-center gap-2 text-xs">
        <StepDot active={stage === "setup"} done={stage !== "setup"}>1. Setup</StepDot>
        <span className="h-px w-6 bg-border" />
        <StepDot
          active={stage === "carry-over"}
          done={stage === "review"}
          disabled={openFromPrev.length === 0}
        >
          2. Carry-forward
          {openFromPrev.length > 0 ? (
            <Badge variant="warning" className="ml-2 h-5 px-1.5 text-[10px]">
              {openFromPrev.length}
            </Badge>
          ) : null}
        </StepDot>
        <span className="h-px w-6 bg-border" />
        <StepDot active={stage === "review"}>3. Start</StepDot>
      </ol>

      {stage === "setup" ? (
        <Card>
          <CardHeader>
            <CardTitle>New retrospective</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sprint 24 retrospective"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sprint">Sprint label (optional)</Label>
              <Input
                id="sprint"
                value={sprintLabel}
                onChange={(e) => setSprintLabel(e.target.value)}
                placeholder="Sprint 24"
              />
            </div>
            <div className="grid gap-2">
              <Label>Participants</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {state.members.map((m) => {
                  const checked = participantIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setParticipantIds((ids) =>
                          ids.includes(m.id)
                            ? ids.filter((x) => x !== m.id)
                            : [...ids, m.id],
                        )
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                        checked
                          ? "border-primary/50 bg-primary/5"
                          : "hover:bg-accent/60",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        className="pointer-events-none"
                      />
                      <MemberAvatar member={m} size="xs" withTooltip={false} />
                      <span className="truncate">{m.name.split(" ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {previousRetro && openFromPrev.length > 0 ? (
              <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm">
                <div className="flex items-center gap-1.5 font-medium">
                  <Repeat2 className="size-4 text-warning-foreground" />
                  {openFromPrev.length} open action
                  {openFromPrev.length === 1 ? "" : "s"} from {previousRetro.title}
                </div>
                <p className="mt-1 text-muted-foreground">
                  RetroLoop won&apos;t let these disappear silently. You&apos;ll
                  decide on each one in the next step.
                </p>
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button onClick={next}>
                Next <ArrowRight />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {stage === "carry-over" && previousRetro ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat2 className="size-4 text-warning-foreground" />
              Carry-forward from {previousRetro.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              For each open action: <strong>carry</strong> it into this retro
              (with an optional new due date), or <strong>drop</strong> it with
              an explicit decision. No silent disappearance.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {openFromPrev.map((a) => {
              const owner = state.members.find((m) => m.id === a.ownerId);
              const decision = decisions[a.id] ?? "carry";
              return (
                <div key={a.id} className="rounded-md border bg-card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-medium">{a.title}</h4>
                        <ActionStatusPill status={a.status} />
                        {a.carriedOverCount > 0 ? (
                          <Badge variant="warning" className="gap-1">
                            <Repeat2 className="size-3" />
                            Carried ×{a.carriedOverCount}
                          </Badge>
                        ) : null}
                      </div>
                      {a.detail ? (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {a.detail}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <MemberAvatar member={owner} size="xs" />
                        <span>{owner?.name}</span>
                        <span>·</span>
                        <span>was due {formatRelative(a.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                      <div className="inline-flex overflow-hidden rounded-md border">
                        <DecisionButton
                          active={decision === "carry"}
                          onClick={() =>
                            setDecisions((d) => ({ ...d, [a.id]: "carry" }))
                          }
                        >
                          Carry
                        </DecisionButton>
                        <DecisionButton
                          active={decision === "drop"}
                          onClick={() =>
                            setDecisions((d) => ({ ...d, [a.id]: "drop" }))
                          }
                        >
                          Drop
                        </DecisionButton>
                      </div>
                      {decision === "carry" ? (
                        <Input
                          type="date"
                          value={dueShifts[a.id] ?? a.dueDate}
                          onChange={(e) =>
                            setDueShifts((d) => ({
                              ...d,
                              [a.id]: e.target.value,
                            }))
                          }
                          className="h-8 w-[140px] text-xs"
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStage("setup")}>
                <ArrowLeft /> Back
              </Button>
              <Button onClick={next}>
                Continue <ArrowRight />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {stage === "review" ? (
        <Card>
          <CardHeader>
            <CardTitle>Ready to start</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last chance to review. You can edit everything inside the board.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReviewRow label="Title">{title}</ReviewRow>
            <ReviewRow label="Sprint">{sprintLabel || "—"}</ReviewRow>
            <ReviewRow label="Participants">
              <div className="flex flex-wrap items-center gap-2">
                {state.members
                  .filter((m) => participantIds.includes(m.id))
                  .map((m) => (
                    <Badge key={m.id} variant="secondary" className="gap-1">
                      <MemberAvatar
                        member={m}
                        size="xs"
                        withTooltip={false}
                      />
                      {m.name.split(" ")[0]}
                    </Badge>
                  ))}
              </div>
            </ReviewRow>
            {openFromPrev.length > 0 ? (
              <ReviewRow label="Carry-forward">
                <ul className="space-y-1 text-sm">
                  {openFromPrev.map((a) => {
                    const d = decisions[a.id] ?? "carry";
                    return (
                      <li
                        key={a.id}
                        className="flex items-center gap-2 text-muted-foreground"
                      >
                        {d === "carry" ? (
                          <Repeat2 className="size-3.5 text-warning-foreground" />
                        ) : (
                          <Trash2 className="size-3.5 text-destructive" />
                        )}
                        <span className="truncate">{a.title}</span>
                        <span className="text-border">·</span>
                        <span>{d === "carry" ? "carried" : "dropped"}</span>
                      </li>
                    );
                  })}
                </ul>
              </ReviewRow>
            ) : (
              <ReviewRow label="Carry-forward">
                <span className="text-muted-foreground">
                  Nothing to carry — clean slate.
                </span>
              </ReviewRow>
            )}

            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={() =>
                  setStage(openFromPrev.length > 0 ? "carry-over" : "setup")
                }
              >
                <ArrowLeft /> Back
              </Button>
              <Button onClick={start}>
                <Sparkles className="size-4" />
                Start retro
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StepDot({
  children,
  active,
  done,
  disabled,
}: {
  children: React.ReactNode;
  active?: boolean;
  done?: boolean;
  disabled?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1",
        active && "border-primary bg-primary/10 text-foreground",
        done && "border-success/40 bg-success/10 text-success-foreground",
        disabled && "opacity-40",
      )}
    >
      {done ? <CheckCircle2 className="size-3 text-success" /> : null}
      {children}
    </span>
  );
}

function DecisionButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-xs transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-background text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

function ReviewRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-3 text-sm">
      <span className="text-xs uppercase tracking-wide text-muted-foreground pt-0.5">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

