"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Copy,
  Crown,
  Link as LinkIcon,
  LogOut,
  Users,
} from "lucide-react";
import {
  getCurrentMember,
  getCurrentTeam,
  isScrumMaster,
  store,
  useAppState,
} from "@/lib/store";
import type { TeamMember } from "@/lib/types";
import { formatRelative } from "@/lib/date";
import { cn } from "@/lib/cn";

export default function TeamPage() {
  const team = useAppState(getCurrentTeam);
  const member = useAppState(getCurrentMember);
  const sm = useAppState(isScrumMaster);
  const membersRaw = useAppState((s) => s.members);
  const allMembers: TeamMember[] = useMemo(
    () => (team ? membersRaw.filter((m) => m.teamId === team.id) : []),
    [team, membersRaw],
  );
  const router = useRouter();

  useEffect(() => {
    if (!team || !member) router.replace("/");
  }, [team, member, router]);

  if (!team || !member) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-500">
        Yönlendiriliyor…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <header>
        <div className="text-xs uppercase tracking-wider text-slate-500">
          Takım
        </div>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
          {team.name}
        </h1>
        <p className="mt-1 font-mono text-[11px] text-slate-500">
          /board/{team.slug}
        </p>
      </header>

      {sm ? <ShareCard slug={team.slug} /> : null}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Users className="size-4 text-slate-500" />
            Üyeler
            <span className="text-xs font-normal text-slate-500">
              ({allMembers.length})
            </span>
          </h2>
          <button
            onClick={() => {
              if (window.confirm("Takımdan çıkmak istediğine emin misin?")) {
                store.signOut();
                router.push("/");
              }
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut className="size-3.5" />
            Çıkış
          </button>
        </header>
        <ul className="divide-y divide-slate-100">
          {allMembers.map((m) => {
            const isYou = m.id === member.id;
            return (
              <li
                key={m.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "inline-flex size-8 items-center justify-center rounded-full text-xs font-semibold",
                      m.role === "scrum_master"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-slate-100 text-slate-700",
                    )}
                  >
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <div className="font-medium text-slate-900">
                      {m.name}
                      {isYou ? (
                        <span className="ml-1 text-xs font-normal text-slate-400">
                          (sen)
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-slate-500">
                      katıldı · {formatRelative(m.joinedAt)}
                    </div>
                  </div>
                </div>
                {m.role === "scrum_master" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                    <Crown className="size-3" />
                    Scrum Master
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500">Üye</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8 text-center">
        <Link
          href={`/board/${team.slug}`}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Retro Panosuna Git
        </Link>
      </div>
    </div>
  );
}

function ShareCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const link = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/board/${slug}`;
  }, [slug]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-indigo-900">
        <LinkIcon className="size-4" />
        Davet Bağlantısı
      </h2>
      <p className="mt-1 text-xs text-indigo-900/70">
        Bu linki paylaştığın kişiler katılımcı olarak takıma düşer.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-md border border-indigo-200 bg-white px-3 py-2">
        <code className="flex-1 truncate font-mono text-xs text-slate-700">
          {link || "…"}
        </code>
        <button
          onClick={copy}
          disabled={!link}
          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {copied ? (
            <>
              <Check className="size-3" />
              Kopyalandı
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Kopyala
            </>
          )}
        </button>
      </div>
    </section>
  );
}
