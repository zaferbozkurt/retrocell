"use client";

import { Lock, ShieldCheck } from "lucide-react";
import { RequireAuth } from "@/lib/firebase/require-auth";
import { useAuth } from "@/lib/firebase/auth-context";

export default function ProtectedPage() {
  return (
    <RequireAuth>
      <ProtectedContent />
    </RequireAuth>
  );
}

function ProtectedContent() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
        <Lock className="size-3.5" />
        Korumalı alan
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">
        Hoş geldin, {user.displayName ?? user.email}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Bu sayfa sadece giriş yapmış kullanıcılar tarafından görülebilir. Giriş
        yapmamış ziyaretçiler otomatik olarak <code>/login</code>{" "}
        sayfasına yönlendirilir.
      </p>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
            <ShieldCheck className="size-5" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-semibold">
              Firebase Auth ile doğrulandın
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Aşağıda Firebase&apos;den dönen kullanıcı bilgileri var. Mock
              veriler değil, doğrudan <code>onAuthStateChanged</code>{" "}
              dinleyicisinden geliyor.
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ad" value={user.displayName} />
          <Field label="E-posta" value={user.email} />
          <Field label="UID" value={user.uid} mono />
          <Field
            label="E-posta doğrulandı"
            value={user.emailVerified ? "Evet" : "Hayır"}
          />
          <Field label="Sağlayıcı" value={user.providerData[0]?.providerId} />
          <Field
            label="Son giriş"
            value={
              user.metadata.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toLocaleString("tr-TR")
                : null
            }
          />
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
        <h2 className="text-sm font-semibold text-slate-700">
          Mock korumalı içerik
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>• Sprint raporları (sadece üyeler)</li>
          <li>• Aksiyon sorumluları için takip paneli</li>
          <li>• Yönetici özet ekranı</li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Bu liste tamamen mock — gerçek bir uygulamada bu içerik Firestore ya
          da kendi API&apos;nden çekilir.
        </p>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd
        className={
          "mt-1 break-words text-sm text-slate-900 " +
          (mono ? "font-mono text-xs" : "")
        }
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}
