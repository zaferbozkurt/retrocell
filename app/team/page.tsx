"use client";

import { useEffect, useMemo, useState } from "react";
import type { TeamMember } from "@/lib/types";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Copy,
  Crown,
  Eye,
  EyeOff,
  Link as LinkIcon,
  LogOut,
  Users,
} from "lucide-react";
import {
  getActiveRetro,
  getCurrentMember,
  getCurrentTeam,
  isScrumMaster,
  store,
  useAppState,
} from "@/lib/store";
import { COLUMN_META, type RetroItem } from "@/lib/types";
import { formatRelative } from "@/lib/date";
import { cn } from "@/lib/cn";

export default function TeamPage() {
  const team = useAppState(getCurrentTeam);
  const member = useAppState(getCurrentMember);
  const retro = useAppState(getActiveRetro);
  const sm = useAppState(isScrumMaster);
  const allItems = useAppState((s) => s.items);
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

  const items = retro
    ? allItems
        .filter((i) => i.retroId === retro.id && i.column !== "action")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <header>
        <div className="text-xs uppercase tracking-wider text-slate-500">
          Takım
        </div>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
          {team.name}
        </h1>
      </header>

      {sm ? <ShareCard inviteCode={team.inviteCode} /> : null}

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

      {sm && retro ? (
        <RevealSection retroId={retro.id} items={items} members={allMembers} />
      ) : null}

      <div className="mt-8 text-center">
        <Link
          href="/board"
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Retro Panosuna Git
        </Link>
      </div>
    </div>
  );
}

function ShareCard({ inviteCode }: { inviteCode: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const link = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/join/${encodeURIComponent(inviteCode)}`;
  }, [inviteCode]);

  const copy = async (value: string, which: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
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
        Bu linki paylaştığın kişiler takıma katılıp kendi kartlarını ekleyebilir.
      </p>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 rounded-md border border-indigo-200 bg-white px-3 py-2">
          <span className="text-xs uppercase tracking-wider text-slate-500">
            Kod
          </span>
          <code className="flex-1 truncate font-mono text-sm tracking-wider text-slate-900">
            {inviteCode}
          </code>
          <button
            onClick={() => copy(inviteCode, "code")}
            className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
          >
            {copied === "code" ? (
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

        <div className="flex items-center gap-2 rounded-md border border-indigo-200 bg-white px-3 py-2">
          <span className="text-xs uppercase tracking-wider text-slate-500">
            Link
          </span>
          <code className="flex-1 truncate font-mono text-xs text-slate-600">
            {link || "…"}
          </code>
          <button
            onClick={() => copy(link, "link")}
            disabled={!link}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            {copied === "link" ? (
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
      </div>
    </section>
  );
}

function RevealSection({
  retroId,
  items,
  members,
}: {
  retroId: string;
  items: RetroItem[];
  members: { id: string; name: string }[];
}) {
  const anyHidden = items.some((i) => !i.revealed);

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Eye className="size-4 text-slate-500" />
            Kart görünürlüğü
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Gizli kartlar üyelere sadece &ldquo;●●●&rdquo; olarak görünür.
          </p>
        </div>
        <button
          onClick={() => store.revealAllItems(retroId, anyHidden)}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {anyHidden ? (
            <>
              <Eye className="size-3.5" /> Hepsini Aç
            </>
          ) : (
            <>
              <EyeOff className="size-3.5" /> Hepsini Gizle
            </>
          )}
        </button>
      </header>
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-slate-400">
          Bu retroda henüz kart yok.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((it) => {
            const author = members.find((m) => m.id === it.authorId)?.name ?? "—";
            const meta = COLUMN_META[it.column];
            return (
              <li
                key={it.id}
                className="flex items-start justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        meta.chip,
                      )}
                    >
                      {meta.emoji} {meta.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {author}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-900">{it.text}</p>
                </div>
                <button
                  onClick={() => store.revealItem(it.id, !it.revealed)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium",
                    it.revealed
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                  title={
                    it.revealed
                      ? "Sadece sahibine ve sana göster"
                      : "Tüm takıma aç"
                  }
                >
                  {it.revealed ? (
                    <>
                      <Eye className="size-3" /> Açık
                    </>
                  ) : (
                    <>
                      <EyeOff className="size-3" /> Gizli
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
