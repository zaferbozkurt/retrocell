"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CheckSquare,
  ClipboardList,
  Crown,
  History,
  LogOut,
  RotateCcw,
  Users,
} from "lucide-react";
import {
  getCurrentMember,
  getCurrentTeam,
  isScrumMaster,
  store,
  useAppState,
  useHydrateStore,
} from "@/lib/store";
import { cn } from "@/lib/cn";

export function AppShell({ children }: { children: React.ReactNode }) {
  useHydrateStore();
  const pathname = usePathname() ?? "/";
  const team = useAppState(getCurrentTeam);
  const member = useAppState(getCurrentMember);
  const sm = useAppState(isScrumMaster);
  const allActions = useAppState((s) => s.actions);
  const retros = useAppState((s) => s.retros);
  const router = useRouter();

  const openCount = team
    ? allActions.filter(
        (a) =>
          a.status !== "done" &&
          retros.find((r) => r.id === a.retroId)?.teamId === team.id,
      ).length
    : 0;

  const hasSession = !!team && !!member;

  const nav = team
    ? [
        {
          href: `/board/${team.slug}`,
          label: "Retro",
          icon: ClipboardList,
          match: (p: string) => p.startsWith("/board"),
        },
        {
          href: "/actions",
          label: "Aksiyonlar",
          icon: CheckSquare,
          match: (p: string) => p.startsWith("/actions"),
        },
        {
          href: "/history",
          label: "Geçmiş",
          icon: History,
          match: (p: string) => p.startsWith("/history"),
        },
        {
          href: "/team",
          label: "Takım",
          icon: Users,
          match: (p: string) => p.startsWith("/team"),
        },
      ]
    : [];

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link
            href={team ? `/board/${team.slug}` : "/"}
            className="flex items-center gap-2"
          >
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
              <RotateCcw className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              RetroCell
            </span>
            {team ? (
              <span className="ml-2 hidden text-sm text-slate-500 sm:inline">
                · {team.name}
              </span>
            ) : null}
          </Link>

          {hasSession ? (
            <nav className="flex items-center gap-1">
              {nav.map(({ href, label, icon: Icon, match }) => {
                const active = match(pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{label}</span>
                    {label === "Aksiyonlar" && openCount > 0 ? (
                      <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold text-white">
                        {openCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          <div className="flex items-center gap-2">
            {hasSession ? (
              <>
                <span
                  className={cn(
                    "hidden items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium sm:inline-flex",
                    sm
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-slate-100 text-slate-700",
                  )}
                  title={sm ? "Scrum Master" : "Üye"}
                >
                  {sm ? <Crown className="size-3" /> : null}
                  {member?.name}
                </span>
                <button
                  onClick={() => {
                    if (window.confirm("Çıkış yap?")) {
                      store.signOut();
                      router.push("/");
                    }
                  }}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  title="Çıkış yap"
                >
                  <LogOut className="size-3.5" />
                  <span className="hidden sm:inline">Çıkış</span>
                </button>
              </>
            ) : null}
            <button
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  window.confirm("Tüm veriyi seed haline geri al?")
                ) {
                  store.reset();
                  router.push("/");
                }
              }}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              title="Demo'yu sıfırla"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
