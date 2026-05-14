# Problem

## Hackathon brief

> **"Ekiplerin retrospektif toplantılarını dış platformlarda yapması ve bu toplantılarda alınan kararların (aksiyon maddelerinin) takibinin yapılamaması sebebiyle sonraki süreçlerde unutulup havada kalması."**

Bu, **iki ayrı ama iç içe geçmiş** problem. Çözmek için ikisini de adreslemek gerekiyor.

### 1. Retro toplantısı dağınık platformlarda yapılıyor

- Miro, Mural, Google Jamboard, Excel, hatta Slack thread'leri.
- Sprint biter, retro yapılır, **board kapatılır** — bir daha açılmaz.
- Aksiyon maddesi varsa "Jira'ya atalım" denir, ama atılan ticket'ın retroyla bağı kopar.

### 2. Aksiyon maddeleri unutulur

- Yeni sprint başlar, takım yeni sorunlara odaklanır.
- Bir önceki retrodan kalan aksiyonların açık mı kapalı mı olduğunu kimse takip etmez.
- 2–3 sprint sonra **aynı problem** tekrar konuşulur ("deploy yavaş", "code review geç dönüyor") — kimsenin dikkati eski aksiyona gitmez.

## Hedef kullanıcı

- **Scrum Master** (primary persona) — retroyu organize eder, aksiyonların sahibidir, retroyu kapatır.
- **Takım üyesi** (secondary) — sprint sırasında not bırakır, retroda kart ekler, kendi aksiyonunu günceller.

Uygulamada şimdilik **tek hardcoded kullanıcı** ("Ayşe — Scrum Master") var. Auth, multi-tenant, takım yönetimi MVP scope dışı.

## Çözüm yaklaşımı

Üç katmanlı bir koruma:

### Katman 1 — Tek yerde topla

Sprint notları, retro kartları ve aksiyonlar **aynı uygulamada**. Üçü arasında sürükle-bırak ile geçişler:

- Sprint notu → retro kartı (`store.moveNoteToRetro`)
- Retro kartı → sprint notu (`store.demoteItemToNote`)
- Retro kartı → aksiyon (`store.promoteItemToAction` — **dual-write**)

### Katman 2 — Aksiyonu kaybolmayacak hale getir

`promoteItemToAction` çağrıldığında:

1. `/actions` sayfasındaki global tabloya yeni bir `Action` kaydı düşer.
2. Retro boardun "Aksiyon" kolonunda yeni bir `RetroItem` (column: `"action"`) belirir.
3. İkisi de `sourceItemId` ile orijinal kötü/iyi-gitti kartına bağlanır.

Bu sayede aksiyon **dört farklı yerden görünür**:

- Aktif retronun kanban Aksiyon kolonunda
- `/actions` tablosunda
- Header'daki açık aksiyon **rozet sayacında**
- Mouse hover ile kaynak kartın yanında vurgulanmış olarak (hover-dim efekti)

### Katman 3 — AI tekrarları yakalar

Sadece UI çözümü yetmez çünkü kullanıcı yine de **aynı sorunu yeni kelimelerle** yazabilir. Bu yüzden üç AI kontrolü:

| Kontrol | Tetiklenme anı | Çıktı |
|---------|----------------|-------|
| Benzerlik | Yeni kart eklendiğinde | "Aynı konu Sprint 22'de açıldı, CI/CD aksiyonu hâlâ açık (45 gün)" |
| Muğlaklık | Yeni kart eklendiğinde | "Hangi süreç? Hangi durumda? Etkisi ne?" |
| Tekrar eden konu | `/history` her açıldığında | "'Deploy' konusu son 2 retroda konuşuldu (Sprint 22, Sprint 23) ve hâlâ çözülmedi" |

İlk ikisi yerel Ollama'ya gider, başarısız olursa deterministik mock'a düşer. Üçüncüsü tamamen client-side token analizi (mock değil, kalıcı bir özellik).

## Neden bu çözüm fark yaratır

Standart bir retro aracı + Jira entegrasyonu **veri**yi takip eder. Retro Tracker **konuyu** takip eder:

- Yeni "deploy yavaş" kartı eklenince **45 gün önce yazılan ilk kart**ı yüzeye çıkarır.
- `/history` sayfası "şu konu 2 sprint üst üste konuşuldu" diye **özetle uyarır** — kimsenin geçmişi tarayıp bunu kendinin keşfetmesi gerekmez.
- 30+ gün açık aksiyonlar **otomatik kırmızıya** geçer; göz attığında hemen görünür.

Bu, jüriye gösterilecek **"vay be"** anı: kullanıcı bir kelime yazar, AI 60 gün geriden bağlam getirir.
