import { useState, useEffect, useRef, useCallback } from "react";

/*
 ╔══════════════════════════════════════════════════════════════╗
 ║  AppForge.ai — AI App Builder                               ║
 ║  Backend'de API key gömülü — müşteri hiçbir şey görmez      ║
 ║                                                              ║
 ║  PRODUCTION NOTU:                                            ║
 ║  Aşağıdaki BACKEND_CONFIG'i kendi backend API'nize           ║
 ║  yönlendirin. Şu an direkt DeepSeek API'ye gidiyor.         ║
 ║  Production'da: frontend → sizin backend → DeepSeek          ║
 ╚══════════════════════════════════════════════════════════════╝
*/

// ─── API KEY GÜVENLİ ───
// Frontend ASLA API key görmez.
// Tüm AI istekleri /api/ai endpoint'ine gider,
// server.js API key'i ekleyip AI'a yönlendirir.

// ─── PRICING ───
const FREE_DAILY = 3;
const COSTS = { build: 50, edit: 30, test: 40, fix: 35 };
const PACKAGES = [
  { id: "s", tokens: 500, price: 49.9, name: "Başlangıç", sub: "10 uygulama", icon: "⚡" },
  { id: "p", tokens: 1500, price: 119.9, name: "Profesyonel", sub: "30 uygulama", icon: "🔥", pop: true, save: 20 },
  { id: "b", tokens: 5000, price: 299.9, name: "İşletme", sub: "100 uygulama", icon: "🏢", save: 40 },
  { id: "u", tokens: 15000, price: 699.9, name: "Sınırsız", sub: "300+ uygulama", icon: "💎", save: 53 },
];

const TEMPLATES = [
  { id: 1, icon: "👥", name: "CRM Sistemi", cat: "İş", p: "Müşteri takip sistemi oluştur: müşteri listesi, detay sayfası, iletişim geçmişi, notlar, arama, filtreleme, istatistik kartları" },
  { id: 2, icon: "🛒", name: "E-Ticaret Paneli", cat: "Ticaret", p: "E-ticaret yönetim paneli oluştur: ürün kataloğu, sipariş takibi, stok yönetimi, gelir grafikleri, müşteri listesi" },
  { id: 3, icon: "✅", name: "Kanban Board", cat: "Verimlilik", p: "Kanban görev yönetim uygulaması oluştur: sürükle-bırak kartlar, 3 sütun, etiketler, öncelik, renk kodlama" },
  { id: 4, icon: "📊", name: "Analytics Dashboard", cat: "Veri", p: "Analitik dashboard oluştur: çizgi/bar grafikler, KPI kartları, filtreleme, tarih aralığı, gerçek zamanlı veri" },
  { id: 5, icon: "💬", name: "Chat Uygulaması", cat: "İletişim", p: "Sohbet uygulaması oluştur: mesaj balonları, kullanıcılar, emoji picker, online durumu, arama" },
  { id: 6, icon: "📝", name: "Blog CMS", cat: "İçerik", p: "Blog yönetim sistemi oluştur: zengin metin editörü, kategori, etiketler, taslak/yayınla, yorum sistemi" },
  { id: 7, icon: "📅", name: "Takvim", cat: "Planlama", p: "Takvim uygulaması oluştur: aylık/haftalık görünüm, etkinlik ekleme/düzenleme, renk kodlama, drag&drop" },
  { id: 8, icon: "📦", name: "Stok Takip", cat: "İş", p: "Envanter yönetim sistemi oluştur: ürün kartları, stok miktarı, barkod, minimum stok uyarısı, kategori filtre" },
  { id: 9, icon: "💰", name: "Finans Takip", cat: "Finans", p: "Kişisel finans uygulaması oluştur: gelir/gider girişi, pasta/bar grafikler, aylık özet, bütçe hedefi" },
  { id: 10, icon: "🚀", name: "Landing Page", cat: "Pazarlama", p: "Modern SaaS landing page oluştur: hero, features grid, pricing table, testimonials, CTA, footer" },
  { id: 11, icon: "🏢", name: "İK Paneli", cat: "İş", p: "İK yönetim sistemi oluştur: personel kartları, izin takvimi, maaş tablosu, performans grafikleri" },
  { id: 12, icon: "📋", name: "Form Builder", cat: "Araç", p: "Sürükle-bırak form oluşturucu: input/select/checkbox/textarea alanları, doğrulama, önizleme, JSON export" },
];

// ─── AI CALL (Backend proxy üzerinden — key güvende) ───
async function callAI(system, messages, maxTokens = 8000) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, max_tokens: maxTokens }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || `Hata: ${res.status}`);
  }
  const d = await res.json();
  return d.text || "";
}


const SYS_BUILD = `Sen profesyonel bir frontend geliştiricisin. Kullanıcının istediği uygulamayı TEK BİR HTML dosyası olarak oluştur.
KURALLAR:
- Sadece HTML, CSS ve vanilla JavaScript kullan, harici kütüphane KULLANMA
- Modern, profesyonel, görsel olarak etkileyici koyu tema tasarım (arka plan: #0a0a0f)
- Türkçe arayüz, tam çalışan interaktif uygulama, örnek veriler
- Responsive, animasyonlu, SADECE HTML kodu döndür
- Kod blokları KULLANMA, direkt <!DOCTYPE html> ile başla`;

const SYS_TEST = `Sen QA uzmanısın. HTML uygulamasını analiz et, SADECE JSON döndür:
{"score":0-100,"summary":"Türkçe özet","issues":[{"severity":"critical|warning|info","title":"..","description":"..","fix":".."}],"metrics":{"html":0-100,"css":0-100,"js":0-100,"responsive":0-100,"accessibility":0-100,"performance":0-100},"canAutoFix":true}`;

const SYS_FIX = `Sen frontend geliştiricisin. HTML uygulamasındaki sorunları düzelt. SADECE düzeltilmiş tam HTML kodunu döndür, açıklama yazma. Kod blokları kullanma.`;

// ─── STYLES ───
const G = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');
:root {
  --b1:#06060a; --b2:#0e0e14; --b3:#16161f; --b4:#1e1e2a;
  --br:#1f1f2e; --brh:#2a2a3d;
  --t1:#f0f0f5; --t2:#9d9db5; --t3:#5e5e7a;
  --ac:#7c5cfc; --ac2:#5ce0d6; --ac3:#fc5c8c;
  --acs:rgba(124,92,252,0.1); --acg:rgba(124,92,252,0.25);
  --g1:#22c55e; --g1s:rgba(34,197,94,0.1);
  --r1:#ef4444; --r1s:rgba(239,68,68,0.1);
  --w1:#f59e0b; --w1s:rgba(245,158,11,0.1);
  --c1:#06b6d4; --c1s:rgba(6,182,212,0.1);
}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--b1);color:var(--t1);font-family:'Sora',sans-serif;overflow-x:hidden}
::selection{background:var(--ac);color:#fff}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:var(--b1)}
::-webkit-scrollbar-thumb{background:var(--b3);border-radius:9px}
textarea:focus,input:focus{outline:none;border-color:var(--ac)!important;box-shadow:0 0 0 3px var(--acs)!important}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideR{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}25%{transform:translateY(-12px) rotate(1deg)}75%{transform:translateY(8px) rotate(-1deg)}}
@keyframes gradient{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
@keyframes morph{0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}50%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%}}
@keyframes orbit{from{transform:rotate(0deg) translateX(140px) rotate(0deg)}to{transform:rotate(360deg) translateX(140px) rotate(-360deg)}}
@keyframes pulseDot{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.5);opacity:1}}
@keyframes typewriter{from{width:0}to{width:100%}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.card-h:hover{transform:translateY(-6px) scale(1.02);border-color:var(--ac)!important;box-shadow:0 20px 60px rgba(124,92,252,0.12)!important}
.card-h{transition:all .4s cubic-bezier(.4,0,.2,1)}
.btn-g:hover{transform:translateY(-2px);box-shadow:0 12px 35px var(--acg)!important}
.hv:hover{background:var(--b3)!important}
.pkg:hover{transform:translateY(-8px);box-shadow:0 20px 50px rgba(0,0,0,.5)!important}
.pkg{transition:all .35s ease}
.pj:hover{background:var(--b3)!important}
.pj.on{background:var(--acs)!important;border-color:var(--ac)!important}
`;

const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [pg, setPg] = useState("home");
  const [prompt, setPrompt] = useState("");
  const [gen, setGen] = useState(false);
  const [code, setCode] = useState("");
  const [steps, setSteps] = useState([]);
  const [hist, setHist] = useState([]);
  const [editTxt, setEditTxt] = useState("");
  const [projs, setProjs] = useState([]);
  const [actProj, setActProj] = useState(null);
  const [side, setSide] = useState(true);
  const [codeV, setCodeV] = useState(false);
  const [tok, setTok] = useState(0);
  const [daily, setDaily] = useState({ d: today(), u: 0 });
  const [showPrice, setShowPrice] = useState(false);
  const [showPay, setShowPay] = useState(null);
  const [tLog, setTLog] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testRes, setTestRes] = useState(null);
  const [tSteps, setTSteps] = useState([]);
  const [toast, setToast] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const iframe = useRef(null);
  const tokRef = useRef(tok);
  tokRef.current = tok;

  // Mouse tracker for parallax
  useEffect(() => {
    const h = (e) => setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const notify = useCallback((m, t = "info") => { setToast({ m, t }); setTimeout(() => setToast(null), 3500); }, []);

  const freeLeft = useCallback(() => {
    if (daily.d !== today()) return FREE_DAILY;
    return Math.max(0, FREE_DAILY - daily.u);
  }, [daily]);

  const log = useCallback((a, c, n) => setTLog(p => [{ id: Date.now(), a, c, n, t: new Date().toLocaleString("tr-TR") }, ...p].slice(0, 80)), []);

  const spend = useCallback((amt, act) => {
    const t = today();
    let d = daily.d === t ? { ...daily } : { d: t, u: 0 };
    if (d.u < FREE_DAILY && (act === "build" || act === "edit")) {
      d = { ...d, u: d.u + 1 };
      setDaily(d);
      log(act, 0, `Ücretsiz (${d.u}/${FREE_DAILY})`);
      return true;
    }
    if (tokRef.current < amt) { notify("Yetersiz kredi! Lütfen kredi yükleyin.", "error"); setShowPrice(true); return false; }
    setTok(p => p - amt);
    log(act, amt, `${amt} kredi kullanıldı`);
    return true;
  }, [daily, log, notify]);

  // ── Build ──
  const build = useCallback(async (pr, edit = false) => {
    if (!spend(edit ? COSTS.edit : COSTS.build, edit ? "edit" : "build")) return;
    setGen(true); setTestRes(null);
    const labels = edit
      ? ["Değişiklikler analiz ediliyor...", "Kod güncelleniyor...", "Test ediliyor...", "Tamamlanıyor..."]
      : ["İstek yorumlanıyor...", "Mimari oluşturuluyor...", "Bileşenler kodlanıyor...", "Stiller uygulanıyor...", "Optimize ediliyor..."];
    setSteps(labels.map(l => ({ l, d: false })));
    const msgs = edit
      ? [...hist, { role: "user", content: `Güncelle: ${pr}\n\nMevcut:\n${code}\n\nTam HTML döndür.` }]
      : [{ role: "user", content: pr }];
    try {
      for (let i = 0; i < labels.length; i++) {
        await new Promise(r => setTimeout(r, 450 + Math.random() * 400));
        setSteps(p => p.map((s, j) => j <= i ? { ...s, d: true } : s));
      }
      let c = await callAI(SYS_BUILD, msgs);
      c = c.replace(/^```html?\n?/i, "").replace(/\n?```$/g, "").trim();
      if (!c.startsWith("<!DOCTYPE") && !c.startsWith("<html")) { const i = c.indexOf("<!DOCTYPE"); if (i > -1) c = c.substring(i); }
      setCode(c); setHist([...msgs, { role: "assistant", content: c }]);
      const pj = { id: Date.now(), name: pr.substring(0, 38) + (pr.length > 38 ? "…" : ""), p: pr, code: c, date: new Date().toLocaleString("tr-TR") };
      if (!edit) { setProjs(p => [pj, ...p]); setActProj(pj.id); } else { setProjs(p => p.map(x => x.id === actProj ? { ...x, code: c, date: pj.date } : x)); }
      setPg("preview"); notify(edit ? "Güncellendi!" : "Uygulama hazır!", "ok");
    } catch (e) { notify(e.message, "error"); } finally { setGen(false); }
  }, [hist, code, actProj, spend, notify]);

  // ── Test ──
  const runTest = useCallback(async () => {
    if (!code || !spend(COSTS.test, "test")) return;
    setTesting(true); setTestRes(null);
    const tl = ["Kod analizi...", "HTML doğrulama...", "JS hata taraması...", "Responsive test...", "Erişilebilirlik...", "Performans...", "Rapor..."];
    setTSteps(tl.map(l => ({ l, d: false })));
    try {
      for (let i = 0; i < tl.length; i++) { await new Promise(r => setTimeout(r, 300 + Math.random() * 250)); setTSteps(p => p.map((s, j) => j <= i ? { ...s, d: true } : s)); }
      let raw = await callAI(SYS_TEST, [{ role: "user", content: `Test et:\n\n${code}` }], 2000);
      raw = raw.replace(/^```json?\n?/i, "").replace(/\n?```$/g, "").trim();
      try { const r = JSON.parse(raw); setTestRes(r); notify(`Skor: ${r.score}/100`, r.score >= 70 ? "ok" : "warn"); }
      catch { setTestRes({ score: 0, summary: "Sonuçlar okunamadı", issues: [], metrics: {} }); }
    } catch (e) { notify("Test hatası: " + e.message, "error"); } finally { setTesting(false); }
  }, [code, spend, notify]);

  // ── Fix ──
  const autoFix = useCallback(async () => {
    if (!testRes || !spend(COSTS.fix, "fix")) return;
    const il = testRes.issues.map(i => `[${i.severity}] ${i.title}: ${i.description}`).join("\n");
    setGen(true); setSteps(["Sorunlar onarılıyor...", "Kod güncelleniyor...", "Doğrulama..."].map(l => ({ l, d: false })));
    try {
      for (let i = 0; i < 3; i++) { await new Promise(r => setTimeout(r, 500)); setSteps(p => p.map((s, j) => j <= i ? { ...s, d: true } : s)); }
      let c = await callAI(SYS_FIX, [{ role: "user", content: `Düzelt:\n${il}\n\nKod:\n${code}` }]);
      c = c.replace(/^```html?\n?/i, "").replace(/\n?```$/g, "").trim();
      if (!c.startsWith("<!DOCTYPE")) { const i = c.indexOf("<!DOCTYPE"); if (i > -1) c = c.substring(i); }
      setCode(c); setTestRes(null);
      setProjs(p => p.map(x => x.id === actProj ? { ...x, code: c, date: new Date().toLocaleString("tr-TR") } : x));
      notify("Sorunlar giderildi!", "ok");
    } catch (e) { notify(e.message, "error"); } finally { setGen(false); }
  }, [testRes, code, actProj, spend, notify]);

  const buyPkg = (pkg) => { setTok(p => p + pkg.tokens); log("buy", -pkg.tokens, `${pkg.name}: +${pkg.tokens} (${pkg.price}₺)`); notify(`${pkg.tokens} kredi yüklendi!`, "ok"); setShowPay(null); setShowPrice(false); };

  useEffect(() => { if (code && iframe.current && !codeV) { const d = iframe.current.contentDocument; d.open(); d.write(code); d.close(); } }, [code, codeV]);

  const dl = () => { const b = new Blob([code], { type: "text/html" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "uygulama.html"; a.click(); URL.revokeObjectURL(u); };

  // ── Shared Components ──
  const Toast = () => toast && (
    <div style={{ position:"fixed", top:20, right:20, zIndex:9999, padding:"12px 22px", borderRadius:14, background: toast.t === "ok" ? "var(--g1)" : toast.t === "error" ? "var(--r1)" : toast.t === "warn" ? "var(--w1)" : "var(--ac)", color:"#fff", fontWeight:600, fontSize:14, boxShadow:"0 10px 40px rgba(0,0,0,.4)", animation:"slideR .3s ease", display:"flex", alignItems:"center", gap:8, backdropFilter:"blur(10px)" }}>
      {toast.t === "ok" ? "✓" : toast.t === "error" ? "✕" : "⚡"} {toast.m}
    </div>
  );

  const CreditBar = ({ compact } = {}) => (
    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
      <div onClick={() => setShowLog(true)} style={{ display:"flex", alignItems:"center", gap:5, padding: compact ? "4px 10px" : "6px 14px", borderRadius:10, background:"var(--b2)", border:"1px solid var(--br)", cursor:"pointer", fontSize:13, fontWeight:600 }} className="hv">
        <span style={{ background:"linear-gradient(135deg,var(--ac),var(--ac2))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>◆</span>
        <span style={{ color:"var(--w1)" }}>{tok.toLocaleString()}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:4, padding: compact ? "4px 10px" : "6px 12px", borderRadius:10, background:"var(--g1s)", border:"1px solid rgba(34,197,94,.15)", fontSize:13, fontWeight:600 }}>
        <span style={{ color:"var(--g1)" }}>{freeLeft()}</span>
        <span style={{ color:"var(--t3)", fontSize:11 }}>ücretsiz</span>
      </div>
      <button onClick={() => setShowPrice(true)} className="hv" style={{ padding: compact ? "4px 12px" : "6px 14px", borderRadius:10, border:"1px solid var(--ac)", background:"var(--acs)", color:"var(--ac)", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Sora'" }}>+ Kredi</button>
    </div>
  );

  // Orbs background
  const Orbs = () => (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(124,92,252,.08), transparent 70%)", top: `${-15 + mousePos.y * 8}%`, right: `${-8 + mousePos.x * 5}%`, transition:"top .8s ease, right .8s ease", animation:"morph 15s ease-in-out infinite" }} />
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(92,224,214,.06), transparent 70%)", bottom: `${-10 + mousePos.y * 6}%`, left: `${-5 + mousePos.x * 4}%`, transition:"bottom .8s ease, left .8s ease", animation:"morph 12s ease-in-out infinite reverse" }} />
      <div style={{ position:"absolute", width:250, height:250, borderRadius:"50%", background:"radial-gradient(circle, rgba(252,92,140,.04), transparent 70%)", top:"40%", left:"50%", animation:"morph 18s ease-in-out infinite" }} />
      {/* Grid lines */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(124,92,252,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(124,92,252,.03) 1px, transparent 1px)", backgroundSize:"80px 80px" }} />
    </div>
  );

  // ── Pricing Modal ──
  const PriceModal = () => showPrice && (
    <div style={{ position:"fixed", inset:0, zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.75)", backdropFilter:"blur(12px)" }} onClick={() => setShowPrice(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background:"var(--b2)", border:"1px solid var(--br)", borderRadius:24, maxWidth:780, width:"92%", maxHeight:"88vh", overflow:"auto", padding:32, animation:"fadeUp .3s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
          <div>
            <h2 style={{ fontSize:24, fontWeight:800, background:"linear-gradient(135deg,var(--ac),var(--ac2))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Kredi Yükle</h2>
            <p style={{ color:"var(--t3)", fontSize:13, marginTop:4 }}>Bakiye: <span style={{ color:"var(--w1)", fontWeight:700 }}>{tok.toLocaleString()} kredi</span></p>
          </div>
          <button onClick={() => setShowPrice(false)} style={{ background:"var(--b3)", border:"none", color:"var(--t2)", width:36, height:36, borderRadius:10, cursor:"pointer", fontSize:16 }}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:24, padding:16, background:"var(--b1)", borderRadius:14, border:"1px solid var(--br)" }}>
          {[{ i:"⚡", l:"Oluşturma", c:COSTS.build }, { i:"✏️", l:"Düzenleme", c:COSTS.edit }, { i:"🧪", l:"AI Test", c:COSTS.test }, { i:"🔧", l:"Oto-düzelt", c:COSTS.fix }].map(x => (
            <div key={x.l} style={{ textAlign:"center" }}>
              <div style={{ fontSize:20 }}>{x.i}</div>
              <div style={{ fontSize:11, color:"var(--t3)", marginTop:2 }}>{x.l}</div>
              <div style={{ fontSize:16, fontWeight:800, color:"var(--ac)", marginTop:2 }}>{x.c}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14 }}>
          {PACKAGES.map(pk => (
            <div key={pk.id} className="pkg" onClick={() => setShowPay(pk)} style={{ background: pk.pop ? "linear-gradient(135deg,rgba(124,92,252,.12),rgba(92,224,214,.08))" : "var(--b1)", border:`2px solid ${pk.pop ? "var(--ac)" : "var(--br)"}`, borderRadius:18, padding:22, cursor:"pointer", position:"relative", textAlign:"center" }}>
              {pk.pop && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,var(--ac),var(--ac2))", color:"#fff", fontSize:10, fontWeight:700, padding:"3px 14px", borderRadius:20, letterSpacing:.5 }}>EN POPÜLER</div>}
              {pk.save && <div style={{ position:"absolute", top:10, right:10, background:"var(--g1s)", color:"var(--g1)", fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:8 }}>%{pk.save}</div>}
              <div style={{ fontSize:28, marginBottom:8 }}>{pk.icon}</div>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--t2)" }}>{pk.name}</div>
              <div style={{ fontSize:30, fontWeight:800, margin:"8px 0 2px" }}>{pk.tokens.toLocaleString()}</div>
              <div style={{ fontSize:11, color:"var(--t3)", marginBottom:12 }}>{pk.sub}</div>
              <div style={{ fontSize:22, fontWeight:700, color:"var(--ac)" }}>{pk.price}₺</div>
              <div style={{ marginTop:14, padding:"9px 0", borderRadius:12, fontSize:13, fontWeight:700, background: pk.pop ? "linear-gradient(135deg,var(--ac),var(--ac2))" : "var(--b3)", color: pk.pop ? "#fff" : "var(--t2)" }}>Satın Al</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign:"center", color:"var(--t3)", fontSize:11, marginTop:18 }}>🔒 Güvenli ödeme altyapısı ile korunmaktadır</p>
      </div>
    </div>
  );

  // ── Payment Modal ──
  const PayModal = () => showPay && (
    <div style={{ position:"fixed", inset:0, zIndex:9500, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.85)", backdropFilter:"blur(14px)" }}>
      <div style={{ background:"var(--b2)", border:"1px solid var(--br)", borderRadius:22, width:400, padding:30, animation:"fadeUp .3s ease" }}>
        <div style={{ textAlign:"center", marginBottom:22 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>{showPay.icon}</div>
          <h3 style={{ fontSize:20, fontWeight:700 }}>{showPay.name}</h3>
          <p style={{ color:"var(--t3)", fontSize:13 }}>{showPay.tokens.toLocaleString()} kredi</p>
        </div>
        <div style={{ background:"var(--b1)", border:"1px solid var(--br)", borderRadius:14, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:"var(--t3)", marginBottom:12, textTransform:"uppercase", letterSpacing:1.5 }}>💳 Kart Bilgileri</div>
          {["Kart Numarası","Ad Soyad"].map(l => (<div key={l} style={{ marginBottom:10 }}><label style={{ fontSize:11, color:"var(--t3)", marginBottom:3, display:"block" }}>{l}</label><input placeholder={l === "Kart Numarası" ? "0000 0000 0000 0000" : "AD SOYAD"} style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1px solid var(--br)", background:"var(--b2)", color:"var(--t1)", fontSize:14, fontFamily:"'Sora'" }} /></div>))}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div><label style={{ fontSize:11, color:"var(--t3)", marginBottom:3, display:"block" }}>SKT</label><input placeholder="AA/YY" maxLength={5} style={{ width:"100%", padding:"10px", borderRadius:10, border:"1px solid var(--br)", background:"var(--b2)", color:"var(--t1)", fontSize:14, fontFamily:"'Sora'" }} /></div>
            <div><label style={{ fontSize:11, color:"var(--t3)", marginBottom:3, display:"block" }}>CVV</label><input placeholder="•••" maxLength={4} type="password" style={{ width:"100%", padding:"10px", borderRadius:10, border:"1px solid var(--br)", background:"var(--b2)", color:"var(--t1)", fontSize:14, fontFamily:"'Sora'" }} /></div>
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 16px", background:"var(--b1)", borderRadius:12, marginBottom:14, border:"1px solid var(--br)" }}>
          <span style={{ color:"var(--t2)" }}>Toplam</span>
          <span style={{ fontSize:24, fontWeight:800, background:"linear-gradient(135deg,var(--ac),var(--ac2))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{showPay.price}₺</span>
        </div>
        <button onClick={() => buyPkg(showPay)} className="btn-g" style={{ width:"100%", padding:14, borderRadius:14, border:"none", background:"linear-gradient(135deg,var(--ac),var(--ac2))", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"'Sora'" }}>🔒 Ödeme Yap</button>
        <button onClick={() => setShowPay(null)} className="hv" style={{ width:"100%", marginTop:8, padding:10, borderRadius:12, border:"1px solid var(--br)", background:"transparent", color:"var(--t3)", cursor:"pointer", fontFamily:"'Sora'", fontSize:12 }}>İptal</button>
      </div>
    </div>
  );

  // ── Log Modal ──
  const LogModal = () => showLog && (
    <div style={{ position:"fixed", inset:0, zIndex:8000, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,.65)", backdropFilter:"blur(8px)" }} onClick={() => setShowLog(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background:"var(--b2)", border:"1px solid var(--br)", borderRadius:18, width:420, maxHeight:"70vh", overflow:"auto", padding:24, animation:"fadeUp .3s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ fontSize:17, fontWeight:700 }}>İşlem Geçmişi</h3>
          <button onClick={() => setShowLog(false)} style={{ background:"none", border:"none", color:"var(--t3)", fontSize:18, cursor:"pointer" }}>✕</button>
        </div>
        {tLog.length === 0 ? <p style={{ color:"var(--t3)", textAlign:"center", padding:24, fontSize:13 }}>Henüz işlem yok</p> : tLog.map(l => (
          <div key={l.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid var(--br)" }}>
            <div><div style={{ fontSize:12, fontWeight:500 }}>{l.a === "build" ? "⚡ Oluşturma" : l.a === "edit" ? "✏️ Düzenleme" : l.a === "test" ? "🧪 Test" : l.a === "fix" ? "🔧 Düzeltme" : "💳 Yükleme"}</div><div style={{ fontSize:10, color:"var(--t3)" }}>{l.t}</div></div>
            <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:700, color: l.c > 0 ? "var(--r1)" : l.c === 0 ? "var(--g1)" : "var(--g1)" }}>{l.c > 0 ? `-${l.c}` : l.c === 0 ? "Ücretsiz" : `+${Math.abs(l.c)}`}</div><div style={{ fontSize:10, color:"var(--t3)" }}>{l.n}</div></div>
          </div>
        ))}
      </div>
    </div>
  );

  const sc = { critical:"var(--r1)", warning:"var(--w1)", info:"var(--c1)" };
  const sb = { critical:"var(--r1s)", warning:"var(--w1s)", info:"var(--c1s)" };

  // ── Test Panel ──
  const TestPanel = () => {
    if (!testRes && !testing) return null;
    return (
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:340, background:"var(--b2)", borderLeft:"1px solid var(--br)", zIndex:10, overflow:"auto", animation:"slideR .3s ease", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"13px 16px", borderBottom:"1px solid var(--br)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontWeight:700, fontSize:14 }}>🧪 Test Sonuçları</span>
          <button onClick={() => { setTestRes(null); setTesting(false); }} style={{ background:"none", border:"none", color:"var(--t3)", cursor:"pointer", fontSize:15 }}>✕</button>
        </div>
        {testing && <div style={{ padding:18 }}>{tSteps.map((s, i) => (<div key={i} style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8, animation:`fadeIn .3s ease ${i * .08}s both` }}><div style={{ width:20, height:20, borderRadius:6, background: s.d ? "var(--g1s)" : "var(--b3)", border:`1px solid ${s.d ? "var(--g1)" : "var(--br)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color: s.d ? "var(--g1)" : "var(--t3)" }}>{s.d ? "✓" : "·"}</div><span style={{ fontSize:12, color: s.d ? "var(--t1)" : "var(--t3)" }}>{s.l}</span></div>))}</div>}
        {testRes && (
          <div style={{ padding:16, flex:1, overflow:"auto" }}>
            <div style={{ textAlign:"center", marginBottom:18 }}>
              <div style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto 10px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:800, background: testRes.score >= 80 ? "var(--g1s)" : testRes.score >= 50 ? "var(--w1s)" : "var(--r1s)", border:`3px solid ${testRes.score >= 80 ? "var(--g1)" : testRes.score >= 50 ? "var(--w1)" : "var(--r1)"}`, color: testRes.score >= 80 ? "var(--g1)" : testRes.score >= 50 ? "var(--w1)" : "var(--r1)" }}>{testRes.score}</div>
              <p style={{ fontSize:12, color:"var(--t2)", lineHeight:1.4 }}>{testRes.summary}</p>
            </div>
            {testRes.metrics && Object.keys(testRes.metrics).length > 0 && <div style={{ marginBottom:14 }}>{Object.entries(testRes.metrics).map(([k, v]) => (<div key={k} style={{ marginBottom:7 }}><div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:2 }}><span style={{ color:"var(--t2)", textTransform:"uppercase" }}>{k}</span><span style={{ fontWeight:700, color: v >= 80 ? "var(--g1)" : v >= 50 ? "var(--w1)" : "var(--r1)" }}>{v}</span></div><div style={{ height:3, borderRadius:2, background:"var(--b3)" }}><div style={{ width:`${v}%`, height:"100%", borderRadius:2, background: v >= 80 ? "var(--g1)" : v >= 50 ? "var(--w1)" : "var(--r1)", transition:"width .8s ease" }} /></div></div>))}</div>}
            {testRes.issues?.length > 0 && <div style={{ marginBottom:14 }}>{testRes.issues.map((is, i) => (<div key={i} style={{ background:"var(--b1)", border:"1px solid var(--br)", borderRadius:10, padding:10, marginBottom:6 }}><div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}><span style={{ padding:"1px 7px", borderRadius:6, fontSize:9, fontWeight:700, background: sb[is.severity], color: sc[is.severity], textTransform:"uppercase" }}>{is.severity}</span><span style={{ fontSize:12, fontWeight:600 }}>{is.title}</span></div><p style={{ fontSize:11, color:"var(--t3)", lineHeight:1.4 }}>{is.description}</p>{is.fix && <p style={{ fontSize:10, color:"var(--c1)", marginTop:3 }}>💡 {is.fix}</p>}</div>))}</div>}
            {testRes.issues?.length > 0 && <button onClick={autoFix} disabled={gen} style={{ width:"100%", padding:11, borderRadius:10, border:"none", background:"linear-gradient(135deg,var(--g1),#16a34a)", color:"#fff", fontSize:13, fontWeight:700, cursor: gen ? "wait" : "pointer", fontFamily:"'Sora'", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>🔧 Otomatik Düzelt <span style={{ fontSize:10, opacity:.8 }}>({COSTS.fix} kredi)</span></button>}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════
  // HOME
  // ════════════════════════════════════════
  if (pg === "home" && !gen) return (
    <div style={{ minHeight:"100vh", background:"var(--b1)" }}>
      <style>{G}</style>
      <Toast /> <PriceModal /> <PayModal /> <LogModal /> <Orbs />

      {/* Nav */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"10px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(6,6,10,.8)", backdropFilter:"blur(24px)", borderBottom:"1px solid var(--br)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:11, background:"linear-gradient(135deg,var(--ac),var(--ac2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, animation:"glow 3s ease infinite" }}>⚡</div>
          <span style={{ fontSize:20, fontWeight:700, letterSpacing:"-.5px" }}>AppForge<span style={{ background:"linear-gradient(135deg,var(--ac),var(--ac2))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>.ai</span></span>
        </div>
        <CreditBar />
      </nav>

      {/* Hero */}
      <div style={{ maxWidth:860, margin:"0 auto", padding:"120px 24px 40px", textAlign:"center", position:"relative", zIndex:1 }}>
        {/* Orbiting dots */}
        <div style={{ position:"absolute", top:"50%", left:"50%", width:0, height:0 }}>
          {[0,1,2,3,4].map(i => <div key={i} style={{ position:"absolute", width:6, height:6, borderRadius:"50%", background:`hsl(${260 + i * 30}, 80%, 65%)`, animation:`orbit ${10 + i * 3}s linear infinite`, animationDelay:`${i * -2}s`, opacity:.3 }} />)}
        </div>

        <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 18px", borderRadius:100, background:"var(--acs)", border:"1px solid rgba(124,92,252,.2)", marginBottom:28, fontSize:13, fontWeight:500, color:"var(--ac)", animation:"fadeUp .6s ease" }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--g1)", animation:"pulseDot 2s infinite" }} />
          Yapay zeka ile anında uygulama oluştur
        </div>

        <h1 style={{ fontSize:"clamp(36px,6vw,68px)", fontWeight:800, lineHeight:1.05, letterSpacing:"-3px", marginBottom:20, animation:"fadeUp .6s ease .1s both" }}>
          Hayal et,<br />
          <span style={{ background:"linear-gradient(135deg,var(--ac),var(--ac2),var(--ac3),var(--ac))", backgroundSize:"300% 300%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"gradient 6s ease infinite" }}>
            biz kodlayalım.
          </span>
        </h1>

        <p style={{ fontSize:17, color:"var(--t2)", maxWidth:520, margin:"0 auto 40px", lineHeight:1.65, animation:"fadeUp .6s ease .2s both" }}>
          Saniyeler içinde tam çalışan web uygulamaları. Kodlama bilgisine gerek yok — sadece ne istediğini anlat.
        </p>

        {/* Input */}
        <div style={{ background:"var(--b2)", border:"1px solid var(--br)", borderRadius:22, padding:5, maxWidth:660, margin:"0 auto", animation:"fadeUp .6s ease .3s both", position:"relative", overflow:"hidden" }}>
          {/* Shimmer border effect */}
          <div style={{ position:"absolute", inset:-1, borderRadius:23, background:"linear-gradient(90deg, transparent, rgba(124,92,252,.15), transparent)", backgroundSize:"200% 100%", animation:"shimmer 3s infinite", pointerEvents:"none" }} />
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (prompt.trim()) build(prompt); } }} placeholder="Bir müşteri takip sistemi oluştur..." rows={3} style={{ width:"100%", background:"transparent", border:"none", color:"var(--t1)", fontSize:16, fontFamily:"'Sora'", padding:"16px 20px", resize:"none", outline:"none", lineHeight:1.6, position:"relative", zIndex:1 }} />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 14px", position:"relative", zIndex:1 }}>
            <span style={{ fontSize:12, color:"var(--t3)" }}>
              {freeLeft() > 0 ? `✨ Ücretsiz · ${freeLeft()} hak kaldı` : `◆ ${COSTS.build} kredi`}
            </span>
            <button className="btn-g" onClick={() => prompt.trim() && build(prompt)} disabled={!prompt.trim()} style={{ padding:"11px 28px", borderRadius:14, border:"none", background: !prompt.trim() ? "var(--b3)" : "linear-gradient(135deg,var(--ac),var(--ac2))", color: !prompt.trim() ? "var(--t3)" : "#fff", fontSize:15, fontWeight:700, fontFamily:"'Sora'", cursor: prompt.trim() ? "pointer" : "default", display:"flex", alignItems:"center", gap:8 }}>
              Oluştur <span style={{ fontSize:18 }}>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Templates */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"20px 24px 80px", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:26 }}>
          <div style={{ height:1, flex:1, background:"linear-gradient(90deg,transparent,var(--br),transparent)" }} />
          <span style={{ fontSize:11, fontWeight:600, color:"var(--t3)", textTransform:"uppercase", letterSpacing:3 }}>veya şablonla başla</span>
          <div style={{ height:1, flex:1, background:"linear-gradient(90deg,transparent,var(--br),transparent)" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))", gap:12 }}>
          {TEMPLATES.map((t, i) => (
            <div key={t.id} className="card-h" onClick={() => { setPrompt(t.p); build(t.p); }} style={{ background:"var(--b2)", border:"1px solid var(--br)", borderRadius:16, padding:20, cursor:"pointer", animation:`fadeUp .5s ease ${i * .04}s both`, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, right:0, padding:"4px 10px", borderRadius:"0 16px 0 10px", background:"var(--b3)", fontSize:9, fontWeight:600, color:"var(--t3)", textTransform:"uppercase", letterSpacing:1 }}>{t.cat}</div>
              <div style={{ fontSize:28, marginBottom:10 }}>{t.icon}</div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{t.name}</div>
              <div style={{ fontSize:12, color:"var(--t3)", lineHeight:1.5 }}>{t.p.substring(0, 60)}…</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════
  // GENERATING — Chat UI
  // ════════════════════════════════════════
  const AI_MSGS = [
    { icon:"🧠", title:"İstek analiz ediliyor", detail:"Doğal dil işleme ile tam olarak ne istediğinizi anlıyorum." },
    { icon:"🏗️", title:"Mimari tasarlanıyor", detail:"Bileşen yapısı, state yönetimi ve veri akışı planlanıyor." },
    { icon:"⚡", title:"Bileşenler kodlanıyor", detail:"UI elementleri, formlar ve interaktif öğeler yazılıyor." },
    { icon:"🎨", title:"Tasarım uygulanıyor", detail:"CSS animasyonları, renkler ve responsive layout ekleniyor." },
    { icon:"🔧", title:"Son optimizasyonlar", detail:"Performans, erişilebilirlik ve tarayıcı uyumluluğu kontrol ediliyor." },
  ];

  if (gen) return (
    <div style={{ minHeight:"100vh", background:"var(--b1)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <style>{G + `
        @keyframes msgIn { from{opacity:0;transform:translateY(16px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes scanLine { from{top:0} to{top:100%} }
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-8px)} }
        .cmsg { animation: msgIn .5s cubic-bezier(.34,1.4,.64,1) both; }
      `}</style>
      <Toast /><Orbs />

      {/* Top bar */}
      <div style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"11px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(6,6,10,.9)", backdropFilter:"blur(24px)", borderBottom:"1px solid var(--br)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,var(--ac),var(--ac2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, animation:"glow 3s ease infinite" }}>⚡</div>
          <span style={{ fontSize:16, fontWeight:700 }}>AppForge<span style={{ background:"linear-gradient(135deg,var(--ac),var(--ac2))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>.ai</span></span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 14px", borderRadius:20, background:"var(--g1s)", border:"1px solid rgba(34,197,94,.2)" }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"var(--g1)", animation:"pulseDot 1.4s infinite" }} />
          <span style={{ fontSize:12, color:"var(--g1)", fontWeight:600 }}>AI Kodluyor</span>
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex:1, maxWidth:680, width:"100%", margin:"0 auto", padding:"88px 20px 110px", display:"flex", flexDirection:"column", gap:14, position:"relative", zIndex:1, overflowY:"auto" }}>

        {/* User bubble */}
        <div className="cmsg" style={{ display:"flex", justifyContent:"flex-end", gap:10, alignItems:"flex-end" }}>
          <div style={{ maxWidth:"72%", background:"linear-gradient(135deg,var(--ac),rgba(92,224,214,.8))", borderRadius:"18px 18px 4px 18px", padding:"12px 18px", fontSize:14, lineHeight:1.65, color:"#fff", boxShadow:"0 6px 28px rgba(124,92,252,.25)" }}>
            {prompt || "Uygulama oluştur"}
          </div>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"var(--b3)", border:"1px solid var(--br)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0 }}>👤</div>
        </div>

        {/* AI adım mesajları */}
        {steps.map((s, i) => (
          <div key={i} className="cmsg" style={{ display:"flex", gap:12, alignItems:"flex-start", animationDelay:`${i*.12}s` }}>
            <div style={{ width:42, height:42, borderRadius:"50%", background: s.d ? "linear-gradient(135deg,var(--g1),#16a34a)" : "linear-gradient(135deg,var(--ac),var(--ac2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:19, flexShrink:0, boxShadow:`0 4px 18px ${s.d ? "rgba(34,197,94,.22)" : "rgba(124,92,252,.22)"}`, transition:"all .6s", position:"relative" }}>
              {AI_MSGS[i]?.icon || "⚡"}
              {!s.d && <div style={{ position:"absolute", inset:-4, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"var(--ac)", animation:"spin 1s linear infinite" }} />}
            </div>
            <div style={{ flex:1, background: s.d ? "rgba(34,197,94,.05)" : "var(--b2)", border:`1px solid ${s.d ? "rgba(34,197,94,.15)" : "var(--br)"}`, borderRadius:"4px 18px 18px 18px", padding:"13px 17px", transition:"all .5s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <span style={{ fontSize:10, fontWeight:700, color: s.d ? "var(--g1)" : "var(--ac)", textTransform:"uppercase", letterSpacing:.6 }}>{s.d ? "✓ Tamamlandı" : "⟳ İşleniyor"}</span>
                {!s.d && <div style={{ display:"flex", gap:3 }}>{[0,1,2].map(j => <span key={j} style={{ width:5, height:5, borderRadius:"50%", background:"var(--ac)", display:"inline-block", animation:"bounce .9s ease infinite", animationDelay:`${j*.18}s`, opacity:.7 }} />)}</div>}
              </div>
              <div style={{ fontSize:14, fontWeight:600, color:"var(--t1)", marginBottom: s.d ? 5 : 0 }}>{AI_MSGS[i]?.title || s.l}</div>
              {s.d && <div style={{ fontSize:12, color:"var(--t3)", lineHeight:1.6, marginBottom:8 }}>{AI_MSGS[i]?.detail}</div>}
              {s.d && <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {["HTML","CSS","JavaScript","Responsive","Dark Theme"].slice(0, Math.min(i+2,5)).map(t => (
                  <span key={t} style={{ padding:"2px 9px", borderRadius:6, background:"var(--acs)", color:"var(--ac)", fontSize:10, fontWeight:600 }}>{t}</span>
                ))}
              </div>}
            </div>
          </div>
        ))}

        {/* Canlı terminal - 2. adımdan sonra */}
        {steps.filter(s => s.d).length >= 2 && (
          <div className="cmsg" style={{ display:"flex", gap:12, animationDelay:".25s" }}>
            <div style={{ width:42, height:42, borderRadius:"50%", background:"#0d1117", border:"1px solid #30363d", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>💻</div>
            <div style={{ flex:1, background:"#0d1117", border:"1px solid #30363d", borderRadius:"4px 18px 18px 18px", padding:"14px 18px", fontFamily:"'Fira Code',monospace", fontSize:11.5, lineHeight:1.9, position:"relative", overflow:"hidden" }}>
              <div style={{ color:"#8b949e", fontSize:10, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>▸ appforge / code-generator</div>
              <div><span style={{ color:"#ff7b72" }}>const</span> <span style={{ color:"#79c0ff" }}>app</span> <span style={{ color:"#ff7b72" }}>=</span> <span style={{ color:"#d2a8ff" }}>await</span> <span style={{ color:"#ffa657" }}>forge</span>(<span style={{ color:"#a5d6ff" }}>"{(prompt||"").substring(0,26)}{(prompt||"").length>26?"...":""}"</span>);</div>
              <div><span style={{ color:"#d2a8ff" }}>await</span> app.<span style={{ color:"#7ee787" }}>generateUI</span>();</div>
              <div><span style={{ color:"#d2a8ff" }}>await</span> app.<span style={{ color:"#7ee787" }}>applyStyles</span>(<span style={{ color:"#a5d6ff" }}>"dark-pro"</span>);</div>
              {steps.filter(s=>s.d).length >= 4 && <div><span style={{ color:"#d2a8ff" }}>await</span> app.<span style={{ color:"#7ee787" }}>optimize</span>();</div>}
              <div style={{ color:"#7ee787", marginTop:6 }}><span style={{ color:"#e6edf3" }}>// Oluşturuluyor</span><span style={{ animation:"blink 1s infinite" }}>▌</span></div>
              <div style={{ position:"absolute", left:0, right:0, height:"1px", background:"linear-gradient(90deg,transparent,rgba(126,231,135,.1),transparent)", animation:"scanLine 3s linear infinite", pointerEvents:"none" }} />
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"13px 28px", background:"rgba(6,6,10,.95)", backdropFilter:"blur(20px)", borderTop:"1px solid var(--br)", zIndex:100 }}>
        <div style={{ maxWidth:680, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
            <span style={{ fontSize:12, color:"var(--t3)" }}>{steps.find(s => !s.d)?.l || "Tamamlanıyor..."}</span>
            <span style={{ fontSize:12, fontWeight:700, color:"var(--ac)" }}>{Math.round((steps.filter(s=>s.d).length / Math.max(steps.length,1)) * 100)}%</span>
          </div>
          <div style={{ height:3, background:"var(--b3)", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:3, background:"linear-gradient(90deg,var(--ac),var(--ac2))", width:`${(steps.filter(s=>s.d).length / Math.max(steps.length,1)) * 100}%`, transition:"width .8s cubic-bezier(.4,0,.2,1)", boxShadow:"0 0 10px var(--acg)" }} />
          </div>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════
  // PREVIEW
  // ════════════════════════════════════════
  if (pg === "preview" && code) return (
    <div style={{ height:"100vh", background:"var(--b1)" }}>
      <style>{G}</style><Toast /><PriceModal /><PayModal /><LogModal />
      <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
        {/* Sidebar */}
        {side && (
          <div style={{ width:280, minWidth:280, background:"var(--b2)", borderRight:"1px solid var(--br)", display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--br)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div onClick={() => setPg("home")} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg,var(--ac),var(--ac2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, animation:"glow 3s ease infinite" }}>⚡</div>
                <span style={{ fontWeight:700, fontSize:14 }}>AppForge</span>
              </div>
              <button className="hv" onClick={() => setSide(false)} style={{ background:"none", border:"none", color:"var(--t3)", cursor:"pointer", fontSize:16, padding:"2px 6px", borderRadius:6 }}>✕</button>
            </div>
            {/* Credits */}
            <div style={{ padding:"10px 14px", borderBottom:"1px solid var(--br)" }}>
              <CreditBar compact />
            </div>
            {/* New */}
            <div style={{ padding:"8px 12px" }}><button onClick={() => { setPg("home"); setPrompt(""); setCode(""); setHist([]); setTestRes(null); }} className="hv" style={{ width:"100%", padding:9, borderRadius:10, border:"1px dashed var(--br)", background:"transparent", color:"var(--t2)", cursor:"pointer", fontFamily:"'Sora'", fontSize:12, fontWeight:500 }}>＋ Yeni Proje</button></div>
            {/* Projects */}
            <div style={{ flex:1, overflowY:"auto", padding:"0 10px" }}>
              <div style={{ fontSize:10, fontWeight:600, color:"var(--t3)", textTransform:"uppercase", letterSpacing:2, padding:"6px 8px" }}>Projeler</div>
              {projs.map(p => (
                <div key={p.id} className={`pj ${p.id === actProj ? "on" : ""}`} onClick={() => { setActProj(p.id); setCode(p.code); setTestRes(null); }} style={{ padding:"9px 11px", borderRadius:8, cursor:"pointer", marginBottom:3, border:"1px solid transparent" }}>
                  <div style={{ fontSize:12, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize:9, color:"var(--t3)" }}>{p.date}</div>
                </div>
              ))}
            </div>
            {/* Edit */}
            <div style={{ borderTop:"1px solid var(--br)", padding:12 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"var(--t3)", marginBottom:6 }}>✏️ Değişiklik Yap</div>
              <textarea value={editTxt} onChange={e => setEditTxt(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (editTxt.trim()) { build(editTxt, true); setEditTxt(""); } } }} placeholder="Ne değiştirmek istiyorsun?" rows={2} style={{ width:"100%", background:"var(--b1)", border:"1px solid var(--br)", borderRadius:8, color:"var(--t1)", fontSize:11, fontFamily:"'Sora'", padding:"8px 10px", resize:"none" }} />
              <button onClick={() => { if (editTxt.trim()) { build(editTxt, true); setEditTxt(""); } }} disabled={!editTxt.trim()} style={{ width:"100%", marginTop:6, padding:8, borderRadius:8, border:"none", background: editTxt.trim() ? "var(--ac)" : "var(--b3)", color: editTxt.trim() ? "#fff" : "var(--t3)", cursor: editTxt.trim() ? "pointer" : "default", fontFamily:"'Sora'", fontSize:11, fontWeight:600 }}>
                Güncelle {freeLeft() > 0 ? "(ücretsiz)" : `(${COSTS.edit} kredi)`}
              </button>
            </div>
          </div>
        )}

        {/* Main */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {/* Toolbar */}
          <div style={{ padding:"6px 14px", borderBottom:"1px solid var(--br)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--b2)", flexWrap:"wrap", gap:6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              {!side && <button className="hv" onClick={() => setSide(true)} style={{ background:"none", border:"1px solid var(--br)", color:"var(--t2)", cursor:"pointer", padding:"4px 10px", borderRadius:7, fontSize:14 }}>☰</button>}
              <div style={{ display:"flex", background:"var(--b1)", borderRadius:9, border:"1px solid var(--br)", overflow:"hidden" }}>
                <button onClick={() => setCodeV(false)} style={{ padding:"5px 14px", border:"none", fontSize:12, fontWeight:500, fontFamily:"'Sora'", cursor:"pointer", background: !codeV ? "var(--ac)" : "transparent", color: !codeV ? "#fff" : "var(--t3)", transition:"all .2s" }}>Önizleme</button>
                <button onClick={() => setCodeV(true)} style={{ padding:"5px 14px", border:"none", fontSize:12, fontWeight:500, fontFamily:"'Sora'", cursor:"pointer", background: codeV ? "var(--ac)" : "transparent", color: codeV ? "#fff" : "var(--t3)", transition:"all .2s" }}>{"</>"} Kod</button>
              </div>
            </div>
            <div style={{ display:"flex", gap:5, alignItems:"center" }}>
              <button onClick={runTest} disabled={testing} className="hv" style={{ padding:"5px 14px", borderRadius:8, border:"1px solid var(--c1)", background:"var(--c1s)", color:"var(--c1)", cursor: testing ? "wait" : "pointer", fontSize:12, fontFamily:"'Sora'", fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
                {testing ? <><span style={{ width:11, height:11, border:"2px solid var(--c1)", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", display:"inline-block" }} />Test…</> : <>🧪 Test ({COSTS.test})</>}
              </button>
              <button onClick={dl} className="hv" style={{ padding:"5px 12px", borderRadius:8, border:"1px solid var(--br)", background:"transparent", color:"var(--t2)", cursor:"pointer", fontSize:12, fontFamily:"'Sora'", fontWeight:500 }}>⬇ İndir</button>
              <button onClick={() => { const w = window.open(); w.document.write(code); w.document.close(); }} className="hv" style={{ padding:"5px 12px", borderRadius:8, border:"1px solid var(--br)", background:"transparent", color:"var(--t2)", cursor:"pointer", fontSize:12, fontFamily:"'Sora'", fontWeight:500 }}>↗ Aç</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex:1, overflow:"hidden", position:"relative" }}>
            {codeV ? (
              <div style={{ height:"100%", overflow:"auto", background:"#08080e" }}>
                <pre style={{ padding:20, fontSize:12, lineHeight:1.7, fontFamily:"'Fira Code',monospace", color:"#b4b4cc", whiteSpace:"pre-wrap", wordBreak:"break-all" }}>{code}</pre>
              </div>
            ) : (
              <iframe ref={iframe} title="preview" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style={{ width:"100%", height:"100%", border:"none", background:"#fff" }} />
            )}
            <TestPanel />
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}
