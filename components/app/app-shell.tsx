"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquare,
  ClipboardList,
  History,
  Lock,
  LogIn,
  LogOut,
  RotateCcw,
} from "lucide-react";
import { store, useAppState, useHydrateStore } from "@/lib/store";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/firebase/auth-context";

const NAV = [
  { href: "/", label: "Retro", icon: ClipboardList, match: (p: string) => p === "/" },
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
    href: "/korumali",
    label: "Korumalı",
    icon: Lock,
    match: (p: string) => p.startsWith("/korumali"),
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  useHydrateStore();
  const pathname = usePathname() ?? "/";
  const currentUser = useAppState((s) => s.currentUser);
  const openCount = useAppState(
    (s) => s.actions.filter((a) => a.status !== "done").length,
  );
  const { user, loading, signOut } = useAuth();

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
              <RotateCcw className="size-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">Retro Tracker</span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon, match }) => {
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

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">
              {currentUser} (Scrum Master)
            </span>
            {!loading &&
              (user ? (
                <div className="flex items-center gap-1.5">
                  <span
                    className="hidden max-w-[10rem] truncate text-xs text-slate-600 md:inline"
                    title={user.email ?? user.displayName ?? ""}
                  >
                    {user.email ?? user.displayName}
                  </span>
                  <button
                    onClick={() => {
                      void signOut();
                    }}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    title="Çıkış yap"
                  >
                    <LogOut className="size-3.5" />
                    <span className="hidden sm:inline">Çıkış</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  <LogIn className="size-3.5" />
                  <span>Giriş Yap</span>
                </Link>
              ))}
            <button
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  window.confirm("Tüm veriyi seed haline geri al?")
                ) {
                  store.reset();
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
