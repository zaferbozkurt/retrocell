# Dökümantasyon

Bu klasör Retro Tracker'ın hackathon dökümantasyonunu içerir. Her dosya bir başlığa odaklanır; sıralı okumak için aşağıdaki düzeni izle.

## Okuma sırası

1. [`PROBLEM.md`](./PROBLEM.md) — **Ne sorunu çözüyoruz?** Hedef kullanıcı, "unutulan aksiyon" pain'i ve çözüm yaklaşımı.
2. [`PLAN.md`](./PLAN.md) — **Ne yapacağız, ne yapmayacağız?** MVP scope, in/out kararları, başarı kriterleri.
3. [`PHASES.md`](./PHASES.md) — **Ne zaman ne yapıldı?** 14:30–17:30 arası geliştirme fazları.
4. [`ARCHITECTURE.md`](./ARCHITECTURE.md) — **Nasıl çalışıyor?** Klasör yapısı, store, DnD, AI flow, veri modeli.
5. [`AI-STRATEGY.md`](./AI-STRATEGY.md) — **AI'yı nasıl orkestre ettik?** Hem geliştirme sürecinde hem üründe.
6. [`DEMO.md`](./DEMO.md) — **7 dakikalık sahne sunumu.** Golden path, X-Factor anları.
7. [`LESSONS-LEARNED.md`](./LESSONS-LEARNED.md) — **Ne yanlış gitti?** Firebase macerası, scope'ta boğulma, branch akışı, AI'a aşırı güvenme. Bir retro uygulaması yapan takımın kendi retrosu.
8. [`ROADMAP.md`](./ROADMAP.md) — **Bundan sonra ne var?** Firebase/DB, Jira entegrasyonu, daha proaktif AI, semantik recurring theme tespiti.
9. [`DEPLOY.md`](./DEPLOY.md) — **Nereden çalıştırılır?** Canlı URL ([retrocell.vercel.app](https://retrocell.vercel.app/)), lokal dev, lokal production build, üçü arasındaki farklar.

## Jüri kontrol listesi karşılığı

| Jüri kriteri | Karşılayan dosya |
|--------------|------------------|
| Proje ne, ne işe yarıyor | [`/README.md`](../README.md) + [`PROBLEM.md`](./PROBLEM.md) |
| Kurulum adımları, `.env.example` | [`/README.md`](../README.md) + [`/.env.example`](../.env.example) + [`DEPLOY.md`](./DEPLOY.md) |
| Kullanılan AI araçları, model bilgileri | [`/README.md`](../README.md) > "Kullanılan AI araçları" + [`AI-STRATEGY.md`](./AI-STRATEGY.md) |
| Entegre edilen API'ler | [`/README.md`](../README.md) > "Entegre edilen API'ler" |
| MCP listesi | [`/README.md`](../README.md) > "MCP listesi" (kullanılmadı) |
| Ekran görüntüleri | [`/README.md`](../README.md) > "Ekran görüntüleri" + `docs/screenshots/` |
| Deploy URL | [`/README.md`](../README.md) > "Deploy URL" + [`DEPLOY.md`](./DEPLOY.md) |
| Proje planı | [`PLAN.md`](./PLAN.md) |
| Geliştirme fazları | [`PHASES.md`](./PHASES.md) |
| Temel mimari | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| AI yapılandırma dosyaları | [`/CLAUDE.md`](../CLAUDE.md) + [`/AGENTS.md`](../AGENTS.md) |
| 7 dk sunum içeriği | [`DEMO.md`](./DEMO.md) |
