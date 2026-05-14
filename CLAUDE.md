# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture refactor in progress

We are migrating to a feature-slice architecture. Before any non-trivial change, read [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — it defines the target layout, eleven enforceable rules (R1–R11), the migration roadmap, and a pre-merge checklist.

Repeatable workflows live in [`docs/playbooks/`](./docs/playbooks/):
- `refactor-route-to-feature` — extract a `app/**/page.tsx` into a `features/<name>/` slice
- `add-store-mutation` — add an atomic store mutation (R5, R7)
- `extend-dnd` — add a new DnD payload / drop zone (R8)
- `audit-render-stability` — find and fix selector instability (R6)
- `add-ai-check` — add a new AI check route + client + mock fallback (R9)

The "What this app is" / "Architecture" sections below describe the **current** state. Where they conflict with `docs/ARCHITECTURE.md`, the architecture doc is the target — but don't refactor preemptively; follow the phased roadmap.

## Next.js version warning

This is Next.js **16.2.6** with React **19.2.4** and Tailwind **v4**. APIs, conventions, and file layout differ from older training data. Before writing Next-specific code (route handlers, layouts, server components, etc.), read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices. (`AGENTS.md` carries the canonical version of this warning.)

## Commands

```bash
npm run dev          # next dev (port 3000)
npm run build        # next build (Turbopack)
npm run start        # next start
npm run lint         # eslint
npx tsc --noEmit     # typecheck — there is no test suite
```

Node version is pinned to **24.15.0** in `package.json` engines.

## What this app is

A Turkish-language scrum retrospective tracker built for a hackathon to a fixed spec. Single hardcoded user ("Ayşe — Scrum Master"), no auth, no backend persistence — state lives entirely in the browser. The seed data and demo scenario are the source of truth: certain IDs in `lib/seed.ts` are referenced by name from the AI heuristics, and `lib/date.ts` hardcodes `TODAY = "2026-05-14"` so relative-time copy ("45 gün önce") is deterministic during demos.

## Architecture

### Client store (`lib/store.ts`)

A hand-rolled, module-level singleton: one `state: AppState` variable, a `Set` of listeners, persisted to `localStorage` under key `retro-tracker.v2`. React reads it via `useSyncExternalStore`:

```ts
const retro = useAppState(getActiveRetro);          // selectors live in same file
const items = useAppState((s) => s.items);
```

All mutations go through the `store` object (`store.addItem`, `store.moveItem`, `store.promoteItemToAction`, …). `setState` triggers persist + emit. To avoid SSR/hydration drift, the store exports `getServerSnapshot` (returns the original `SEED_SNAPSHOT`) and `useHydrateStore` (called once in `AppShell`) — selectors must return stable references or primitives to keep `useSyncExternalStore` happy. Earlier work in this repo hit infinite re-renders from selector instability; preserve that invariant.

### Data model (`lib/types.ts`)

- `RetroItem.column` is `"glad" | "sad" | "action"` — the three retro board columns. The Aksiyon column displays `RetroItem`s with `column === "action"`, NOT `Action[]` records.
- `Action[]` (separate from `RetroItem`) is what powers the `/actions` page and the open-action count badge.
- `RetroItem.sourceItemId` and `Action.sourceItemId` link a promoted Aksiyon card back to the kötü/iyi-gitti card it came from. The retro board's hover-dim effect uses this in both directions to highlight only the related pair.
- `RetroItem.similarToItemId` / `similarReason` and `isVague` / `vagueQuestion` are set asynchronously by the AI checks after a card is added.

When you change either type, also update `lib/seed.ts` and the matching `store` mutation.

### `promoteItemToAction` is dual-write

Calling `store.promoteItemToAction(itemId, title)` creates **two** records:
1. A new `Action` in `state.actions` (visible on `/actions`).
2. A new `RetroItem` with `column: "action"` (visible in the Aksiyon column of the retro board).

Both carry `sourceItemId = itemId`. Keep these in sync if you refactor.

### AI flow

Client wrappers in `lib/ai/client.ts` `fetch('/api/ai/similarity' | '/api/ai/vagueness')` with a 3s `AbortController` timeout. The route handlers in `app/api/ai/*/route.ts` try Ollama (`lib/ai/ollama.ts`, default `http://localhost:11434/api/generate`, model `llama3.2`, JSON mode) and fall back to the deterministic mocks in `lib/ai/heuristics.ts`. On any failure — non-OK, timeout, parse error, no Ollama — the response is `{ source: "mock", data: <mock result> }`. The client never throws; UI banners render whatever comes back.

The mocks are demo-rigged:
- `checkSimilarityMock` matches any text containing "deploy" to `SEED_IDS.deployItemId` (Sprint 22 deploy item) and references the 45-day-old CI/CD action by name.
- `checkVaguenessMock` flags text < 25 chars, or vague tokens ("süreç", "kötü", "sorun", "problem", "berbat") without a concrete-detail anchor (numbers, "saat", "deploy", etc.).

Override the LLM endpoint with `OLLAMA_URL` and `OLLAMA_MODEL` env vars.

### Drag-and-drop

Native HTML5 DnD with two distinct MIME types — do not use `text/plain`:
- `application/x-retro-item` — moving cards between board columns, or dragging a card back into the notes sidebar (which calls `store.demoteItemToNote`).
- `application/x-retro-note` — dragging a sprint note onto a board column (calls `store.moveNoteToRetro`).

The board column's `onDrop` dispatches by checking `dataTransfer.getData(...)` against each MIME. When adding a new drop target, accept both MIMEs unless you really mean one.

### Routes

Just three pages, all under `app/`:
- `app/page.tsx` — retro board (kanban + sprint notes sidebar + stat cards). Contains all drag-drop, in-place edit, Aksiyon-input, and hover-dim logic.
- `app/actions/page.tsx` — actions table.
- `app/history/page.tsx` — past retros + recurring-theme AI insight.

No dynamic routes. No middleware. The only API routes are `app/api/ai/{similarity,vagueness}/route.ts`.

### Styling

- Tailwind v4 utility classes, no CSS modules. `lib/cn.ts` re-exports `clsx + twMerge` for conditional classes.
- Palette: slate base, indigo primary (#4F46E5), pastel column tones (`bg-emerald-50` / `bg-rose-50` / `bg-sky-50`) defined once in `COLUMN_META` in `lib/types.ts`.
- No dark mode (despite the stray `next-themes` dep and `components/theme-*.tsx` files — the root layout no longer wires them in).
- `components/ui/` is leftover shadcn scaffolding; prefer plain Tailwind in `components/app/` and the page files.

### Reset / demo state

`AppShell`'s circular-arrow button calls `store.reset()` which rebuilds the state from `createSeedState()`. Anything you add to the schema must be reflected in the seed factory or the reset will produce an invalid state.
