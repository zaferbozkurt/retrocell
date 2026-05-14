"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { store, useAppState, useHydrateStore } from "@/lib/store";

export default function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  useHydrateStore();
  const { code: rawCode } = use(params);
  const code = decodeURIComponent(rawCode).toUpperCase();
  const teams = useAppState((s) => s.teams);
  const currentTeamId = useAppState((s) => s.currentTeamId);
  const currentUserId = useAppState((s) => s.currentUserId);
  const router = useRouter();

  const team = teams.find((t) => t.inviteCode.toUpperCase() === code);

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // If already on this team, just go to the board.
  useEffect(() => {
    if (!team) return;
    if (currentTeamId === team.id && currentUserId) router.replace("/board");
  }, [team, currentTeamId, currentUserId, router]);

  if (!team) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Geçersiz davet kodu</h1>
        <p className="mt-2 text-sm text-slate-600">
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
            {code}
          </code>{" "}
          kodlu bir takım bulunamadı.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = store.joinTeam({
      inviteCode: code,
      memberName: name.trim(),
    });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push("/board");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <form
        onSubmit={submit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
            <Users className="size-4" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              {team.name}
            </h1>
            <p className="text-xs text-slate-500">Takıma katılıyorsun</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">
              Senin ismin
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ör. Mehmet"
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          Katıl
          <ArrowRight className="size-4" />
        </button>

        <p className="mt-3 text-center text-[11px] text-slate-500">
          Davet kodu:{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">
            {team.inviteCode}
          </code>
        </p>
      </form>
    </div>
  );
}
