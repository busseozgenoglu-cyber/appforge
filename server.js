import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ─── ENV VARIABLES (Railway'de ayarlanacak) ───
const AI_API_URL = process.env.AI_API_URL || "https://api.deepseek.com/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";

app.use(express.json({ limit: "5mb" }));

// ─── AI PROXY ENDPOINT ───
// Frontend buraya istek atar, server API key'i ekleyip AI'a yönlendirir
// Böylece API key asla frontend'de görünmez
app.post("/api/ai", async (req, res) => {
  if (!AI_API_KEY) {
    return res.status(500).json({ error: "AI_API_KEY ortam değişkeni ayarlanmamış" });
  }

  try {
    const { system, messages, max_tokens = 8000 } = req.body;

    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens,
        temperature: 0.7,
        stream: false,
        messages: [
          { role: "system", content: system },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.error?.message || `AI API Hatası: ${response.status}`,
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const usage = data.usage || {};

    res.json({ text, usage });
  } catch (err) {
    console.error("AI Proxy Error:", err.message);
    res.status(500).json({ error: "Sunucu hatası: " + err.message });
  }
});

// ─── STATIC FILES (Vite build output) ───
app.use(express.static(join(__dirname, "dist")));

// SPA fallback — tüm route'ları index.html'e yönlendir
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`⚡ AppForge.ai server running on port ${PORT}`);
  console.log(`   AI API: ${AI_API_URL}`);
  console.log(`   AI Key: ${AI_API_KEY ? "✓ Configured" : "✕ MISSING — set AI_API_KEY env var"}`);
});
