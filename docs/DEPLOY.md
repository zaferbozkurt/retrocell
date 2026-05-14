# Deploy & Test Rehberi

Bu doc üç farklı çalıştırma modunu netleştirir: **lokal development**, **lokal production build**, **canlı sunucu**.

## 🚀 Canlı sürüm

👉 **[https://retrocell.vercel.app/](https://retrocell.vercel.app/)**

| Alan | Değer |
|------|-------|
| Host | Vercel |
| Deploy tetikleyici | `main` branch'e push → otomatik build & deploy |
| Build komutu | `next build` (Turbopack) |
| Output | Static + Edge route handlers |
| State | Her ziyaretçinin kendi tarayıcı `localStorage`'ı (anahtar: `retro-tracker.v2`) |
| Backend | **Yok** — sunucu sadece statik dosya + AI proxy route'larını serve eder |
| AI sağlayıcı | Canlıda Ollama yok → **mock heuristics** devreye girer, demo deterministik |

> Jüri için: kurulum yapmadan direkt yukarıdaki linki açıp denemek mümkün. Reset butonu (üst sağ dairesel ok) her ziyarette seed state'e döndürür.

---

## A) Lokal test (development)

Kod değişikliği yaparken kullanılan mod. Hot reload açık, type-check ayrı bir terminalde dönebilir.

### Kurulum

```bash
git clone https://github.com/<org>/retrocell.git
cd retrocell
npm install
cp .env.example .env.local   # opsiyonel — sadece Ollama kullanacaksan
```

### Çalıştırma

```bash
npm run dev          # next dev — http://localhost:3000
```

### Doğrulama komutları

```bash
npm run lint         # eslint
npx tsc --noEmit     # typecheck (test suite yok — birincil kalite kapısı)
```

### Opsiyonel: yerel LLM aktif

Ollama'yı yerel olarak çalıştır:

```bash
ollama serve                 # Ollama servisi
ollama run llama3.2          # ilk seferde model indirir, prime cache
```

`.env.local` içinde:

```ini
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3.2
```

Ollama çalışmasa da uygulama çalışır — 3 saniyede timeout olur, mock heuristic devreye girer (`lib/ai/heuristics.ts`).

---

## B) Production build — lokal sunucu testi

Canlıya almadan **kendi makinende** prod davranışını doğrulamak için. Vercel deploy'unun lokal eşdeğeri.

```bash
npm run build        # next build — production output ./.next/
npm run start        # next start — http://localhost:3000 (port aynı, mode farklı)
```

### Ne ne için yapılır?

| Mod | Build | Çalıştırma | Hot reload | Optimize | Demo provası |
|-----|-------|-----------|-----------|----------|--------------|
| **A (dev)** | — | `npm run dev` | Var | Hayır | Geliştirme |
| **B (lokal prod)** | `npm run build` | `npm run start` | Yok | Evet | Deploy öncesi son kontrol |
| **C (canlı)** | Vercel CI | Vercel | Yok | Evet | Jüri demosu |

Hackathon teslimi öncesi: **B modunda en az bir kez başarılı çalıştır**. `next build` hata vermezse Vercel deploy'u da büyük ihtimalle başarılı geçer.

---

## C) Canlı sunucu testi

Hiçbir kurulum yapmadan:

👉 **[https://retrocell.vercel.app/](https://retrocell.vercel.app/)**

- Tarayıcıdan aç, "Sprint 24 Retro" board'u görünür.
- Reset butonu (üst sağ) seed state'e döndürür.
- Tüm DnD, AI banner, dual-write akışları lokal ile aynı.

### Canlı sürümün lokal sürümden farkları

| Konu | Lokal (A) | Canlı (C) |
|------|----------|----------|
| Hot reload | Var | Yok |
| Source maps | Var | Var (Vercel default) |
| AI: Ollama | Opsiyonel, açık olabilir | **Yok** — daima mock fallback |
| Port | `:3000` | `https` (443) |
| State izolasyonu | Sadece sen | Her ziyaretçinin kendi `localStorage`'ı |

---

## Hızlı referans

```bash
# Geliştirme
npm install
npm run dev

# Production simülasyonu
npm run build
npm run start

# Kalite kapıları
npm run lint
npx tsc --noEmit

# Yerel LLM (opsiyonel)
ollama serve
ollama run llama3.2

# Canlı sürüm (kurulum gerekmez)
open https://retrocell.vercel.app/
```
