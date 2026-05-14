# Retro Tracker

> Sprint retrolarını ve onlardan çıkan aksiyonları **unutmadan** yönetmek için yapılmış, yerel AI destekli bir takip uygulaması.
>
> Prompt Sprint AI Hackathon — **Retro & Action Tracker** konusu için geliştirildi.

🚀 **Canlı demo:** [https://retrocell.vercel.app/](https://retrocell.vercel.app/)

---

## İçindekiler

- [Ne işe yarar?](#ne-işe-yarar)
- [Çözdüğü problem](#çözdüğü-problem)
- [Öne çıkan AI özellikleri (X-Factor)](#öne-çıkan-ai-özellikleri-x-factor)
- [Hızlı başlangıç](#hızlı-başlangıç)
- [.env.example](#envexample)
- [Kullanılan AI araçları](#kullanılan-ai-araçları)
- [Entegre edilen API'ler](#entegre-edilen-apiler)
- [MCP listesi](#mcp-listesi)
- [Ekran görüntüleri](#ekran-görüntüleri)
- [Deploy URL](#deploy-url)
- [Dökümantasyon](#dökümantasyon)
- [Teknoloji yığını](#teknoloji-yığını)
- [Lisans](#lisans)

---

## Ne işe yarar?

Retro Tracker, **scrum retrospektif** süreçlerini tek bir Türkçe arayüzde toplayan, retro toplantılarında alınan **aksiyon maddelerinin unutulmamasını** sağlayan bir kanban + aksiyon takip aracıdır:

- **Sprint Notları** — sprint boyunca akıl(da)a düşen "retroda konuşalım" notlarını sürükle-bırak ile retroya taşırsın.
- **Retro Board** — Türkçe `İyi Gitti / Kötü Gitti / Aksiyon` kanban kolonları, in-place edit, sürükle-bırak, hover ile bağlı kartı vurgulama.
- **Aksiyonlar sayfası** — tüm retrolardan çıkan aksiyonlar tek tabloda, 30+ gündür açık olanlar **kırmızı**.
- **Geçmiş & İçgörüler** — kapanmış retrolar, kapanma yüzdesi grafiği ve tekrar eden konuların yerel AI ile tespiti.

## Çözdüğü problem

> *"Ekipler retroları dış platformlarda yapıyor, alınan kararlar sonraki sprintlerde unutulup havada kalıyor."*

Retro Tracker bu "unutulma" problemini üç katmanda çözer:

1. **Aksiyon dual-write** — bir karta `→ Aksiyon` deyince hem `/actions` tablosuna hem retro boardun "Aksiyon" kolonuna **eş zamanlı** kayıt düşer. Aksiyon hiçbir yerde gözden kaçmaz.
2. **30+ gün uyarısı** — açık aksiyonların yaşı her ziyarette hesaplanır, eski olanlar kırmızı şeritle işaretlenir.
3. **Yerel AI uyarıları** — yeni bir kart eklendiğinde geçmiş retrolardaki benzer maddeleri ve hâlâ açık aksiyonları otomatik yüzeye çıkarır ("Aynı konu Sprint 22'de açıldı, CI/CD aksiyonu 45 gündür açık").

Detaylı problem analizi: [`docs/PROBLEM.md`](./docs/PROBLEM.md).

## Öne çıkan AI özellikleri (X-Factor)

| Özellik | Nerede | Ne yapıyor |
|--------|--------|-----------|
| **Benzerlik tespiti** | Yeni kart girişinde | Geçmiş retrolarda aynı konunun konuşulup konuşulmadığını söyler, ilgili aksiyonun yaşını hatırlatır |
| **Muğlaklık kontrolü** | Yeni kart girişinde | "Süreç kötü" gibi muğlak ifadeleri yakalar, somutlaştırıcı soru üretir |
| **Tekrar eden konu** | `/history` sayfası | Kapanmış retrolarda iki veya daha fazla retroda geçen ortak temayı vurgular |

Üç özellik de **local LLM (Ollama)** ile çalışır; LLM erişilemezse deterministik mock heuristics devreye girer ve demo asla kırılmaz. Detay: [`docs/AI-STRATEGY.md`](./docs/AI-STRATEGY.md).

## Hızlı başlangıç

### Ön koşullar

- **Node.js 24.15.0** (`package.json > engines` ile pinlenmiş)
- npm (Node ile birlikte gelir)
- *İsteğe bağlı:* Yerel [Ollama](https://ollama.com/) (varsayılan model `llama3.2`). Yoksa uygulama mock heuristics ile çalışır.

### A) Lokal test (development)

Geliştirme veya kendi makinende denemek için:

```bash
git clone https://github.com/<org>/retrocell.git
cd retrocell
npm install
cp .env.example .env.local   # opsiyonel — sadece Ollama kullanacaksan
npm run dev                  # http://localhost:3000
```

Geliştirme sırasında kullanılacak diğer komutlar:

```bash
npm run dev          # next dev (port 3000) — hot reload
npm run lint         # eslint
npx tsc --noEmit     # typecheck (test suite yok, bu kontrol birincil)
```

### B) Production build — lokal sunucu testi

Canlıya almadan önce production build'in **kendi makinende** çalıştığını doğrulamak için:

```bash
npm run build        # next build (Turbopack) — production output
npm run start        # next start (port 3000) — production server
```

`npm run start` Vercel deploy'unun yaptığının lokal eşdeğeridir. Önce `build` çağırıp sonra `start`'lamalısın.

### C) Canlı sunucu testi (deploy edilmiş)

Herhangi bir kurulum yapmadan direkt jüri demosunu görmek için:

👉 **[https://retrocell.vercel.app/](https://retrocell.vercel.app/)**

Vercel üzerinde host ediliyor. Demo state her tarayıcının kendi `localStorage`'ında tutulur — başka bir kullanıcının verisini görmezsin, kendi `Reset` butonun her zaman seed state'e döndürür.

> **Not:** Canlı sürümde Ollama **yoktur**; AI özellikleri `mock heuristics` ile çalışır. Demo akışı yine deterministik (bkz. `lib/ai/heuristics.ts`).

> Test suite **yoktur** — hackathon kapsamında doğrulama type-check + lint + manuel demo akışı ile yapılır.

### Demo sıfırlama

Üst sağdaki **dairesel ok** ikonu (`store.reset()`) tüm state'i seed verisine geri alır. Tüm state `localStorage > retro-tracker.v2` altında tutulur, backend yoktur.

## .env.example

Repoda `.env.example` mevcuttur. İçeriği:

```ini
# Yerel Ollama endpoint'i. Çalışmıyorsa uygulama otomatik mock heuristics'e düşer.
OLLAMA_URL=http://localhost:11434/api/generate

# Kullanılacak Ollama modeli. JSON-mode destekleyen bir model olmalı.
OLLAMA_MODEL=llama3.2
```

Hiçbir env değişkeni **zorunlu değildir**. İkisi de yoksa kod yukarıdaki değerleri default olarak kullanır (bkz. `lib/ai/ollama.ts`).

## Kullanılan AI araçları

| Araç | Model | Nerede kullanıldı |
|------|-------|------------------|
| **Claude Code** (CLI) | `claude-opus-4-7` | Mimari kararlar, kod yazımı, refactor, doc üretimi — tüm geliştirme süreci |
| **Ollama** (local, runtime) | `llama3.2` (JSON mode) | Üründeki benzerlik & muğlaklık kontrol API'lerinin asıl çalışan modeli |
| Mock heuristics (fallback) | Deterministik, kod | Ollama erişilemezse devreye giren güvence katmanı |

Geliştirme sürecinde Claude Code'a verilen kalıcı talimatlar:

- [`CLAUDE.md`](./CLAUDE.md) — kök seviyede Claude Code project rules (mimari, store invariantları, DnD MIME types, AI flow, demo davranışı)
- [`AGENTS.md`](./AGENTS.md) — Next.js 16 uyarısı, "training data'nın yanıltıcı olduğu" notu

AI iş bölümü ve orkestrasyon detayı: [`docs/AI-STRATEGY.md`](./docs/AI-STRATEGY.md).

## Entegre edilen API'ler

| API | Tip | Açıklama |
|-----|-----|----------|
| `POST /api/ai/similarity` | İç (Next.js Route Handler) | Yeni kart ile geçmiş kartları karşılaştırır, Ollama → mock fallback |
| `POST /api/ai/vagueness` | İç (Next.js Route Handler) | Kartın muğlak olup olmadığını söyler, Ollama → mock fallback |
| `http://localhost:11434/api/generate` | Dış (yerel) | Ollama generate endpoint'i, sadece sunucu tarafından çağrılır |

**Dış üçüncü taraf API yok.** Tüm AI kullanımı yerel — internet bağlantısı gerekmez, gizli veri sızması yoktur.

## MCP listesi

**MCP sunucusu kullanılmadı.** Geliştirme tamamen Claude Code'un yerleşik tool seti (Read, Edit, Write, Bash, Grep) ile yürütüldü.

## Ekran görüntüleri

> Hackathon sunumu sırasında doldurulacak. Görseller `docs/screenshots/` altına eklenir.

- `docs/screenshots/board.png` — retro board + sprint notları sidebar
- `docs/screenshots/ai-warning.png` — yeni kart eklendiğinde AI benzerlik banner'ı
- `docs/screenshots/actions.png` — aksiyonlar tablosu, 30+ gün vurgusu
- `docs/screenshots/history.png` — geçmiş retrolar + recurring theme uyarısı

## Deploy URL

🚀 **Canlı:** [https://retrocell.vercel.app/](https://retrocell.vercel.app/)

- **Host:** Vercel
- **Branch:** `main` push → otomatik deploy
- **State:** her tarayıcının kendi `localStorage`'ında, backend yok
- **AI:** canlı sürümde Ollama olmadığından **mock fallback** devrede — demo akışı yine deterministik

## Dökümantasyon

Tüm proje dökümantasyonu [`docs/`](./docs) altındadır:

| Dosya | İçerik |
|-------|--------|
| [`docs/README.md`](./docs/README.md) | Doc index |
| [`docs/PROBLEM.md`](./docs/PROBLEM.md) | Problem tanımı, hedef kullanıcı, çözüm yaklaşımı |
| [`docs/PLAN.md`](./docs/PLAN.md) | Proje planı, MVP scope, in/out kararları |
| [`docs/PHASES.md`](./docs/PHASES.md) | 14:30–17:30 geliştirme fazları, ne zaman ne yapıldı |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Klasör yapısı, store, DnD, AI flow, veri modeli |
| [`docs/AI-STRATEGY.md`](./docs/AI-STRATEGY.md) | AI iş bölümü ve orkestrasyon, prompt yapısı |
| [`docs/DEMO.md`](./docs/DEMO.md) | 7 dakikalık sunum scripti |

## Teknoloji yığını

- **Next.js 16.2.6** (Turbopack, App Router)
- **React 19.2.4**
- **TypeScript 5**
- **Tailwind CSS v4** (PostCSS, utility-first)
- **lucide-react** — ikonlar
- **Ollama** (`llama3.2`) — yerel LLM, opsiyonel
- Hand-rolled store: `useSyncExternalStore` + `localStorage` (Redux/Zustand yok)
- Native HTML5 Drag & Drop (özel MIME types ile)

## Lisans

Hackathon submission. Kişisel kullanım için.
