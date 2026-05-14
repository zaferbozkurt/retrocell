"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MemberStack } from "@/components/app/member-avatar";
import { RetroColumn } from "@/components/app/retro-column";
import { ActionCard } from "@/components/app/action-card";
import { ExtractActionsPanel } from "@/components/app/extract-actions-panel";
import { NewActionDialog } from "@/components/app/new-action-dialog";
import {
  getPreviousRetro,
  store,
  useAppState,
} from "@/lib/store";
import { formatDate } from "@/lib/date";
import { COLUMN_META, type ColumnId } from "@/lib/types";
import { aiSummarize } from "@/lib/ai/client";

const COLUMNS: ColumnId[] = [
  "went-well",
  "didnt-go-well",
  "ideas",
  "shoutouts",
];

export default function RetroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const state = useAppState((s) => s);
  const retro = state.retros.find((r) => r.id === id);
  const items = state.retroItems.filter((i) => i.retroId === id);
  const actions = state.actions.filter((a) => a.retroId === id);
  const prev = getPreviousRetro(state, id);
  const carriedActions = actions.filter((a) => a.carriedOverCount > 0);

  const [actionOpen, setActionOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [draftSummary, setDraftSummary] = useState<string>("");
  const [summarySource, setSummarySource] = useState<"model" | "heuristic" | null>(
    null,
  );

  if (!retro) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-muted-foreground">
          Retro not found.{" "}
          <Link href="/retros" className="underline">
            Back to retros
          </Link>
          .
        </p>
      </div>
    );
  }

  const readOnly = retro.status === "closed";
  const members = state.members.filter((m) => retro.participants.includes(m.id));

  async function generateSummary() {
    if (!retro) return;
    setGeneratingSummary(true);
    try {
      const res = await aiSummarize(retro, items, actions, state.members);
      setDraftSummary(res.data);
      setSummarySource(res.source);
    } catch {
      toast.error("Couldn't draft summary.");
    } finally {
      setGeneratingSummary(false);
    }
  }

  async function startClose() {
    setClosing(true);
    if (!draftSummary) {
      await generateSummary();
    }
  }

  function confirmClose() {
    store.closeRetro(retro!.id, draftSummary);
    toast.success("Retro closed. Carry the open actions into the next one.");
    setClosing(false);
    router.refresh();
  }

  function reopen() {
    store.reopenRetro(retro!.id);
    toast.success("Retro reopened.");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <Link
        href="/retros"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All retros
      </Link>

      <header className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {retro.title}
            </h1>
            <Badge
              variant={
                retro.status === "live"
                  ? "info"
                  : retro.status === "closed"
                  ? "secondary"
                  : "outline"
              }
            >
              {retro.status === "closed" ? (
                <>
                  <Lock className="size-3" /> closed
                </>
              ) : (
                retro.status
              )}
            </Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{formatDate(retro.createdAt)}</span>
            <span>·</span>
            <span>{members.length} participants</span>
            {prev ? (
              <>
                <span>·</span>
                <span>
                  following{" "}
                  <Link
                    href={`/retros/${prev.id}`}
                    className="underline hover:text-foreground"
                  >
                    {prev.title}
                  </Link>
                </span>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MemberStack members={members} size="sm" max={6} />
          {readOnly ? (
            <Button variant="outline" size="sm" onClick={reopen}>
              <RotateCcw className="size-3.5" />
              Reopen
            </Button>
          ) : (
            <Button onClick={startClose} disabled={closing}>
              <CheckCircle2 className="size-4" />
              Close retro
            </Button>
          )}
        </div>
      </header>

      {retro.summary ? (
        <div className="mt-5 rounded-md border bg-card p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-info" />
            Summary
          </div>
          <p className="mt-1 text-sm leading-relaxed">{retro.summary}</p>
        </div>
      ) : null}

      {carriedActions.length > 0 ? (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-warning-foreground" />
              Carried in from {prev?.title ?? "the previous retro"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These actions didn&apos;t ship last sprint. They&apos;re tracked
              here so the team can&apos;t walk away without a fresh decision.
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {carriedActions.map((a) => (
              <ActionCard key={a.id} action={a} />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => (
          <RetroColumn
            key={col}
            retroId={retro.id}
            columnId={col}
            items={items.filter((i) => i.columnId === col)}
            readOnly={readOnly}
          />
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Action items captured here</CardTitle>
              <p className="text-sm text-muted-foreground">
                {actions.length === 0
                  ? "No actions captured yet. Use the AI panel or convert a sticky."
                  : `${actions.length} captured · ${actions.filter((a) => a.status === "done").length} shipped.`}
              </p>
            </div>
            {!readOnly ? (
              <Button size="sm" onClick={() => setActionOpen(true)}>
                Add action
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {actions.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Once you capture an action, it gets an owner and a due date and
                lives in the Action Hub until shipped.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {actions.map((a) => (
                  <ActionCard key={a.id} action={a} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {!readOnly ? (
          <Card className="self-start">
            <CardHeader>
              <CardTitle className="text-base">AI assist</CardTitle>
            </CardHeader>
            <CardContent>
              <ExtractActionsPanel retroId={retro.id} retroItems={items} />
            </CardContent>
          </Card>
        ) : null}
      </section>

      <NewActionDialog
        open={actionOpen}
        onOpenChange={setActionOpen}
        retroId={retro.id}
      />

      {/* Close-retro inline panel */}
      {closing ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center">
          <div className="m-4 w-full max-w-xl rounded-lg border bg-background p-5 shadow-xl">
            <div className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="size-4 text-info" />
              Closing {retro.title}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              RetroLoop drafted a summary{" "}
              {summarySource ? (
                <Badge variant="outline" className="text-[10px]">
                  {summarySource === "model" ? "via LLM" : "via heuristic"}
                </Badge>
              ) : null}
              . Edit before locking the retro.
            </p>
            {generatingSummary ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Drafting summary…
              </div>
            ) : (
              <Textarea
                rows={6}
                className="mt-4"
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
              />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setClosing(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={generateSummary}
                disabled={generatingSummary}
              >
                <Sparkles className="size-3.5" /> Regenerate
              </Button>
              <Button onClick={confirmClose} disabled={generatingSummary}>
                <Lock className="size-3.5" /> Close retro
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Visual hint for column meta in the legend (mobile) */}
      <div className="sr-only">
        {Object.values(COLUMN_META).map((m) => m.title)}
      </div>
    </div>
  );
}
