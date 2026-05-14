# Proje Planı

## Vizyon

3 saatlik bir hackathon penceresinde, **çalışan, demosu deterministik, AI dokunuşu hissedilen** bir retro & aksiyon takip uygulaması teslim etmek.

> "Slaytlara boğulmadan doğrudan çalışan ürünü açın" — jüri beklentisi. Plan buna göre çıkarıldı.

## Başarı kriterleri

Sunum başlangıcında üzerinde mutabık kalınan **terk edilemez** kriterler:

1. Türkçe arayüz — hackathon brief'i Türkçe.
2. Tek tıkla `npm run dev` ile çalışsın, dış servis/auth/DB gerekmesin.
3. `localStorage` ile state kalıcı olsun → demo sırasında refresh güvenli.
4. Demo state **deterministik** → her açılışta aynı seed veri görünsün.
5. Üç AI özelliği (benzerlik, muğlaklık, tekrar eden konu) görünür, demo-rigged ve **LLM olmadan da çalışır halde** olsun.
6. 7 dakikalık demo akışı kesintisiz olsun → reset butonu, `localStorage` ile aynı tarayıcıda tekrar oynanabilir olsun.

## In scope (MVP)

### Sayfalar
- **`/`** — Retro board (kanban + sprint notları sidebar + stat cards)
- **`/actions`** — Tüm aksiyonların tablosu, filtre, durum cycling
- **`/history`** — Kapanmış retrolar + recurring theme uyarısı

### Etkileşimler
- Sprint notu ekle / sil
- Sprint notunu retroya sürükle (kolon seç)
- Retro kartı ekle / düzenle (double-click) / sil
- Retro kartını kolonlar arası taşı
- Retro kartını sprint notlarına geri sürükle
- Retro kartını aksiyona dönüştür (dual-write)
- Aksiyon durumu cycle: open → in_progress → done → open
- Retroyu kapat (status: closed, summary opsiyonel)
- Tüm state'i seed haline geri al (reset)

### AI özellikleri
- Yeni kartta benzerlik kontrolü → banner
- Yeni kartta muğlaklık kontrolü → soru banner'ı
- `/history`'de recurring theme tespiti → kırmızı banner
- Tüm AI çağrıları **Ollama → mock** fallback'li
- 3 saniye timeout, kullanıcı asla bloklanmaz

### Görsel
- Tailwind v4 utility-first stil
- Slate base + indigo primary + emerald/rose/sky kolon tonları
- Aktif retro, en eski aksiyon, kart sayısı için 3 stat card

## Out of scope (yapılmadı)

- Auth, multi-user, ekip yönetimi
- Backend, veritabanı, server-side persistence
- Real-time collaboration
- Mobile UI (responsive ama mobil-optimize değil)
- Dark mode (next-themes dep var ama wire edilmedi)
- Test suite (manual smoke + typecheck)
- i18n (sadece Türkçe)
- Notification/email/Slack
- Yeni retro açma UI (seed verisi 3 retro içerir — aktif olan Sprint 24)
- Dynamic routes (sadece statik 3 sayfa)
- Sprint planning, capacity, velocity

## Risk listesi & mitigasyon

| Risk | Mitigasyon |
|------|-----------|
| Ollama çalışmaz / yavaş | 3sn timeout + deterministik mock fallback, source: "mock" tag |
| Demo sırasında state bozulur | Reset butonu (üst sağ) — `store.reset()` ile seed'e döner |
| LLM JSON'ı geçersiz | Try/catch + null döner + fallback mock |
| Selector instability → infinite re-render | `useSyncExternalStore` + stable selectors, CLAUDE.md'de invariant olarak işaretli |
| Tarih hesapları ortama bağlı | `lib/date.ts` `TODAY = "2026-05-14"` hardcoded → demo deterministik |
| Drag-and-drop browser farkları | Native HTML5 + özel MIME types, modern Chromium/Safari'de test |

## Karar günlüğü

| Karar | Neden |
|-------|-------|
| State için Redux/Zustand değil, **kendi singleton store** | 3 saatte bir bağımlılık daha eklemek yerine 100 satırda kontrol; `useSyncExternalStore` zaten React 19 ile prime time |
| Backend yok, **localStorage** | Hackathon scope'unda DB kurmaya değmez; deploy basitleşir |
| **Ollama** (yerel LLM), bulut yok | Internet/API key riski sıfır, demo offline yapılabilir, jüriye "yerel AI" anlatımı güçlü |
| **Mock fallback** kararı | Demo'nun LLM'e bağımlı olmasını istemedik; AI banner'ı her durumda gözükmeli |
| Türkçe **hardcoded** | i18n için zaman yok, brief Türkçe; sabit copy daha hızlı |
| `app/api/ai/*` route handler'lar | Client'tan doğrudan Ollama çağırmak CORS + secret expose riski; sunucu proxy mantıklı |
| `promoteItemToAction` **dual-write** | "Aksiyon kolonunda görünsün" ve "tabloda görünsün" gereksinimleri çakışıyordu; iki kayıt + `sourceItemId` bağı en temiz |

## Teslim hedefi

- **17:30** — GitHub'a push, public, kod kilitli.
- **17:45** — Sahne sırası, 7 dk demo + 3 dk Q&A.

Detaylı zaman çizelgesi: [`PHASES.md`](./PHASES.md). Demo akışı: [`DEMO.md`](./DEMO.md).
