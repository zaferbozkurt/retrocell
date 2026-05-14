# AI Stratejisi ve İş Akışı

Jüri kriterlerinden biri: *"Süreç boyunca yapay zekayı nasıl bir iş bölümüyle kullandınız? Kodlama, tasarım veya planlamada yapay zekayı nasıl orkestre ettiğinizi kısaca aktarın."*

Bu dosya iki ayrı AI kullanımını anlatır:

1. **Geliştirme sürecinde AI** — Claude Code'u nasıl kullandık, hangi tool, hangi prompt.
2. **Üründe AI** — son kullanıcıya "vay be" dedirten yerel AI özellikleri.

---

## 1. Geliştirme sürecinde AI orkestrasyonu

### Ana araç: Claude Code (`claude-opus-4-7`)

| Kullanım alanı | Ne yapıldı |
|----------------|-----------|
| Planlama | Brief okundu, problem ikiye ayrıldı (toplama + unutma), MVP scope çıkarıldı — Claude'a sorularla aşamalı netleştirildi |
| Veri modeli | `RetroItem`, `Action`, `SprintNote` ayrımı tartışıldı; "Aksiyon kolonu Action[] mı RetroItem mı?" sorusu için **dual-write** kararı verildi |
| Store | Redux/Zustand mı, custom mı? `useSyncExternalStore` ile 100 satır yeterli mi tartışıldı, custom seçildi |
| UI komponentleri | Sayfa-içi inline komponentler tercih edildi (paralel iş için daha hızlı); shadcn `components/ui` scaffold'u bypass edildi |
| AI özelliği tasarımı | "Ollama + mock fallback" deseni Claude ile birlikte konuldu — demo'nun LLM'e bağımlı olmaması non-negotiable |
| Refactor & cila | DnD MIME ayrımı, edit modunda drag'ı kapatma, hover-dim efekti tek tek iterasyonla eklendi |
| Dökümantasyon | Bu dosyalar dahil tüm `docs/`, README, `.env.example` Claude Code ile üretildi |

### Kalıcı talimatlar (project-level prompt engineering)

İki dosya repo köküne yerleştirildi ve Claude Code her oturumda otomatik yüklüyor:

#### [`CLAUDE.md`](../CLAUDE.md)
- Mimari invariantlar (selector stability, dual-write, MIME types)
- Demo-rigging davranışları (`TODAY` hardcoded, seed ID'leri AI mock'unda referans alınıyor)
- Reset davranışı ("yeni alan eklersen seed factory'yi güncelle")
- Out-of-scope alanlar (dark mode, test suite)

#### [`AGENTS.md`](../AGENTS.md)
- Next.js 16'nın **eski training data ile çeliştiği** uyarısı.
- `node_modules/next/dist/docs/` içine bakma talimatı.
- Bu, Next 16'nın yeni API'lerinin yanlış kullanılmasını engelledi (route handler signature, layout boundary, vs.).

### Prompt deseni

Kullanılan dominant prompt patern'i: **"durumu açıkla, sınırı çiz, karar bekle"**.

Tipik geliştirme turu:
1. Brief'in bir parçasını Claude'a açıkla.
2. İki-üç alternatif iste, trade-off'larını sor.
3. Birini seç, "şu invariant'ı bozmayacak şekilde" diye netleştir.
4. Diff'i incele, gerekiyorsa düzelt.

### Neden tek AI aracı?

3 saatlik pencerede ikinci bir aracı (Copilot, Cursor, ChatGPT) öğrenmenin maliyeti yüksek. Claude Code zaten bash, dosya I/O, search ve refactor için tüm tool seti içeriyor. Multi-tool karmaşası demo riski yaratırdı.

### Kullanılmayanlar

- **MCP sunucusu yok.** Repo izole, dış sistem entegrasyonu yok, MCP'nin avantajı yoktu.
- **Cursor / Copilot yok.** Geliştirici tercihi.
- **ChatGPT yok.** Aynı seviyede ikinci LLM'in kazancı sınırlıydı.

---

## 2. Ürün içindeki AI (X-Factor)

### Üç AI özelliği

| Özellik | Ne zaman | Ne yapar | Çıktı yeri |
|---------|----------|----------|-----------|
| **Similarity** | Yeni kart eklenince | Geçmiş retro kartlarıyla yeni metni karşılaştırır; "aynı konu daha önce konuşulmuş mu?" | Kartın altında amber banner |
| **Vagueness** | Yeni kart eklenince | Kartın muğlak olup olmadığını söyler, somutlaştırıcı soru üretir | Kartın altında sarı banner |
| **Recurring theme** | `/history` her açılışta | Kapanmış retrolarda 2+ retroda geçen ortak negatif tema | Sayfa başında kırmızı banner |

### Mimari karar: yerel LLM + deterministik fallback

```
Yeni kart eklenir
      │
      ▼
Promise.all([
  aiCheckSimilarity(text, pastItems),
  aiCheckVagueness(text)
])
      │
      ▼
Her biri:
  POST /api/ai/<task>   (client-side, 3sn AbortController)
        │
        ▼
  Server route:
    1. Ollama'ya JSON prompt gönder (yerel, http://localhost:11434)
    2. 3sn'de cevap gelmezse veya parse hatası varsa → mock heuristic
    3. Response: { source: "local-llm" | "mock", data: ... }
```

**Neden bu desen?**

| Sebep | Açıklama |
|-------|----------|
| Offline demo güvencesi | Jüri salonunda Wi-Fi yoksa bile çalışır |
| API key paranoyası yok | OpenAI/Anthropic key repo'da yok |
| Hız | LLM yavaşsa 3sn'de mock devreye girer, UI bloklanmaz |
| Deterministik demo | Mock heuristics seed verisini bilir; "deploy" yazınca her zaman aynı banner çıkar |
| Yerel AI anlatımı | Jüriye "veri dışarı çıkmıyor, model yerel" mesajını veriyor |

### Prompt yapısı

#### Similarity

```ts
const prompt = `Yeni madde: "${text}"
Geçmiş maddeler:
${formatted || "(boş)"}

Bu yeni madde geçmiştekilerden biriyle aynı konuyu mu işliyor?
JSON şeması: {"match": boolean, "similarItemId": string|null, "reason": string}`;
```

System prompt (`lib/ai/ollama.ts`):

```
Sen retro toplantı asistanısın. Sadece geçerli JSON cevap ver, başka metin yok.
```

**Validation:** Cevap geldiğinde `similarItemId` gerçekten `pastItems` içinde mi diye kontrol edilir, halüsinasyon ID'lerin geçişi engellenir.

#### Vagueness

```ts
const prompt = `Madde: "${text}"
Bu madde retroda konuşulmak için yeterince somut mu? Eğer muğlak ise tek bir somut soruyla netleştir.
JSON şeması: {"clear": boolean, "question": string|null}`;
```

#### Recurring theme

LLM **kullanmaz** — tamamen client-side `tokenize` + `Set<retroId>` analizidir. Türkçe stopword listesi (`için`, `bunu`, `şunu`…) ile gürültü ayıklanır.

Bu özellik özellikle LLM'siz tutuldu, çünkü:
- Tüm kapanmış retroyu LLM'e basmak prompt-token kalabalığı yapardı.
- Deterministiklik garantisi büyük (demo'da Sprint 22+23 ortak "deploy" temasını **kesin** yakalar).
- "Vay be" anı tek cümlede özetlenebiliyor: *"Deploy konusu son 2 retroda konuşuldu ve hâlâ çözülmedi."*

### Mock heuristics demo-rigging

`lib/ai/heuristics.ts` mock'ları **bilerek** seed verisini bilir. Bu hile değil, demonstration insurance:

- "deploy" geçen text → `SEED_IDS.deployItemId`'e bağlanır
- "süreç kötü" gibi muğlak ifadeler → "Hangi süreç? Hangi durumda? Etkisi ne?" sorusu
- Kısa (<25 char) text → "Biraz daha detay verebilir misin?"

Demo sırasında Ollama açık ya da kapalı olsun, jüri aynı sonucu görür. Banner üzerindeki `source` alanı `local-llm` veya `mock` olur — şeffaflık.

### `useAppState` ile reaktif güncelleme

AI çağrısı bittiğinde `store.updateItem(id, patch)` çağrılır; bu store'u günceller, listener'lar tetiklenir, `useSyncExternalStore` aboneliği olan tüm component'ler render olur. Kart kullanıcının gözü önünde **kart eklendikten 100–500ms sonra** AI banner'ıyla zenginleşir.

### "Vay be" anı

Sahnede gösterilecek senaryo:

1. Sprint notunda **"Süreç çok kötü."** notunu sürükle → Kötü Gitti kolonuna bırak.
2. Anında sarı AI banner: *"Hangi süreç? Hangi durumda? Etkisi ne?"*
3. Yeni kart: **"Deploy hâlâ yavaş, 2 saat sürüyor."**
4. Anında amber AI banner: *"Aynı konu Sprint 22 ve Sprint 23'te konuşulmuş, CI/CD aksiyonu hâlâ açık (45 gün)."*
5. `/history`'e geç → kırmızı banner: *"'Deploy' konusu son 2 retroda konuşuldu (Sprint 22, Sprint 23) ve hâlâ çözülmedi."*

Üç AI özelliği üç farklı renkte üç farklı yerde — jüriye "AI bu üründe estetik değil, çalışan bir hatırlatma" mesajı.

---

## Özet: AI'nın ürün ve süreçteki rolü

- **Süreçte:** Claude Code tek operatör; CLAUDE.md ve AGENTS.md ile project-level prompt engineering. İkincil araç yok, MCP yok.
- **Üründe:** Yerel Ollama (`llama3.2`, JSON mode) + deterministik mock fallback + saf client-side recurring detection. Üç renkli, üç noktalı bir AI hattırlatma sistemi.
- **Trade-off:** Bulut LLM yok → daha az "smart" görünebilir; ama offline demo, API key güvenliği ve deterministik akış kazanıldı.
