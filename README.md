# ⚡ AppForge.ai

AI destekli web uygulama oluşturucu.

## Hızlı Deploy — Railway

1. Bu repoyu GitHub'a push edin
2. [railway.app](https://railway.app) → "New Project" → "Deploy from GitHub Repo"
3. `appforge` reposunu seçin
4. Variables sekmesine gidin, şu değişkenleri ekleyin:

```
AI_API_KEY=sk-your-deepseek-api-key
AI_API_URL=https://api.deepseek.com/chat/completions
AI_MODEL=deepseek-chat
```

5. Deploy otomatik başlar!

## Özellikler

- 🚀 Anında uygulama oluşturma
- 🧪 AI test ve otomatik düzeltme
- ✏️ Doğal dilde düzenleme
- 📦 12 hazır şablon
- 💰 Freemium kredi sistemi
- 💳 PayTR ödeme entegrasyonu
- 🔒 API key backend'de güvende

## Lokal Geliştirme

```bash
git clone https://github.com/KULLANICI_ADIN/appforge.git
cd appforge
npm install

# .env oluştur
echo "AI_API_KEY=sk-your-key" > .env
echo "AI_API_URL=https://api.deepseek.com/chat/completions" >> .env
echo "AI_MODEL=deepseek-chat" >> .env

# Build ve start
npm run build
npm start
```

## Mimari

```
Kullanıcı  →  React Frontend  →  /api/ai  →  server.js  →  AI API
                                                  ↑
                                            API key burada
                                           (frontend görmez)
```

## Lisans

MIT
