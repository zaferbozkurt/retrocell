# Yaşanılan Sorunlar & Çıkarılan Dersler

> Bir retro uygulaması yapan takımın **kendi retrosu**. Hackathon 3 saatlik penceresinde neyi yanlış yaptık, bir dahaki sefere ne değişmeli.

Bu doc dört maddeyi açık açık not eder. Amaç jüriye "her şey yolundaydı" görüntüsü değil; gerçek karar günlüğünü teslim etmek.

---

## 1) Firebase entegrasyon sıkıntısı → mock data'ya dönüş

**Ne oldu:**
- İlk plan **Firebase Realtime Database** ile state'i kalıcılaştırmaktı.
- Bağlantı kurarken authentication, rules ve realtime listener tarafında ardı ardına problem çıktı.
- Hata ayıklama bizi planlanandan **çok daha uzun süre** Firebase üzerinde tuttu.
- Süre kısıtı netleşince **başka bir DB çözümüne geçmek de olanaksız** hale geldi (Postgres/Supabase setup, schema, migration için zaman yoktu).

**Sonuç:**
- Tüm veri repository'de **mock seed** olarak yer alıyor (`lib/seed.ts`), state `localStorage`'da persist ediliyor.
- Commit izinde bu sapma görülebilir: `b5b2fef Add firebase` → `9ad3e3d Revert "Add firebase"`.

**Etki:**
- Multi-user / multi-device senaryo MVP'den düştü.
- Demo veri **deterministik** oldu (artı yan etki: jüri demosu her oturumda aynı).

**Bir dahaki sefere:**
- Hackathon başında en riskli entegrasyonu **timebox**'la (örn. 30 dk). Çözüm o sürede çıkmazsa **anında plan B**'ye geç.
- DB seçimini brief gelmeden önce yap, kurulumu önceden test et. Saat 14:30'da "Firebase setup nasıl yapılıyor"a bakmak en geç noktadır.
- "Persistence katmanı" arkasında **soyutlama** olsun — `store.ts` zaten saf JS singleton; Firebase, Supabase veya REST takılması 50 satırlık iş olmalı, ama bu soyutlama da maliyetlidir; baştan kararlaştırılmalı.

---

## 2) Detaylarda boğulma — MVP yerine kompleks fikir avı

**Ne oldu:**
- Brief açıldıktan sonra "vay be" özellikleri konuşmaya çok zaman harcadık: AI-driven sentiment graph, takım dinamiği skoru, otomatik retro özetlemesi, vs.
- Bunların hiçbiri MVP **olmadan** anlamlı değildi.
- Temel CRUD + kanban + DnB akışı başlaması gereken anda başlamamıştı.

**Sonuç:**
- İlk 30–45 dakika büyük ölçüde **konuşmayla** geçti.
- Kompleks fikirleri **kesip** atınca MVP hızla çıktı, ama bu noktada saatin gösterdiği zaman daha azdı.

**Etki:**
- Cilalama (animasyonlar, daha iyi mobil layout, dark mode, in-product tutorial) için süre kalmadı.
- Üç AI özelliği yine de yetişti çünkü mock fallback'i bilinçli olarak basit tuttuk.

**Bir dahaki sefere:**
- Brief okunduktan sonra **15 dakika MVP scope kilidi**. Bu 15 dakikadan sonra yeni özellik fikrini "post-MVP" listesine yaz, MVP'ye dokunma.
- "Worst version that demos the core idea" kavramını ilk dakikadan benimse. Cilalama her zaman son saatte yapılır, ilk saatte değil.
- Tek bir kişiye **scope-keeper** rolü ver: yeni fikir çıkınca "bu MVP içinde mi?" diye sorması gerekiyor.

---

## 3) Branch → PR → Merge akışını atlama → conflict ve vakit kaybı

**Ne oldu:**
- Hız adına `main` üzerinde doğrudan commit yapmayı planladık.
- İki kişi paralel çalışırken aynı dosyaya (özellikle `lib/store.ts` ve `app/page.tsx`) eş zamanlı dokunuldu.
- `git pull` sırasında **merge conflict'leri** çıktı, bazıları manuel resolve gerektirdi.
- Conflict resolution'ı sırasında bazı satırlar yanlış birleşti ve **bir kez geri almak** zorunda kaldık.

**Sonuç:**
- "Hızlı olalım diye PR'sız" kararı, sanılanın aksine **daha yavaş** çıktı.
- Net olarak ne kadar zaman kaybedildi ölçemiyoruz ama tahmini 20–30 dakika.

**Etki:**
- Code review yok → bazı küçük hatalar tek kişinin gözünden geçti, üst üste yığıldı.
- "Şu an hangi versiyonda kim ne yaptı" görünürlüğü azaldı.

**Bir dahaki sefere:**
- Hackathon'da bile **kısa-ömürlü branch** + **fast-merge PR** akışı kalsın. CI yoksa PR template'i de minimal olabilir; önemli olan **lineer history**.
- Trunk-based development isteniyorsa **dosya bazında iş bölümü** kesin olmalı (ör: kişi A `lib/`, kişi B `app/`, kesişme yok).
- `git rebase` ve `git stash` reflekslerinin önceden tazelenmiş olması lazım — hackathon ortasında Stack Overflow açmak lüks.

---

## 4) AI / AI tool'larla çok rahat davranma — en büyük hata

**Ne oldu:**
- Günlük rutinde sürekli Claude, Copilot, ChatGPT kullanan bir ekibiz. Bu rahatlık hackathon'a da yansıdı.
- Prompt'ları yeterince **bağlamsız** ve **hedefsiz** yazdık; "şunu yap"a karşı Claude da geniş bir şey üretti, sonradan kırpmak gerekti.
- Validation adımı (üretilen kodu okumak, anlamak, gerekirse reddetmek) bazı noktalarda atlandı.
- "AI çözer" varsayımı bir kaç saat sonra **biriken küçük hataların** birleşik faturasını ödedi: tutarsız stil, anlık çalışan ama mantığı tartışmalı parçalar, gereksiz abstraction'lar.

**Sonuç:**
- Bazı bölümleri tam anladığımızdan emin değiliz; demo sırasında soruya cevap verirken zorlanabiliriz.
- Tekrar gerekecek refactor'ları zaman bitti diye yapamadık.

**Etki:**
- En kritik etkisi **özgüven yanılgısı**: "AI nasılsa yapar" diye, planlamayı ve gözden geçirmeyi savsakladık.
- Bu, ilk üç sorunun da kök nedenlerinden biri (Firebase iş çıkardığında "AI çözer" diye uzattık; conflict'lerde "AI birleştirir" diye dikkat azaldı; scope'ta "AI hızlandırır" diye gevşedik).

**Bir dahaki sefere:**
- AI bir **araç**, plan değil. Plan **insanlar** tarafından, daha çıkarılmadan kilitlenmeli.
- Her AI çıktısını "ben yazsaydım böyle mi yazardım?" filtresinden geçir. Geçmiyorsa **reddetmek serbest**.
- Pair-programming gibi **AI-with-me** modunda çalış: AI öneri sunar, insan kabul/red eder, ama insan her satıra dokunur. "AI üret, ben yapıştır" modu hackathon-grade hata.
- Karmaşık entegrasyonlarda (Firebase gibi) AI'ın hızlı çözüm sunmasını **bekleme**. Belgeleri kendi gözünle oku.

---

## Kök neden analizi

Dört maddenin ortak kökü tek: **planlama yokluğu**. AI'a fazla güvenmek (#4) plansızlığa cesaret verdi; plansızlık kompleks fikir avına (#2) ve sürdürülemez branch akışına (#3) yol açtı; vakit kaybı Firebase ile uğraşıyken (#1) süre baskısını her şeye yıktı.

Sonraki hackathonda **ilk 30 dakikayı koda dokunmadan** geçireceğiz:
1. Brief'i okuma
2. MVP scope'u kilitleme
3. DB / persistence kararını verme (timebox dahil)
4. Branch & merge stratejisini belirleme
5. AI iş bölümünü netleştirme (kim AI'ya ne için soracak, kim üretileni doğrulayacak)

---

## Olumlu tarafı

Doğru yaptığımız iki şey:

1. **Fallback discipline** — AI'ın çalışmama ihtimalini ürünün içine baştan kabul ettik (mock heuristics). Demo bu sayede LLM yoksa da çalışıyor.
2. **localStorage'a zamanında dönüş** — Firebase saplantısından çıkmak gecikti ama çıkıldı. Backend olmadan da demo edilebilir bir ürün teslim edebildik.

Sonraki dökümanda (**ROADMAP / Gelecek Planları**) bu derslerle birlikte ürünü ileriye nasıl taşıyacağımızı yazıyoruz.
