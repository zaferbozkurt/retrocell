"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CheckSquare,
  LayoutDashboard,
  Lightbulb,
  RefreshCcw,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { MemberAvatar } from "@/components/app/member-avatar";
import { cn } from "@/lib/cn";
import {
  store,
  useAppState,
  useHydrateStore,
} from "@/lib/store";
import { isOverdue, isStale } from "@/lib/date";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/retros", label: "Retros", icon: Repeat },
  { href: "/actions", label: "Actions", icon: CheckSquare },
  { href: "/insights", label: "Insights", icon: BarChart3 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  useHydrateStore();
  const pathname = usePathname() ?? "/";
  const teamName = useAppState((s) => s.teamName);
  const currentUserId = useAppState((s) => s.currentUserId);
  const members = useAppState((s) => s.members);
  const actions = useAppState((s) => s.actions);
  const currentUser = members.find((m) => m.id === currentUserId);

  const openActions = actions.filter(
    (a) => a.status !== "done" && a.status !== "dropped",
  );
  const myOpen = openActions.filter((a) => a.ownerId === currentUserId);
  const stalest = openActions.filter(
    (a) => isOverdue(a.dueDate, a.status) || isStale(a.updatedAt, a.status),
  ).length;

  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r bg-card px-3 py-5 md:flex">
        <Link href="/" className="mb-4 flex items-center gap-2 px-3">
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <RefreshCcw className="size-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">RetroLoop</span>
        </Link>
        <div className="mb-2 px-3 text-xs text-muted-foreground">
          {teamName}
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  {label}
                </span>
                {label === "Actions" && myOpen.length > 0 ? (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {myOpen.length}
                  </Badge>
                ) : null}
                {label === "Insights" && stalest > 0 ? (
                  <Badge variant="warning" className="h-5 px-1.5 text-[10px]">
                    {stalest}
                  </Badge>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 rounded-lg border bg-background/60 p-3 text-xs text-muted-foreground">
          <div className="mb-1 flex items-center gap-1.5 text-foreground">
            <Lightbulb className="size-3.5" /> The loop
          </div>
          <p className="leading-relaxed">
            Every retro ends with owners and dates. RetroLoop carries unfinished
            actions to the next retro so nothing falls through.
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
          <div className="flex items-center gap-2">
            <MemberAvatar member={currentUser ?? undefined} size="sm" withTooltip={false} />
            <div className="leading-tight">
              <div className="font-medium text-foreground">{currentUser?.name}</div>
              <div className="text-muted-foreground">{currentUser?.role}</div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </aside>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <RefreshCcw className="size-3.5" />
            </span>
            <span className="text-base font-semibold">RetroLoop</span>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2">
            {stalest > 0 ? (
              <Link
                href="/actions?filter=needs-attention"
                className="flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-xs font-medium text-warning-foreground"
              >
                <Bell className="size-3.5" />
                {stalest} action{stalest === 1 ? "" : "s"} need attention
              </Link>
            ) : null}
            <Button asChild size="sm">
              <Link href="/retros/new">Start retro</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  window.confirm("Reset all data to the seeded demo state?")
                ) {
                  store.reset();
                }
              }}
            >
              <RefreshCcw className="size-3.5" />
              <span className="hidden lg:inline">Reset demo</span>
            </Button>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
