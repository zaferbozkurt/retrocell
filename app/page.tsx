"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, KeyRound, Users } from "lucide-react";
import { slugify, store, useAppState, useHydrateStore } from "@/lib/store";

export default function LandingPage() {
  useHydrateStore();
  const currentTeamId = useAppState((s) => s.currentTeamId);
  const currentUserId = useAppState((s) => s.currentUserId);
  const teams = useAppState((s) => s.teams);
  const router = useRouter();

  useEffect(() => {
    if (!currentTeamId || !currentUserId) return;
    const t = teams.find((x) => x.id === currentTeamId);
    if (t) router.replace(`/board/${t.slug}`);
  }, [currentTeamId, currentUserId, teams, router]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <div className="text-center">
        <div className="inline-flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="RetroCell"
            width={48}
            height={48}
            className="size-12 object-contain"
            priority
          />
          <span className="text-2xl font-semibold tracking-tight text-slate-900">
            RetroCell
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          Takımınla retroyu tek panoda topla
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 md:text-base">
          Bir takım oluştur, oluşan bağlantıyı paylaş. Farklı tarayıcıdan giren
          herkes katılımcı olarak takıma düşer.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <CreateTeamCard />
        <JoinTeamCard />
      </div>

      <RecentTeams teams={teams} />
    </div>
  );
}

function CreateTeamCard() {
  const [teamName, setTeamName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teamName.trim() || !ownerName.trim()) {
      setError("Takım adı ve isim gerekli.");
      return;
    }
    const { team } = store.createTeam({
      name: teamName.trim(),
      scrumMasterName: ownerName.trim(),
    });
    router.push(`/board/${team.slug}`);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-indigo-600 text-white">
          <Users className="size-4" />
        </span>
        <h2 className="text-lg font-semibold">Takım Oluştur</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Bir takım kurarsan Scrum Master sen olursun.
      </p>

      <div className="mt-5 space-y-3">
        <Field
          label="Takım adı"
          value={teamName}
          onChange={setTeamName}
          placeholder="ör. Pixel Squad"
        />
        <Field
          label="Senin ismin"
          value={ownerName}
          onChange={setOwnerName}
          placeholder="ör. Ayşe"
        />
      </div>

      {teamName.trim() ? (
        <p className="mt-3 text-[11px] text-slate-500">
          Link:{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">
            /board/{slugify(teamName)}
          </code>
        </p>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Takımı Oluştur
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}

function JoinTeamCard() {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!slug.trim() || !name.trim()) {
      setError("Takım adı/slug ve isim gerekli.");
      return;
    }
    const result = store.joinTeamBySlug({
      slug: slugify(slug),
      memberName: name.trim(),
    });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push(`/board/${result.team.slug}`);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex size-8 items-center justify-center rounded-md bg-slate-900 text-white">
          <KeyRound className="size-4" />
        </span>
        <h2 className="text-lg font-semibold">Takıma Katıl</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Sana paylaşılan takım adı veya bağlantısı yeterli.
      </p>

      <div className="mt-5 space-y-3">
        <Field
          label="Takım slug / adı"
          value={slug}
          onChange={setSlug}
          placeholder="ör. pixel-squad"
          mono
        />
        <Field
          label="Senin ismin"
          value={name}
          onChange={setName}
          placeholder="ör. Mehmet"
        />
      </div>

      {error ? (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        Katıl
        <ArrowRight className="size-4" />
      </button>

      <p className="mt-3 text-center text-[11px] text-slate-500">
        Demo:{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">
          pixel-squad
        </code>
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 " +
          (mono ? "font-mono tracking-wider" : "")
        }
      />
    </label>
  );
}

function RecentTeams({
  teams,
}: {
  teams: { id: string; name: string; slug: string }[];
}) {
  if (!teams.length) return null;
  return (
    <section className="mt-10">
      <div className="text-xs uppercase tracking-wider text-slate-500">
        Bu tarayıcıdaki takımlar
      </div>
      <ul className="mt-2 divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {teams.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between px-4 py-3 text-sm"
          >
            <div>
              <div className="font-medium">{t.name}</div>
              <div className="font-mono text-[11px] text-slate-500">
                /board/{t.slug}
              </div>
            </div>
            <Link
              href={`/board/${t.slug}`}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Aç
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
