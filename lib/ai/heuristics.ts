import type {
  ActionItem,
  ColumnId,
  Member,
  Retro,
  RetroItem,
} from "@/lib/types";
import { daysBetween, todayISO } from "@/lib/date";

// ─── Tiny, deterministic NLP helpers ────────────────────────────────────────

const ACTION_HINT_VERBS = [
  "fix",
  "ship",
  "decide",
  "decided",
  "send",
  "draft",
  "schedule",
  "set up",
  "setup",
  "investigate",
  "follow up",
  "follow-up",
  "create",
  "build",
  "write",
  "review",
  "move",
  "migrate",
  "remove",
  "add",
  "configure",
  "audit",
  "talk to",
  "circle back",
  "loop in",
  "open a ticket",
  "file a bug",
  "document",
  "automate",
  "test",
  "clean up",
  "refactor",
  "deprecate",
  "pilot",
  "trial",
  "rfc",
];

const OWNER_HINT = /@(\w+)|\b(zafer|selin|mert|aylin|burak|deniz)\b/i;

function splitLines(text: string): string[] {
  // Split on bullets, numbered items, newlines AND sentence boundaries
  // (period/exclam/question followed by whitespace).
  return text
    .replace(/\r/g, "")
    .split(/\n+|[•\-*]\s+|\d+[.)]\s+|(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ@])/g)
    .map((l) => l.trim())
    .filter((l) => l.length > 4);
}

function looksLikeAction(line: string): boolean {
  const lower = line.toLowerCase();
  if (lower.includes("action:") || lower.includes("todo:") || lower.includes("to do:"))
    return true;
  if (lower.startsWith("- [ ]")) return true;
  if (lower.includes("will ") || lower.includes("we should ") || lower.includes("need to ")) {
    return true;
  }
  return ACTION_HINT_VERBS.some((v) => {
    const re = new RegExp(`(^|[\\s])${v}\\b`, "i");
    return re.test(lower);
  });
}

function guessOwner(line: string, members: Member[]): string | undefined {
  const match = line.match(OWNER_HINT);
  if (!match) return undefined;
  const name = (match[1] ?? match[2] ?? "").toLowerCase();
  if (!name) return undefined;
  return members.find(
    (m) =>
      m.name.toLowerCase().startsWith(name) ||
      m.name.toLowerCase().split(" ").some((p) => p === name),
  )?.id;
}

function inferDueDays(line: string): number {
  const lower = line.toLowerCase();
  if (/asap|today|urgent/.test(lower)) return 2;
  if (/this sprint|by friday/.test(lower)) return 7;
  if (/next sprint|2 weeks/.test(lower)) return 14;
  if (/next month|long term/.test(lower)) return 30;
  return 10;
}

function cleanTitle(line: string): string {
  return line
    .replace(/^(action|todo|to do|task)\s*:\s*/i, "")
    .replace(/^- \[ \]\s*/, "")
    .replace(/^@\w+\s+/i, "")
    .trim()
    .replace(/\.$/, "");
}

export type SuggestedAction = {
  title: string;
  ownerId?: string;
  dueOffsetDays: number;
  confidence: number;
};

export function heuristicExtractActions(
  text: string,
  members: Member[],
): SuggestedAction[] {
  const lines = splitLines(text);
  const suggestions: SuggestedAction[] = [];
  for (const line of lines) {
    if (!looksLikeAction(line)) continue;
    const ownerId = guessOwner(line, members);
    const title = cleanTitle(line);
    if (title.length < 6) continue;
    const dueOffsetDays = inferDueDays(line);
    const confidence = Math.min(
      0.9,
      0.5 + (ownerId ? 0.2 : 0) + (line.length > 40 ? 0.1 : 0),
    );
    suggestions.push({ title, ownerId, dueOffsetDays, confidence });
  }
  // Dedup by title prefix
  const seen = new Set<string>();
  return suggestions.filter((s) => {
    const key = s.title.slice(0, 24).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Retro summary ──────────────────────────────────────────────────────────

export function heuristicSummarizeRetro(input: {
  retro: Retro;
  items: RetroItem[];
  actions: ActionItem[];
  members: Member[];
}): string {
  const { retro, items, actions, members } = input;
  const byCol = (c: ColumnId) => items.filter((i) => i.columnId === c);

  const wentWell = byCol("went-well");
  const didntGoWell = byCol("didnt-go-well");
  const ideas = byCol("ideas");
  const shoutouts = byCol("shoutouts");

  const topWentWell = [...wentWell].sort((a, b) => b.votes.length - a.votes.length)[0];
  const topPain = [...didntGoWell].sort((a, b) => b.votes.length - a.votes.length)[0];

  const owners = new Map<string, number>();
  for (const a of actions) owners.set(a.ownerId, (owners.get(a.ownerId) ?? 0) + 1);
  const topOwner = [...owners.entries()].sort((a, b) => b[1] - a[1])[0];

  const sentences: string[] = [];

  if (topWentWell) {
    sentences.push(`Biggest win: ${stripTrailing(topWentWell.content)}.`);
  }
  if (topPain) {
    sentences.push(
      `Top friction: ${stripTrailing(topPain.content)} (${topPain.votes.length} votes).`,
    );
  }
  if (ideas.length) {
    sentences.push(
      `${ideas.length} idea${ideas.length === 1 ? "" : "s"} to explore${ideas[0] ? `, starting with ${stripTrailing(ideas[0].content)}` : ""}.`,
    );
  }
  if (shoutouts.length) {
    sentences.push(`${shoutouts.length} shoutout${shoutouts.length === 1 ? "" : "s"} captured.`);
  }
  if (actions.length) {
    const ownerName = topOwner
      ? members.find((m) => m.id === topOwner[0])?.name?.split(" ")[0]
      : undefined;
    sentences.push(
      `${actions.length} action item${actions.length === 1 ? "" : "s"} captured${ownerName ? `, with ${ownerName} carrying ${topOwner?.[1]}` : ""}.`,
    );
  }
  if (!sentences.length) {
    sentences.push(`Quiet retro for ${retro.sprintLabel ?? retro.title}.`);
  }
  return sentences.join(" ");
}

function stripTrailing(s: string): string {
  return s.replace(/[.!?]+$/, "");
}

// ─── Nudge draft ────────────────────────────────────────────────────────────

export function heuristicNudge(input: {
  action: ActionItem;
  owner: Member | undefined;
  retroTitle: string;
  fromName: string;
}): string {
  const { action, owner, retroTitle, fromName } = input;
  const ownerFirst = owner?.name.split(" ")[0] ?? "there";
  const days = daysBetween(todayISO(), action.dueDate);
  const overdueBit =
    days < 0
      ? `It's now ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} past its due date`
      : days === 0
      ? `It's due today`
      : `It's due in ${days} day${days === 1 ? "" : "s"}`;
  const carryBit =
    action.carriedOverCount > 0
      ? ` and we've carried it forward ${action.carriedOverCount} time${action.carriedOverCount === 1 ? "" : "s"} already`
      : "";
  const detailBit = action.detail ? ` — quick recap: "${action.detail.slice(0, 90)}${action.detail.length > 90 ? "…" : ""}"` : "";
  return [
    `Hey ${ownerFirst},`,
    ``,
    `Quick nudge on "${action.title}" from ${retroTitle}.${detailBit}`,
    `${overdueBit}${carryBit}. Want to grab 15 minutes to unblock it, or should we re-scope?`,
    ``,
    `— ${fromName.split(" ")[0]}`,
  ].join("\n");
}

// ─── Insights across retros ─────────────────────────────────────────────────

export type RetroInsight = {
  kind: "recurring_theme" | "completion" | "stale" | "owner_balance" | "carry_over";
  title: string;
  body: string;
  severity: "info" | "warning" | "success";
};

export function heuristicInsights(input: {
  retros: Retro[];
  items: RetroItem[];
  actions: ActionItem[];
  members: Member[];
}): RetroInsight[] {
  const { retros, items, actions, members } = input;
  const insights: RetroInsight[] = [];

  // 1. Recurring themes — words appearing in "didnt-go-well" across multiple retros.
  const negPerRetro = new Map<string, Set<string>>();
  for (const item of items) {
    if (item.columnId !== "didnt-go-well") continue;
    const words = tokenize(item.content);
    for (const w of words) {
      const set = negPerRetro.get(w) ?? new Set<string>();
      set.add(item.retroId);
      negPerRetro.set(w, set);
    }
  }
  const recurring = [...negPerRetro.entries()]
    .filter(([w, retroSet]) => retroSet.size >= 2 && w.length > 4)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 3);
  for (const [word, retroSet] of recurring) {
    insights.push({
      kind: "recurring_theme",
      title: `"${word}" came up in ${retroSet.size} retros`,
      body: `The team has flagged this theme repeatedly. Worth a focused decision rather than another sticky.`,
      severity: "warning",
    });
  }

  // 2. Completion rate of closed retros' actions
  const closedRetroIds = new Set(retros.filter((r) => r.status === "closed").map((r) => r.id));
  const closedActions = actions.filter((a) => closedRetroIds.has(a.retroId));
  if (closedActions.length) {
    const done = closedActions.filter((a) => a.status === "done").length;
    const rate = Math.round((done / closedActions.length) * 100);
    insights.push({
      kind: "completion",
      title: `${rate}% of past actions shipped`,
      body: `${done} of ${closedActions.length} actions from closed retros reached "done". Anything above 70% is healthy.`,
      severity: rate >= 70 ? "success" : rate >= 50 ? "info" : "warning",
    });
  }

  // 3. Stale actions (>7 days no update, not done/dropped)
  const stale = actions.filter(
    (a) =>
      a.status !== "done" &&
      a.status !== "dropped" &&
      daysBetween(a.updatedAt.slice(0, 10), todayISO()) >= 7,
  );
  if (stale.length) {
    insights.push({
      kind: "stale",
      title: `${stale.length} action${stale.length === 1 ? "" : "s"} haven't moved in over a week`,
      body: `Stale actions are the #1 way good retros lose their value. Nudge owners or carry-forward with a decision.`,
      severity: "warning",
    });
  }

  // 4. Carry-over loops
  const heavyCarry = actions.filter((a) => a.carriedOverCount >= 1 && a.status !== "done");
  if (heavyCarry.length) {
    insights.push({
      kind: "carry_over",
      title: `${heavyCarry.length} action${heavyCarry.length === 1 ? "" : "s"} have been carried forward`,
      body: `Carry-overs aren't bad — but if one slips twice, it usually means the scope is wrong. Try splitting or re-owning.`,
      severity: "info",
    });
  }

  // 5. Owner load balance
  const load = new Map<string, number>();
  for (const a of actions) {
    if (a.status === "done" || a.status === "dropped") continue;
    load.set(a.ownerId, (load.get(a.ownerId) ?? 0) + 1);
  }
  const sorted = [...load.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length >= 2) {
    const [topId, topCount] = sorted[0];
    const avg =
      sorted.reduce((sum, [, c]) => sum + c, 0) / sorted.length;
    if (topCount >= 3 && topCount > avg * 1.5) {
      const name = members.find((m) => m.id === topId)?.name.split(" ")[0] ?? "Someone";
      insights.push({
        kind: "owner_balance",
        title: `${name} is carrying ${topCount} open actions`,
        body: `That's significantly above the team average. Consider rebalancing before the next retro.`,
        severity: "warning",
      });
    }
  }

  return insights;
}

const STOPWORDS = new Set([
  "this",
  "that",
  "with",
  "from",
  "have",
  "been",
  "into",
  "they",
  "them",
  "were",
  "where",
  "when",
  "what",
  "which",
  "their",
  "there",
  "some",
  "still",
  "every",
  "about",
  "would",
  "could",
  "should",
  "really",
  "just",
  "much",
  "many",
  "team",
  "sprint",
  "thing",
  "things",
  "week",
  "weeks",
  "going",
  "doing",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{Letter}\s'-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !STOPWORDS.has(w));
}

// ─── Detect actions inside a retro's content ────────────────────────────────

export function heuristicSuggestFromItems(input: {
  items: RetroItem[];
  members: Member[];
}): SuggestedAction[] {
  const concatenated = input.items
    .filter((i) => i.columnId === "didnt-go-well" || i.columnId === "ideas")
    .map((i) => i.content)
    .join("\n");
  return heuristicExtractActions(concatenated, input.members);
}
