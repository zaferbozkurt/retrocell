# Mimari

Bu doc Retro Tracker'ın **mevcut** mimari yapısını anlatır. Kodun bizzat doğrudur — yorumlanan değişken/dosya isimleri repoda aynı şekilde bulunur.

> Not: Kök `CLAUDE.md` "feature-slice migration" başlığı altında bir hedef mimari ve R1–R11 kuralları belirtir. Bu refaktor **başlatılmamıştır**; aşağıda anlatılan yapı **aktif olarak çalışan** kod tabanıdır.

## Klasör yapısı

```
retrocell/
├── app/                          # Next.js App Router
│   ├── api/ai/
│   │   ├── similarity/route.ts   # POST /api/ai/similarity
│   │   └── vagueness/route.ts    # POST /api/ai/vagueness
│   ├── actions/page.tsx          # /actions
│   ├── history/page.tsx          # /history
│   ├── layout.tsx                # Root layout + AppShell wiring
│   ├── page.tsx                  # / (retro board)
│   └── globals.css               # Tailwind v4 entrypoint
├── components/
│   ├── app/app-shell.tsx         # Top nav, açık aksiyon rozeti, reset
│   └── ui/                       # shadcn scaffolding (leftover, çoğu kullanılmıyor)
├── lib/
│   ├── ai/
│   │   ├── client.ts             # Client-side fetch wrapper, 3sn timeout, never throws
│   │   ├── heuristics.ts         # Deterministik mock fallback
│   │   └── ollama.ts             # Server-side Ollama proxy
│   ├── cn.ts                     # clsx + twMerge
│   ├── date.ts                   # TODAY hardcoded + relative formatters
│   ├── seed.ts                   # Demo seed state
│   ├── store.ts                  # Singleton state + mutations + selectors
│   └── types.ts                  # AppState, Retro, RetroItem, Action, SprintNote
├── public/                       # Statik asset'ler (Next defaults)
├── CLAUDE.md                     # Claude Code project rules
├── AGENTS.md                     # Next.js 16 uyarısı
└── docs/                         # Bu dökümantasyon
```

## Teknoloji yığını

| Katman | Seçim | Neden |
|--------|-------|-------|
| Framework | Next.js **16.2.6**, App Router, Turbopack | Server route handlers + statik client bir arada; Turbopack hızlı dev |
| UI | React **19.2.4** | `useSyncExternalStore` artık prime-time |
| Dil | TypeScript 5 | Strict mode, runtime guard ihtiyacı azalır |
| Stil | Tailwind v4 + PostCSS | Utility-first, design system'siz |
| İkon | lucide-react | Tree-shake'lenebilir SVG ikon set |
| State | Custom singleton + `useSyncExternalStore` | 100 satır, dış bağımlılık yok |
| Persist | `localStorage` (`retro-tracker.v2`) | Backend yok, kullanıcı bazlı veri |
| LLM (runtime) | Ollama yerel, `llama3.2`, JSON mode | İnternet/API key bağımlılığı yok |
| Test | Yok | Manuel smoke + `tsc --noEmit` |

## Veri modeli

`lib/types.ts` içinde tanımlı.

```ts
type Column = "glad" | "sad" | "action";

type Retro = {
  id: string;
  sprintName: string;
  date: string;
  status: "active" | "closed";
  summary?: string;
};

type RetroItem = {
  id: string;
  retroId: string;
  column: Column;            // "action" kolonu Action[] değil, kart kopyası
  text: string;
  author: string;
  createdAt: string;
  similarToItemId?: string;  // AI similarity tarafından doldurulur
  similarReason?: string;
  isVague?: boolean;         // AI vagueness tarafından doldurulur
  vagueQuestion?: string;
  sourceItemId?: string;     // Aksiyona dönüşmüşse kaynak kart id
};

type Action = {
  id: string;
  retroId: string;
  title: string;
  owner: string;
  status: "open" | "in_progress" | "done";
  createdAt: string;
  closedAt?: string;
  sourceItemId?: string;     // Hangi RetroItem'dan promote edildi
};

type SprintNote = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  movedToRetro: boolean;
};

type AppState = {
  currentUser: string;
  retros: Retro[];
  items: RetroItem[];
  actions: Action[];
  notes: SprintNote[];
};
```

### Kritik invariant'lar

- **`RetroItem.column === "action"` ≠ `Action`.** Aksiyon kolonu, retro boardun **görsel** kolonudur; `Action[]` tablosu ayrı veridir. İki kayıt **birlikte** tutulur (bkz. dual-write).
- **`sourceItemId` çift yönlü hover bağı kurar.** Hover-dim efekti `i.sourceItemId === hovered.id` veya `hovered.sourceItemId === i.id` durumunu kontrol eder.
- **AI alanları lazy.** Yeni kart eklendiğinde önce kart düşer, sonra `aiCheckSimilarity` + `aiCheckVagueness` paralel çalışır ve `store.updateItem(id, patch)` ile asenkron doldurur.

## Store (`lib/store.ts`)

Modül-seviye singleton:

```ts
let state: AppState = SEED_SNAPSHOT;
const listeners = new Set<() => void>();
```

React entegrasyonu `useSyncExternalStore`:

```ts
export function useAppState<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),   // SSR hydration drift'i önler
  );
}
```

### Mutations (`store.*`)

| Mutation | Etki |
|---------|------|
| `addItem(input)` | Yeni `RetroItem` oluşturur, AI alanları opsiyonel |
| `updateItem(id, patch)` | Partial update (AI alanları için de kullanılır) |
| `deleteItem(id)` | Kartı siler |
| `moveItem(id, column)` | Kolonu değiştirir |
| `promoteItemToAction(itemId, title?)` | **Dual-write**: `Action` + `RetroItem(column: "action")` |
| `demoteItemToNote(itemId)` | Kartı siler, yeni `SprintNote` ekler |
| `updateActionStatus(id, to)` | `closedAt` ile birlikte `done` setler |
| `addNote(text)` | Yeni sprint notu |
| `moveNoteToRetro(noteId, retroId, column)` | Notu retro itemine çevirir, notu `movedToRetro: true` yapar (silmez!) |
| `deleteNote(id)` | Notu siler |
| `closeRetro(id, summary?)` | Retroyu kapatır |
| `reset()` | `createSeedState()` ile state'i sıfırlar |

### Persistence

- `setState` her çağrıda `persist()` ve `emit()` çağırır.
- `persist()` `JSON.stringify(state)` yapıp `localStorage.setItem("retro-tracker.v2", ...)` çağırır.
- `loadFromStorage()` `AppShell`'in mount'unda bir kere çalışır (`useHydrateStore`).
- `getServerSnapshot()` her zaman **orijinal seed** döner → SSR/CSR hydration drift'i olmaz.

## Sayfalar ve rota haritası

| Path | Dosya | İçerik |
|------|-------|--------|
| `/` | `app/page.tsx` | Retro board (kanban + sidebar + 3 stat card) |
| `/actions` | `app/actions/page.tsx` | Tüm aksiyonların tek tabloda listesi |
| `/history` | `app/history/page.tsx` | Kapanmış retrolar + recurring theme uyarısı |
| `/api/ai/similarity` | `app/api/ai/similarity/route.ts` | POST, Ollama → mock |
| `/api/ai/vagueness` | `app/api/ai/vagueness/route.ts` | POST, Ollama → mock |

Dynamic route, middleware, server action **yok**.

## Drag & Drop

Native HTML5 DnD, iki ayrı MIME:

```ts
const ITEM_MIME = "application/x-retro-item";   // RetroItem taşıma
const NOTE_MIME = "application/x-retro-note";   // SprintNote → board
```

### Drop matrix

| Kaynak | Hedef | Sonuç |
|--------|-------|-------|
| RetroItem | Başka kolon | `store.moveItem(id, column)` |
| RetroItem | Aynı kolon | No-op |
| RetroItem | Sprint notes sidebar | `store.demoteItemToNote(id)` |
| SprintNote | Herhangi bir kolon | `store.moveNoteToRetro(noteId, retroId, column)` |
| SprintNote | Sprint notes sidebar | (sidebar sadece ITEM_MIME kabul eder) |

### `onDragOver` filtresi

Drop target'ın `onDragOver` handler'ı, `dataTransfer.types` array'inde **beklenen MIME** var mı diye bakar; yoksa `preventDefault` çağırmaz, drop reddedilmiş olur. Bu sayede dış kaynaklardan gelen drag'lar boardu kirletmez.

### Edit modunda drag kapalı

`ItemCard` `draggable={!editing && !actionMode}` ile drag'i devre dışı bırakır, kullanıcı düzenliyorken yanlışlıkla taşınmaz.

## AI flow

```
User adds card
      │
      ▼
store.addItem(...)  ──────────►  Card görünür (AI alanları boş)
      │
      ├─► aiCheckSimilarity(text, pastItems)   ─┐
      │                                         │ Promise.all
      └─► aiCheckVagueness(text)                ─┘
                  │
                  ▼
              callApi("similarity" | "vagueness", body, fallback)
                  │
                  ├──── POST /api/ai/{task}  (3sn AbortController)
                  │           │
                  │           ▼
                  │       Route handler
                  │           │
                  │           ├─► ollamaJson<T>(prompt)  (3sn timeout)
                  │           │       │
                  │           │       ├── 200 OK + valid JSON ►  { source: "local-llm", data }
                  │           │       └── error / null      ─┐
                  │           │                              ▼
                  │           └─► checkSimilarityMock / checkVaguenessMock
                  │                                          │
                  │                                          ▼
                  │                                  { source: "mock", data }
                  │
                  └── timeout / network error  ──► { source: "mock", data: fallback() }
                                                                     (client-side mock)
                  │
                  ▼
            patch = { similarToItemId?, similarReason?, isVague?, vagueQuestion? }
                  │
                  ▼
            store.updateItem(id, patch)
                  │
                  ▼
            ItemCard re-render → AI banner görünür
```

### Üç AI özelliği

| Özellik | Çağrı | Nerede gösterilir |
|---------|-------|-------------------|
| Similarity | `aiCheckSimilarity` | Kart altında **amber** banner ("AI: Aynı konu Sprint 22'de…") |
| Vagueness | `aiCheckVagueness` | Kart altında **yellow** banner ("AI: Hangi süreç? Hangi durumda?") |
| Recurring theme | Pure client-side, `detectRecurringTheme` (history page) | Sayfa üstünde **kırmızı** banner |

İlk ikisi LLM'e gider, üçüncüsü tamamen `tokenize` + `Set` analizidir.

### Ollama proxy

`lib/ai/ollama.ts`:

```ts
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
const SYSTEM_PROMPT = "Sen retro toplantı asistanısın. Sadece geçerli JSON cevap ver, başka metin yok.";
```

3sn timeout, JSON format, parse hatasında `null` döner. Caller her zaman `null`'u handle eder ve mock'a düşer.

### Mock heuristics (`lib/ai/heuristics.ts`)

**Demo-rigged**, tesadüfen değil:

- `checkSimilarityMock` → text içinde "deploy" geçerse `SEED_IDS.deployItemId`'e bağlar, sabit cümle: *"Aynı konu Sprint 22 ve Sprint 23'te konuşulmuş, CI/CD aksiyonu hâlâ açık (45 gün)."*
- `checkVaguenessMock` → trim'li uzunluk < 25 ya da (`süreç|kötü|sorun|problem|berbat` token'ı varken numara/saat/release/deploy yoksa) muğlak sayar.

Tarihler `lib/date.ts > TODAY = "2026-05-14"` ile **sabit**, "45 gün önce" gibi göreli ifadeler her oturumda aynı.

## Stil sistemi

- **Tailwind v4** utility-first. CSS modülleri yok.
- `lib/cn.ts` → `clsx + twMerge` reexport. Conditional class composition için `cn(...)`.
- Palet: slate base, indigo primary (`#4F46E5`), kolon tonları `COLUMN_META`'da merkezi:
  - `glad` → emerald
  - `sad` → rose
  - `action` → sky
- Action status'ları için `ACTION_STATUS_META` (open/in_progress/done) ayrıca tanımlı.
- **Dark mode yok.** `next-themes` paketi yüklü ama root layout'a hiç bağlanmadı; out-of-scope.

## SSR / hydration

- Sayfalar `"use client"` ile başlar (interaktif state ağırlıklı).
- `app/layout.tsx` server component; `AppShell` ilk client boundary.
- `useHydrateStore` `AppShell` mount'unda bir kere çalışır:
  ```ts
  useEffect(() => { loadFromStorage(); }, []);
  ```
- `useSyncExternalStore`'un `getServerSnapshot` parametresi SSR'de **deterministik seed** döner → mismatch yok.

## Reset davranışı

`AppShell`'in üst sağındaki dairesel ok ikonu:

```ts
if (confirm("Tüm veriyi seed haline geri al?")) store.reset();
```

`store.reset()` `createSeedState()` çağırır ve state'i seed'e döner; persist tetiklenir, `localStorage` da güncellenir. Seed'e eklediğin yeni alanlar **`createSeedState` içinde de** olmalı, yoksa reset sonrası `undefined` field'lar kalır.

## Performans notları

- Tüm state mutable bir değişkende, ama selector'lar her `setState` sonrası `emit()` ile yeniden çalışır. `useSyncExternalStore` selector çıktıları **referans olarak stable** olmalı — değilse infinite re-render.
- Listeler için filtre/sort komponent içinde yapılır (memo veya `useMemo` kullanılmaz). 6 retro × ~6 item × 4 action ölçeğinde performans problemi olmaz.
- LLM çağrıları async ve `await` zorunlu değil — kart eklendikten **sonra** banner gelir, kullanıcı bloklanmaz.

## Genişletme noktaları

| İhtiyaç | Nereye dokunulur |
|---------|------------------|
| Yeni AI kontrol (örn: emotion) | `lib/ai/heuristics.ts` mock + `lib/ai/ollama.ts` prompt + `app/api/ai/<name>/route.ts` + `lib/ai/client.ts` wrapper |
| Yeni drag target | `dataTransfer.types.includes(MIME)` + `onDrop` switch |
| Yeni store mutation | `lib/store.ts` `store` objesine ekle, mutate-then-`setState` desenine uy |
| Yeni alan `RetroItem`'a | `types.ts` + `store.addItem` + `seed.ts` + (varsa) AI patch payload |
