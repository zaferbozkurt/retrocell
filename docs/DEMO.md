# Demo Scripti — 7 Dakikalık Sunum

> Jüri kuralı: "Slaytlara boğulmadan doğrudan çalışan ürünü açın. Geliştirdiğiniz çözümün 'unutulan aksiyonlar' problemini nasıl çözdüğünü kullanıcı deneyimini sahnede canlı olarak gösterin."

Bu script tarayıcı önünde, **slayt yok**, sadece uygulama açık akar. Her aşamanın yanında **hedef süre** ve **konuşma metni** bulunur.

---

## Sunum öncesi 60 saniyelik check (sahneye çıkmadan)

- [ ] `npm run dev` çalışıyor, `http://localhost:3000` açık
- [ ] Reset butonuna basıp **temiz seed state**'e döndün
- [ ] Tarayıcı zoom %110–125 (uzaktan okunabilir)
- [ ] DevTools kapalı, tab listesi kalabalık değil
- [ ] (İsteğe bağlı) Ollama açık → `ollama serve` ve `ollama run llama3.2` warmup tamam
- [ ] Network panel'inde 3sn timeout'u görmek için DevTools açmana gerek yok — UI zaten her durumda banner gösterir

---

## Akış

### 00:00 — 00:30 — Açılış (30 sn)

**Konuşmacı:**
> "Selam, biz [takım]. Problem: takımlar retroları Miro/Slack/Excel'de yapıyor, çıkan aksiyonlar **bir sonraki sprintte unutuluyor**. Aynı sorun iki ay sonra tekrar konuşuluyor. Biz Retro Tracker ile bu unutmayı üç katmanda kırdık. Doğrudan göstereyim."

**Ekran:** Retro board, `Sprint 24` aktif, 4 sprint notu sidebar'da, 4 kart boardda.

---

### 00:30 — 01:30 — Aksiyon dual-write (60 sn)

> "Sprint 22'de yazılmış 'Deploy süreçleri yavaş' kartı vardı, bundan 'CI/CD optimizasyonu' diye bir **aksiyon** çıkardık. 45 gün önce. Üstüne çıktığımda bakın…"

**Eylem:**
- `/actions` sekmesine geç → CI/CD aksiyonu **kırmızı bordürlü**, "45 gün" yazısıyla.
- "30 günden eski açık aksiyonları otomatik kırmızıya boyuyoruz. Hiçbir yerde gözden kaçmasın diye **dual-write** yaptık."

**Konuşmacı:**
> "Bir karta `→ Aksiyon` deyince aynı anda **iki yere** yazıyoruz: hem bu tabloya hem retro boardun Aksiyon kolonuna. Üstelik header'daki bu rozette **açık aksiyon sayısı** her zaman görünüyor — tarayıcı sekmesi gibi."

---

### 01:30 — 03:30 — AI uyarıları (2 dk — X-Factor #1)

> "Şimdi en sevdiğim kısım. Aktif retroya yeni bir kart ekleyeyim."

**Eylem:** Retro sayfasına dön. **Kötü Gitti** kolonuna yaz:

```
Deploy hâlâ yavaş, 2 saat sürüyor.
```

**Kartı ekle.** Yaklaşık 100–500ms sonra kartın altında **amber AI banner** belirir:

> *AI: Aynı konu Sprint 22 ve Sprint 23'te konuşulmuş, CI/CD aksiyonu hâlâ açık (45 gün). İlgili madde: "Deploy süreçleri çok yavaş, her release 2 saat sürüyor."*

**Konuşmacı:**
> "Yerel bir LLM — Ollama — geçmiş retro kartlarıyla karşılaştırma yapıyor ve **45 gün önce yazılmış kartı yüzeye çıkarıyor**. Bulut yok, API key yok, veri dışarı çıkmıyor."

**İkinci kart — muğlak ifade testi.** Yine Kötü Gitti'ye:

```
Süreç kötü.
```

**Kartı ekle.** Sarı AI banner:

> *AI: Hangi süreç? Hangi durumda? Etkisi ne?*

**Konuşmacı:**
> "Aynı LLM bu sefer ifadeyi muğlak buldu ve **somutlaştırıcı soru** üretti. Retroda 'süreç kötü' yazıp geçen kimse bunu artık yapamayacak."

**Sidebar trick (10sn):**
- Sidebar'daki "Süreç çok kötü." notunu sürükle → Kötü Gitti kolonuna bırak.
- "Sidebar'dan da çalışıyor. Sprint sırasında biriken notlar **retroda kaybolmaz**."

---

### 03:30 — 04:30 — Recurring theme (60 sn — X-Factor #2)

> "Burası 'vay be' anı."

**Eylem:** `/history` sekmesine geç.

Sayfa açılır açılmaz üstte **kırmızı banner**:

> *AI Tespiti: "Deploy" konusu son 2 retroda konuşuldu (Sprint 22, Sprint 23) ve hâlâ çözülmedi.*

**Konuşmacı:**
> "Hiç tıklamadan, kimse bunu özetlemeden — uygulama kapanmış retroların kötü-gitti kartlarını analiz edip **tekrar eden temayı** ortaya çıkardı. Standart bir retro aracı veriyi listeler. Biz **konuyu** takip ediyoruz. Aksiyonun unutulup unutulmadığını **kelime bazında** anlayabiliyoruz."

**Eylem:** Sayfayı aşağı kaydır → Sprint 22 ve Sprint 23 kartları, **kapanma yüzdeleri**, "Sprint 22: %50, Sprint 23: %50" — yarısı hâlâ açık.

---

### 04:30 — 05:30 — DnD + reset (60 sn)

> "Hızlıca etkileşimi göstereyim."

**Eylem zinciri (akıcı):**
1. Sprint notunu sidebar'dan İyi Gitti'ye sürükle.
2. Bir İyi Gitti kartını double-click ile düzenle, "Yeni QA ortamı **harika**" diye değiştir.
3. Kötü Gitti kartının `→ Aksiyon` butonuna bas, başlık yaz: "Daily standup özet maili", Enter.
4. Header'daki açık aksiyon rozeti **bir artar**.
5. Üst sağdaki dairesel ok ikonuna bas → `Tüm veriyi seed haline geri al?` → Tamam.
6. Her şey baştan seed'e döner.

**Konuşmacı:**
> "Native HTML5 drag-and-drop, iki ayrı MIME type — kartlar ve notlar karışmasın diye. State `localStorage`'da, refresh güvenli. Reset butonu jüri için: demoyu istediğim kadar oynatabilirim."

---

### 05:30 — 06:30 — AI stratejisi (60 sn)

> "İki dakikam kaldı, geliştirme tarafına geçelim."

**Konuşmacı (slayt yok, repo yapısını dilden anlat):**
> "Tek AI aracı kullandık: **Claude Code, Opus 4.7**. Repo kökünde `CLAUDE.md` ve `AGENTS.md` var — bunlar Claude'a kalıcı talimatlar. Mimari invariantlar, demo-rigging davranışı, Next.js 16'nın eski training data ile çeliştiği uyarısı — hepsi orada. Bu sayede Claude her oturumda doğru bağlamla başladı."

> "Ürünün içindeki AI tarafında ise **fallback discipline** önemliydi: Yerel Ollama erişilemezse veya 3 saniyede cevap vermezse, deterministik mock heuristic devreye giriyor. Demo'nun LLM'e bağımlı olmamasını istedik. Bu anı sahnede yaşıyorsunuz: AI uyarısı **kesin** geliyor."

> "Üç dökümantasyon dosyası repoda: `docs/PROBLEM`, `docs/ARCHITECTURE`, `docs/AI-STRATEGY`. AI iş bölümünü `docs/AI-STRATEGY.md`'de ayrıntılı yazdık."

---

### 06:30 — 07:00 — Kapanış (30 sn)

> "Özet:
> 1. **Tek yerde topla** — notlar, kartlar, aksiyonlar aynı uygulamada.
> 2. **Aksiyonu görünmez kılma** — dual-write + 30 gün kırmızı + rozet sayacı.
> 3. **AI ile tekrarları yakala** — yerel LLM + mock fallback, üç farklı noktada üç farklı renk.
>
> Aksiyon unutuluyorsa **uygulamadan** unutuluyordu, biz onu görünür yaptık. Teşekkürler."

---

## Q&A için hazırlık (3 dk)

Beklenen sorular ve hazır cevaplar:

| Soru | Cevap |
|------|-------|
| "Neden Ollama, neden bulut LLM değil?" | Offline demo, API key paranoyası, veri gizliliği. Yerel model demo salonunda Wi-Fi olmasa bile çalışır. |
| "Production'da nasıl ölçeklenir?" | localStorage yerine Postgres + multi-user auth, Ollama yerine OpenAI/Anthropic gateway. Mock fallback patern'i aynen kalır. |
| "Test yok mu?" | 3 saatlik scope dışı. Type system + manual smoke + reset ile compensate ediliyor. Genişleyince Vitest + Playwright eklenebilir. |
| "Recurring theme neden LLM kullanmıyor?" | Deterministik olsun istedik (demo garantisi) + tüm geçmiş kartları LLM'e basmanın token maliyeti. Token + Set analizi yeterli. |
| "Drag-and-drop neden kütüphane değil?" | dnd-kit/react-dnd 50KB+ ekler; üç drop target'ımız var, native HTML5 + iki MIME yeterli. Edge case'leri özelleştirebildik (edit modunda drag kapalı). |
| "Aksiyon tablosu nasıl güncelleniyor?" | Store mutation'ı tetikleniyor, `useSyncExternalStore` subscriber'ları re-render ediyor. Real-time backend ekleyince WebSocket'a evriltilebilir. |
| "Yeni retro açma UI'ı var mı?" | MVP scope dışı — seed verisi 3 retro içeriyor. `store.closeRetro` var, `store.openRetro` eklemek 5 satır. |
| "Türkçe dışında dil destekleniyor mu?" | Hayır, copy hardcoded. i18n out-of-scope. Genişleyince `next-intl` doğal aday. |

---

## Felaket senaryoları

| Sorun | Anlık çözüm |
|-------|------------|
| LLM cevap vermiyor | Sorun değil — 3sn'de mock devreye girer, banner aynı şekilde çıkar. "Mock fallback'imiz var" diye sahneye not düş. |
| `localStorage` bozulmuş | Reset butonu → seed'e döner. Olmazsa DevTools → Application → `retro-tracker.v2`'yi sil + refresh. |
| Tarayıcı drag-drop çalışmadı | Yerel olarak Chrome/Edge kullan; Safari'de daha az test edildi. |
| Sayfa beyaz | DevTools console → muhtemelen hydration mismatch. Reset + refresh. |
| Tarih copy'leri yanlış | `lib/date.ts` `TODAY = "2026-05-14"` hardcoded; sistem tarihinden bağımsız demo deterministik. |
