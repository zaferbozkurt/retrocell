export const TODAY = "2026-05-14";

export function todayISO(): string {
  return TODAY;
}

export function nowISO(): string {
  return `${TODAY}T12:00:00.000Z`;
}

export function daysAgo(iso: string): number {
  const d = new Date(iso.slice(0, 10));
  const t = new Date(TODAY);
  return Math.round((t.getTime() - d.getTime()) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso.slice(0, 10));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  const d = new Date(iso.slice(0, 10));
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatRelative(iso: string): string {
  const d = daysAgo(iso);
  if (d === 0) return "bugün";
  if (d === 1) return "dün";
  if (d > 1 && d < 30) return `${d} gün önce`;
  if (d >= 30 && d < 60) return `${Math.floor(d / 7)} hafta önce`;
  return formatDate(iso);
}
