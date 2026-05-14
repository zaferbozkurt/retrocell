# Yol Haritası — Gelecek Planları

Hackathon sonrası ürünü ileri taşımak için belirlediğimiz dört ana eksen. Hepsi [`LESSONS-LEARNED.md`](./LESSONS-LEARNED.md)'den çıkan derslerle bilinçli olarak hizalandı: önce **veri kalıcılığı** (yapamadığımız iş), sonra **dış sistem entegrasyonu**, sonra **gerçek AI** (mock'tan kurtulma).

## Özet öncelik sırası

| # | Madde | Öncelik | Tahmini efor | Bağımlılık |
|---|-------|---------|--------------|------------|
| 1 | Firebase / DB bağlantısı | **Yüksek** | 1–2 gün | Yok — ilk başlamalı |
| 2 | Jira entegrasyonu (token, task açma) | Yüksek | 2–3 gün | #1 (kullanıcı tokenını kalıcı saklamak için) |
| 3 | AI bağlantısı olmayan kartlarda detay isteme | Orta | 1 gün | Mevcut AI altyapısı |
| 4 | AI ile tekrar eden + çözülmemiş maddelerin tespiti | Orta | 1–2 gün | Mevcut AI altyapısı, ideal olarak #1 |

---

## 1) Firebase / DB bağlantısı — mock'tan kurtulma

**Hedef:** State'i tarayıcıdan çıkar, gerçek bir persistence katmanına taşı. Multi-user / multi-device senaryosunu mümkün kıl.

### Şu anki durum

- Tüm state `lib/seed.ts` ile başlar, `lib/store.ts` içindeki singleton üzerinden mutasyonlanır.
- Persist tek nokta: `localStorage` (`retro-tracker.v2` anahtarı).
- Hackathon'da Firebase RTDB denendi ancak bağlantı sorunları sebebi ile vazgeçildi (bkz. [`LESSONS-LEARNED.md`](./LESSONS-LEARNED.md#1-firebase-entegrasyon-sıkıntısı--mock-dataya-dönüş)).

### Planlanan değişiklik

- **Persistence interface'i** soyutla: `store.ts`'in iç durumunu değiştirmeden persist + load fonksiyonları stratejiye taşınsın (`persistence/localStorage.ts`, `persistence/firebase.ts`).
- **Firebase Realtime Database** veya **Firestore** seçimini ölçütle yap:
  - RTDB: daha basit veri modeli, realtime listener
  - Firestore: query, indexing, scaling — uzun vadede kazançlı
- **Auth katmanı**: Firebase Auth (Google sign-in) + bir `currentUser` profili.
- **Schema migration**: `localStorage > retro-tracker.v2` formatından Firestore'a tek seferlik import script'i.

### Risk azaltma (önceki hatanın tekrarlanmaması)

- **Timebox**: bağlantıyı kurmak için 4 saatlik strict pencere; içinde olmazsa Supabase'e geç.
- **Connection-only POC** ile başla: önce tek bir document'a yaz/oku, hiçbir UI değişmeden. Onaylanınca store entegrasyonu.
- **Local + remote dual-write** ilk hafta: localStorage halen primary, Firebase secondary. Üçüncü hafta swap.

### Tamamlandığında

- Aynı kullanıcı farklı tarayıcılardan bağlandığında **aynı veriyi** görür.
- Takım üyeleri **gerçek kullanıcılar** olur (hardcoded `"Ayşe"` kaldırılır).
- Demo state hala mevcut: yeni hesap = boş database = seed import opsiyonu.

---

## 2) Jira entegrasyonu — aksiyonlar otomatik task olur

**Hedef:** Retroda bir karta `→ Aksiyon` deyince, Jira'da da o anda bir task açılsın. Aksiyonun Jira ID'si retro tarafında da görünsün.

### Şu anki durum

- `store.promoteItemToAction` lokal **dual-write** yapıyor: `Action` + `RetroItem(column: "action")`.
- Jira / dış sistem **bağlantısı yok**.

### Planlanan değişiklik

- **Kullanıcı bazlı Jira API token** saklama:
  - Settings sayfası → "Jira'ya bağlan" → kullanıcı `<jira-domain>` + email + API token girer.
  - Token Firebase Auth user document'inda saklanır (encrypted-at-rest). Client'ta plaintext dönmez.
- **Backend proxy** (yeni `app/api/jira/*` route'ları):
  - `POST /api/jira/issue` → Jira REST API `POST /rest/api/3/issue`
  - Body: `{ projectKey, summary, description, issuetype }`
  - Aksiyon başlığı + retro ismi + kaynak kart metni description'a girer.
- **`promoteItemToAction` extension**:
  - Lokal `Action` kaydına `jiraIssueKey` alanı eklenir.
  - Mutation sonrası background'da Jira'ya POST atılır, dönen issue key Action'a yazılır.
  - Hata olursa `jiraIssueKey: undefined` + uyarı banner'ı, lokal kayıt yaşamaya devam eder (fallback discipline).
- **`/actions` tablosunda Jira link**: `jiraIssueKey` varsa Jira issue'ya tıklanabilir link.

### Schema değişikliği

```ts
type Action = {
  // ... mevcut alanlar
  jiraIssueKey?: string;       // "PROJ-1234"
  jiraSyncError?: string;      // başarısızsa hata mesajı
  jiraSyncedAt?: string;
};
```

### Edge cases

- Token süresi dolarsa → settings'e geri yönlendir.
- Aksiyon Jira'da kapatılırsa → webhook (faz 2) veya manuel "Jira'dan güncelle" butonu (faz 1).
- Aksiyon Retro Tracker'da silinirse → Jira'dakine dokunma (silmek kullanıcı dışında bir kararla yapılmamalı), sadece Action kaydı silinir.

### Tamamlandığında

- Aksiyon "Jira'ya atalım" cümlesi tamamen ortadan kalkar. Tek tık = Jira issue.
- `→ Aksiyon` butonu hem retro tracking hem proje yönetimi tarafını doldurur.

---

## 3) AI bağlantısı olmayan kartlarda detay isteme

**Hedef:** Mevcut AI vagueness check'i daha **proaktif** hale getir. Sadece kart eklenirken değil, var olan veya sonradan düzenlenen tüm "AI dokunmamış" kartlarda da detay sorgusu çıksın.

### Şu anki durum

- `aiCheckVagueness` **sadece kart eklendiği anda** tetikleniyor (`app/page.tsx > onAdd`).
- Eski (seed) kartlar `isVague` / `vagueQuestion` alanı boş geliyorsa kontrol edilmiyor.
- Düzenlenen kartın yeni metni AI'a tekrar gönderilmiyor.

### Planlanan değişiklik

- **"Henüz incelenmemiş" tag'i**: her `RetroItem` için `aiCheckedAt?: string` alanı.
- **Background scan**: retro board açıldığında `aiCheckedAt` boş veya `text` değişikliği sonrasında olan kartlar **kuyruğa** alınır.
- **Rate-limited worker**: en fazla 2 paralel istek, her tamamlananda bir sonraki sıraya geçer. Kullanıcı UI'ı bloklanmaz.
- **Visual cue**: incelenmemiş kartlarda küçük bir `…` rozet veya gri ikon — "AI henüz bakmadı".
- **Düzenleme sonrası re-check**: `store.updateItem` patch'i text içeriyorsa `aiCheckedAt` reset, kart tekrar kuyruğa girer.

### UX detayı

- "AI tetiklensin" butonu manuel olarak da olsun (kullanıcı seçimi).
- Vagueness sorusu cevaplanabilir hale gelsin: banner içinde "Cevap ekle" → kartın altına ek note olarak eklenir.

### Tamamlandığında

- Sprint başında biriken **eski** muğlak kartlar da yüzeye çıkar.
- Kart düzenleyince AI hala dinler — "muğlaktan somuta" geçiş anı yakalanır.
- Hiçbir kart "AI dokunmamış" kalmaz.

---

## 4) AI ile tekrar eden + çözülmemiş maddelerin tespiti

**Hedef:** Mevcut `detectRecurringTheme` token-based mantığını **gerçek AI** ile değiştir. Daha akıllı clustering, daha iyi Türkçe semantik anlama, "çözülmemiş" boyutunu da hesaba kat.

### Şu anki durum

- `app/history/page.tsx > detectRecurringTheme` saf client-side `tokenize` + `Set<retroId>` analizi.
- Türkçe stopword listesi var ama eş anlamlıları yakalamıyor ("deploy" ≠ "release süreci").
- Sadece **kapanmış retrolarda** çalışıyor, aktif retroyla kıyaslamıyor.
- "Çözülmemiş" sinyali yok — sadece tekrar eden konuyu söylüyor, aksiyonu ile bağ kurmuyor.

### Planlanan değişiklik

- **LLM-based clustering**:
  - Tüm geçmiş `column: "sad"` kartlarını LLM'e gönder.
  - Prompt: "Bu kartları konu bazında grupla. Her grup için: konu adı, ilgili kart ID'leri, kaç farklı retroda geçtiği."
  - Schema: `[{ topic: string, itemIds: string[], retroCount: number }]`
- **"Çözüm durumu" join**:
  - Her grubun `itemIds`'i için `sourceItemId` zincirini takip et → ilgili `Action[]` bul.
  - Tüm aksiyonlar `done` mu, yoksa hâlâ açık olan var mı?
  - Status: `unresolved` (en az 1 açık aksiyon) / `resolved` (hepsi done) / `no-action` (hiç aksiyon çıkmamış — en kötüsü).
- **Banner yenileme**:
  - "Deploy konusu 3 retroda konuşuldu, 45 gündür açık 1 aksiyon var" (unresolved)
  - "Code review konusu 2 retroda konuşuldu ama aksiyon hiç çıkmamış" (no-action — alarm seviyesi)
  - "QA konusu 2 retroda konuşuldu, ilgili 3 aksiyon kapanmış" (resolved — kutlama)

### Cloud LLM mi, Ollama mı?

- **Ollama** kullanmaya devam:
  - Veri dışarı çıkmaz (kurumsal müşteri için önemli)
  - Maliyet sıfır
  - Demo offline'da da çalışır
- **Cloud LLM opsiyonu**:
  - Daha büyük context, daha iyi Türkçe semantik
  - Settings'te toggle: "Yerel" / "OpenAI" / "Anthropic"
  - Token settings ekranı (#2 ile aynı altyapı)
- **Mock fallback** kalsın — her durumda demo deterministik.

### Schema değişikliği

```ts
type RecurringTheme = {
  topic: string;
  itemIds: string[];
  retroIds: string[];
  status: "unresolved" | "resolved" | "no-action";
  oldestOpenActionDays?: number;
};

// AppState'e cache eklenir:
type AppState = {
  // ...
  recurringThemes?: { generatedAt: string; results: RecurringTheme[] };
};
```

Cache 24 saat geçerli, sonra `/history` ziyaretinde yeniden hesaplanır.

### Tamamlandığında

- "Deploy" sınırlı kelime eşleşmesi yerine **semantik benzerlik** ile tespit edilir.
- Tekrar eden konunun **çözüm durumu** ile birlikte sunulması ⇒ jüriye demo yapan bu noktayı çok güçlü vurgulayabilir.
- Aktif retro X. retroda da konuşulan konu erkenden uyarıyla başlar — "Bu konuyu **yine** mi açıyoruz?"

---

## Cross-cutting iyileştirmeler

Roadmap maddelerinin yanında, her birinde dokunulacak yatay konular:

- **Test suite**: en azından store mutation'ları için Vitest (`addItem`, `promoteItemToAction`, `moveNoteToRetro`). Hackathon'da yokluğu hissedilmedi ama #1 ve #2 ile yeni domain'ler giriyor, regresyon riski büyüyor.
- **Error reporting**: Sentry veya benzeri. AI fallback durumları ve Jira sync hataları görünsün.
- **Settings sayfası** (yeni `/settings`): Jira token, AI sağlayıcı seçimi, "demo verisini yükle" butonu.
- **Yeni retro açma UI**: şu an seed verisi 3 retro içeriyor; #1 sonrası gerçek kullanıcı kendi retrolarını açabilmeli (`store.openRetro` mutation'ı eklenecek).
- **i18n hazırlığı**: copy hardcoded Türkçe; #1 ile multi-tenant'a açılırken `next-intl` altyapısı düşünülmeli.

## Önümüzdeki 4 hafta için sprint planı (taslak)

| Sprint | Ana hedef | Kapsam |
|--------|-----------|--------|
| Hafta 1 | Persistence soyutlaması + Firebase POC | #1 connection-only POC, lokal + remote dual-write |
| Hafta 2 | Firebase tam geçiş + Auth | #1 tamamlanır, hardcoded user kaldırılır |
| Hafta 3 | Jira entegrasyonu | #2 token UI + proxy route + `promoteItemToAction` hook |
| Hafta 4 | AI iyileştirmeleri | #3 background scan + #4 LLM-based clustering |

Bu sprint planı [`LESSONS-LEARNED.md`](./LESSONS-LEARNED.md)'deki "ilk 30 dakika kod yazmadan, plan kilitlenir" disiplinine bağlı kalır: her sprint başında MVP scope'u önce kilitlenir, AI'a bırakılan parça önceden belirlenir.
