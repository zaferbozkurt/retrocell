# Geliştirme Fazları

Hackathon penceresi: **14:30 → 17:30** (3 saat kod, 15 dk teslim hazırlığı, 17:45 sahne).

Aşağıdaki fazlar git history'sindeki sıralı commit'lerle örtüşür (en eski → en yeni).

---

## Faz 0 — Scaffold ve design system (≈ 14:30)

**Commit'ler:** `b54f770 Initial commit from Create Next App`, `c0f9c07 add design system`, `bf0d543 init app`

- `create-next-app` ile Next.js 16 + TS + Tailwind v4 iskeleti.
- `components/ui/` altına shadcn-style primitives (button, dialog, dropdown, vs.) yerleştirildi — sonradan büyük kısmı `components/app/` tercihiyle bypass edildi, ama leftover scaffold olarak duruyor.
- `app/layout.tsx`, root layout, `AppShell` wiring.

**Çıktı:** Çalışan boş Next.js uygulaması, port 3000.

---

## Faz 1 — Veri modeli, store, seed (≈ 15:00)

**Commit'ler:** `85a2f59 refactor: remove useIsHydrated from components and streamline button implementation`, `fc40d13 Update package.json`

- `lib/types.ts` — `Retro`, `RetroItem`, `Action`, `SprintNote`, `AppState`, `Column`, `COLUMN_META`.
- `lib/store.ts` — singleton store, `useSyncExternalStore`, `localStorage` persist, hydration guard.
- `lib/seed.ts` — 3 retro, 6 item, 4 action, 4 note. Demo-rigged ID'ler (`SEED_IDS.deployItemId`, `SEED_IDS.ciAction`).
- `lib/date.ts` — `TODAY = "2026-05-14"` hardcoded; göreli tarih helper'ları (`daysAgo`, `formatRelative`).
- Hardcoded user `"Ayşe"`, hardcoded sprint `"Sprint 24"` aktif.

**Karar:** Redux/Zustand yok. `useSyncExternalStore` + plain singleton 3 saatte daha hızlı.

**Risk yakalandı:** Selector instability → infinite re-render. Tüm selektörler primitif veya stable ref döndürür.

---

## Faz 2 — Sayfalar ve store-bağlı UI (≈ 15:30)

**Commit:** `bf0d543 init app` (büyük kısmı), pozitif diff

- `app/page.tsx` — retro board, kanban kolonlar, in-place edit (double-click textarea), aksiyon-input mode, hover-dim highlight.
- `app/actions/page.tsx` — aksiyon tablosu, filtre (all/open/done), status cycle rozetleri, 30+ gün kırmızı highlight.
- `app/history/page.tsx` — kapanmış retrolar grid, kapanma yüzdesi progress bar, `detectRecurringTheme` token analizi.
- `components/app/app-shell.tsx` — top nav, açık aksiyon rozet sayacı, reset butonu.

**Karar:** Üç sayfa, dynamic route yok. Hackathon scope'una yetiyor.

---

## Faz 3 — AI çağrı katmanı (≈ 16:00)

**Commit:** `965f97f feat: Implement Ollama API integration and update date handling`

- `lib/ai/heuristics.ts` — deterministik mock'lar. `checkSimilarityMock` "deploy" geçen text'leri Sprint 22 kaydına bağlar; `checkVaguenessMock` kısa veya muğlak token'lı text'leri yakalar.
- `lib/ai/ollama.ts` — yerel Ollama proxy, JSON mode, 3sn timeout, hata olursa `null`.
- `app/api/ai/similarity/route.ts` & `app/api/ai/vagueness/route.ts` — server-side route handler'lar, Ollama → mock fallback.
- `lib/ai/client.ts` — client wrapper, `AbortController` 3sn timeout, asla throw etmez, başarısızlıkta `{ source: "mock", data: fallback() }`.

**Karar:** Mock fallback non-negotiable — demo LLM'e bağımlı olmamalı.

**Demo-rigging:** `SEED_IDS.deployItemId` ve "CI/CD aksiyonu 45 gündür açık" cümlesi mock içine hardcoded.

---

## Faz 4 — Drag & drop (≈ 16:30)

**Commit'ler:** `962c44b feat: Add drag-and-drop functionality for Kanban board items`, `bed7a7e feat: Enhance RetroBoard with drag-and-drop support for notes and items`

- Native HTML5 DnD, iki ayrı MIME type:
  - `application/x-retro-item` — kart kolonlar arası taşıma + sidebar'a geri demote
  - `application/x-retro-note` — sprint notu → board kolonuna promote
- Board kolonu `onDrop` her iki MIME'i da kontrol eder; sidebar sadece item MIME'i kabul eder.
- `dragOver` state'i ile drop target visual feedback (`ring-2 ring-indigo-400`).
- Edit modunda kart drag'lanamaz (`draggable={!editing && !actionMode}`).

**Karar:** `text/plain` kullanmadık; özel MIME'lar olası dış kopya-yapıştır kaynaklarıyla karışmasın diye.

---

## Faz 5 — Dökümantasyon ve cila (≈ 17:00)

**Commit:** `cd3db7b docs: Update CLAUDE.md with comprehensive project guidance and architecture details` + bu commit

- `CLAUDE.md` — Claude Code için kalıcı project rules, mimari invariantlar.
- `AGENTS.md` — Next.js 16 uyarısı (eski training data ile çelişen kısımlar).
- `docs/` klasörü — bu dosyalar (PROBLEM, PLAN, PHASES, ARCHITECTURE, AI-STRATEGY, DEMO).
- README.md jüri checklist'ine göre yeniden yazıldı.
- `.env.example` eklendi.

---

## Sapmalar

- **Firebase eklemesi** (`b5b2fef Add firebase`) → **revert** (`9ad3e3d Revert "Add firebase"`). Backend planı vardı, MVP'ye yetişmeyeceği görüldü → localStorage kararı kesinleşti.
- `components/ui/` shadcn primitif'leri başta gelecek diye eklendi, ama hız için `components/app/` ve sayfa-içi plain Tailwind tercih edildi. UI klasörü leftover olarak duruyor.
- `next-themes` paketi yüklü ama root layout'ta wire edilmedi — dark mode out-of-scope kararından sonra geri çıkarılmadı.

## Teslim öncesi son 15 dakika (17:15–17:30)

1. `npm run build` — production build geçiyor mu?
2. `npx tsc --noEmit` — type error yok mu?
3. `npm run lint` — temiz mi?
4. Reset → demo flow'u baştan oyna, 7 dk içinde mi?
5. README'deki kurulum komutları **boş klasörde** çalışıyor mu?
6. `.gitignore` `.env.local`'i kapatıyor mu?
7. Public repo, son commit'i push'la, link mailden gönder.
