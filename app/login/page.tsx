"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-12 text-center text-sm text-slate-500">
      Yükleniyor…
    </div>
  );
}

function LoginForm() {
  const { user, loading, configured, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get("next") || "/korumali";

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, router, next]);

  async function handleGoogleSignIn() {
    setError(null);
    setPending(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Giriş sırasında bir hata oluştu.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Giriş Yap</h1>
        <p className="mt-2 text-sm text-slate-600">
          Korumalı sayfalara erişmek için Google hesabınla giriş yap.
        </p>

        {!configured ? (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Firebase yapılandırılmamış. Proje köküne <code>.env.local</code>{" "}
            dosyası ekleyip <code>NEXT_PUBLIC_FIREBASE_*</code> değerlerini
            doldurun, ardından dev server&apos;ı yeniden başlatın.
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={!configured || pending || loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <LogIn className="size-4" />
          {pending ? "Yönlendiriliyor…" : "Google ile Giriş Yap"}
        </button>

        <p className="mt-6 text-center text-xs text-slate-500">
          Giriş yaptığında <code>/korumali</code> sayfasına yönlendirileceksin.
        </p>
      </div>
    </div>
  );
}
