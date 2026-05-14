import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Repeat,
  Sparkles,
  Target,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/cn";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <section className="flex flex-col items-center text-center">
        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="size-3" /> Retro &amp; Action Tracker
        </Badge>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Run retros that
          <span className="bg-gradient-to-r from-info via-primary to-success bg-clip-text text-transparent">
            {" "}
            don&apos;t evaporate.
          </span>
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
          Most teams do their retros in Miro or a doc, write down action items,
          and then forget them. RetroLoop closes the loop: every retro produces
          owned, dated actions — and every following retro begins with the open
          ones still on the table.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
            Open the dashboard <ArrowRight />
          </Link>
          <Link
            href="/retros/new"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
          >
            Start a new retro
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={<Repeat className="size-5 text-info" />}
          title="Carry-forward enforcement"
          body="When you start a new retro, RetroLoop pulls every unresolved action from the last one into a review step. You can't move on without a decision."
        />
        <FeatureCard
          icon={<BellRing className="size-5 text-warning" />}
          title="AI nudges &amp; stale detective"
          body="Actions that haven't moved in a week, or that are overdue, get flagged. One click drafts a warm, contextual nudge to the owner."
        />
        <FeatureCard
          icon={<Workflow className="size-5 text-success" />}
          title="Paste-to-actions extractor"
          body="Already ran the retro elsewhere? Paste the raw notes — RetroLoop extracts concrete actions with proposed owners and due dates."
        />
        <FeatureCard
          icon={<CheckCircle2 className="size-5 text-success" />}
          title="Personal action inbox"
          body="Every member sees their own open, blocked, and overdue actions across all retros — not buried inside one Miro board."
        />
        <FeatureCard
          icon={<Target className="size-5 text-primary" />}
          title="Recurring-theme detector"
          body="If 'standup overruns' shows up in three retros, you'll see it. Stop re-discussing the same problem until you commit to fixing it."
        />
        <FeatureCard
          icon={<Sparkles className="size-5 text-info" />}
          title="Auto-summary when you close"
          body="Closing a retro generates a sharable summary — biggest win, top friction, recurring themes, action ownership."
        />
      </section>

      <section className="mt-20 rounded-2xl border bg-card p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              The forgotten-action-item problem
            </h2>
            <p className="mt-3 text-muted-foreground">
              A retrospective is only valuable if it changes what happens next.
              In practice, teams capture great action items, paste them in a
              channel, and never see them again — until the same complaint
              shows up two sprints later.
            </p>
            <ol className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <Step n={1} />
                <span>
                  Run the retro inside RetroLoop with sticky notes, voting, and
                  shoutouts — or paste in raw notes from anywhere else.
                </span>
              </li>
              <li className="flex gap-3">
                <Step n={2} />
                <span>
                  Convert friction and ideas into owned, dated action items.
                  AI proposes them; humans decide.
                </span>
              </li>
              <li className="flex gap-3">
                <Step n={3} />
                <span>
                  Between retros, owners update status from their personal
                  inbox. Stale items get flagged automatically.
                </span>
              </li>
              <li className="flex gap-3">
                <Step n={4} />
                <span>
                  Start the next retro — the open ones are waiting. You either
                  ship them, re-scope them, or explicitly drop them.
                </span>
              </li>
            </ol>
          </div>
          <div className="rounded-xl border bg-background p-5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge variant="info">Demo data</Badge>
            </div>
            <p className="mt-3">
              The app is seeded with three sprints of retros, six teammates, and
              a recurring theme (&ldquo;standup overruns&rdquo;) that&apos;s slipped through
              two retros — so you can see the carry-forward and recurring-theme
              detection in action immediately.
            </p>
            <Link
              href="/insights"
              className={cn(
                buttonVariants({ variant: "link" }),
                "mt-2 px-0",
              )}
            >
              See the recurring theme RetroLoop caught <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="mb-3 inline-flex size-9 items-center justify-center rounded-md bg-accent/60">
        {icon}
      </div>
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-foreground">
      {n}
    </span>
  );
}
