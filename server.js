import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

const AI_API_URL = process.env.AI_API_URL || "https://api.deepseek.com/chat/completions";
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";

app.use(express.json({ limit: "5mb" }));

app.post("/api/ai", async (req, res) => {
  if (!AI_API_KEY) {
    return res.status(500).json({ error: "AI_API_KEY ortam degiskeni ayarlanmamis" });
  }
  try {
    const { system, messages, max_tokens = 8000 } = req.body;
    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + AI_API_KEY },
      body: JSON.stringify({ model: AI_MODEL, max_tokens, temperature: 0.7, stream: false, messages: [{ role: "system", content: system }, ...messages] }),
    });
    if (!response.ok) { const err = await response.json().catch(() => ({})); return res.status(response.status).json({ error: err.error?.message || "AI API Hatasi: " + response.status }); }
    const data = await response.json();
    res.json({ text: data.choices?.[0]?.message?.content || "", usage: data.usage || {} });
  } catch (err) { console.error("AI Error:", err.message); res.status(500).json({ error: err.message }); }
});

app.use(express.static(join(__dirname, "dist")));
app.get("*", (req, res) => { res.sendFile(join(__dirname, "dist", "index.html")); });

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("AppForge server running on port " + PORT);
  console.log("AI Key: " + (AI_API_KEY ? "Configured" : "MISSING"));
});
