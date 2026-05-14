export const TODAY = "2026-05-14";

export function todayISO(): string {
  return TODAY;
}

export function nowISO(): string {
  return `${TODAY}T12:00:00.000Z`;
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a.slice(0, 10));
  const db = new Date(b.slice(0, 10));
  const ms = db.getTime() - da.getTime();
  return Math.round(ms / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso.slice(0, 10));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  const d = new Date(iso.slice(0, 10));
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelative(iso: string, from = todayISO()): string {
  const diff = daysBetween(from, iso.slice(0, 10));
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0 && diff < 14) return `in ${diff} days`;
  if (diff < 0 && diff > -14) return `${Math.abs(diff)} days ago`;
  return formatDate(iso);
}

export function isOverdue(iso: string, status: string): boolean {
  if (status === "done" || status === "dropped") return false;
  return daysBetween(todayISO(), iso) < 0;
}

export function isStale(updatedAt: string, status: string): boolean {
  if (status === "done" || status === "dropped") return false;
  return daysBetween(updatedAt.slice(0, 10), todayISO()) >= 7;
}
